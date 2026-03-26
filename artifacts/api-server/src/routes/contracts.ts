import { Router } from "express";
import { db, contractsTable, companiesTable, documentsTable } from "@workspace/db";
import { eq, and, isNotNull } from "drizzle-orm";
import { computeRiskLevel } from "../lib/auth.js";
import { logAudit } from "../lib/audit.js";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

function enrichContract(contract: any) {
  const { riskLevel, daysUntilExpiry } = computeRiskLevel(contract.expiryDate);
  return { ...contract, riskLevel: contract.riskLevel ?? riskLevel, daysUntilExpiry };
}

router.get("/risk-summary", async (_req, res) => {
  const contracts = await db.select().from(contractsTable);
  let highRisk = 0, mediumRisk = 0, lowRisk = 0, expiringSoon = 0, expired = 0, active = 0;
  for (const c of contracts) {
    const { riskLevel, daysUntilExpiry } = computeRiskLevel(c.expiryDate);
    if (riskLevel === "high") highRisk++;
    else if (riskLevel === "medium") mediumRisk++;
    else lowRisk++;
    if (daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30) expiringSoon++;
    if (c.status === "expired" || (daysUntilExpiry !== null && daysUntilExpiry < 0)) expired++;
    if (c.status === "active") active++;
  }
  res.json({ total: contracts.length, highRisk, mediumRisk, lowRisk, expiringSoon, expired, active });
});

router.get("/expiry-calendar", async (req, res) => {
  const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
  const month = req.query.month ? Number(req.query.month) : undefined;

  const contracts = await db
    .select({
      id: contractsTable.id,
      title: contractsTable.title,
      expiryDate: contractsTable.expiryDate,
      status: contractsTable.status,
      riskLevel: contractsTable.riskLevel,
      supplierName: companiesTable.name,
    })
    .from(contractsTable)
    .leftJoin(companiesTable, eq(contractsTable.supplierCompanyId, companiesTable.id))
    .where(isNotNull(contractsTable.expiryDate));

  const calendarMap: Record<string, any[]> = {};
  for (const c of contracts) {
    if (!c.expiryDate) continue;
    const d = new Date(c.expiryDate);
    if (d.getFullYear() !== year) continue;
    if (month !== undefined && d.getMonth() + 1 !== month) continue;
    const key = c.expiryDate;
    if (!calendarMap[key]) calendarMap[key] = [];
    const { riskLevel } = computeRiskLevel(c.expiryDate);
    calendarMap[key].push({ id: c.id, title: c.title, supplierName: c.supplierName, riskLevel: c.riskLevel ?? riskLevel, status: c.status });
  }

  res.json(Object.entries(calendarMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, contracts]) => ({ date, contracts })));
});

router.get("/", async (req, res) => {
  const { supplierCompanyId, riskLevel, status } = req.query;

  const conditions: any[] = [];
  if (supplierCompanyId) conditions.push(eq(contractsTable.supplierCompanyId, supplierCompanyId as string));
  if (status) conditions.push(eq(contractsTable.status, status as any));

  const rows = await db
    .select({
      id: contractsTable.id,
      title: contractsTable.title,
      ownerCompanyId: contractsTable.ownerCompanyId,
      supplierCompanyId: contractsTable.supplierCompanyId,
      supplierName: companiesTable.name,
      contractNumber: contractsTable.contractNumber,
      status: contractsTable.status,
      effectiveDate: contractsTable.effectiveDate,
      expiryDate: contractsTable.expiryDate,
      autoRenewal: contractsTable.autoRenewal,
      autoRenewalTerms: contractsTable.autoRenewalTerms,
      value: contractsTable.value,
      currency: contractsTable.currency,
      riskLevel: contractsTable.riskLevel,
      aiExtracted: contractsTable.aiExtracted,
      notes: contractsTable.notes,
      createdAt: contractsTable.createdAt,
      updatedAt: contractsTable.updatedAt,
    })
    .from(contractsTable)
    .leftJoin(companiesTable, eq(contractsTable.supplierCompanyId, companiesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  let result = rows.map(enrichContract);
  if (riskLevel) result = result.filter((c) => c.riskLevel === riskLevel);
  res.json(result);
});

router.post("/", async (req, res) => {
  const { title, ownerCompanyId, supplierCompanyId, contractNumber, status, effectiveDate, expiryDate, autoRenewal, autoRenewalTerms, value, currency, notes } = req.body;
  if (!title || !contractNumber) return res.status(400).json({ error: "title, contractNumber required" });
  const { riskLevel } = computeRiskLevel(expiryDate);
  const [contract] = await db.insert(contractsTable).values({
    title, ownerCompanyId: ownerCompanyId ?? null, supplierCompanyId: supplierCompanyId ?? null,
    contractNumber, status: status ?? "pending",
    effectiveDate: effectiveDate ?? null, expiryDate: expiryDate ?? null,
    autoRenewal: autoRenewal ?? false, autoRenewalTerms: autoRenewalTerms ?? null,
    value: value ?? null, currency: currency ?? "USD", riskLevel, aiExtracted: false, notes: notes ?? null,
  }).returning();
  return res.status(201).json(enrichContract(contract));
});

router.get("/:id", async (req, res) => {
  const [contract] = await db
    .select({
      id: contractsTable.id,
      title: contractsTable.title,
      ownerCompanyId: contractsTable.ownerCompanyId,
      supplierCompanyId: contractsTable.supplierCompanyId,
      supplierName: companiesTable.name,
      contractNumber: contractsTable.contractNumber,
      status: contractsTable.status,
      effectiveDate: contractsTable.effectiveDate,
      expiryDate: contractsTable.expiryDate,
      autoRenewal: contractsTable.autoRenewal,
      autoRenewalTerms: contractsTable.autoRenewalTerms,
      value: contractsTable.value,
      currency: contractsTable.currency,
      riskLevel: contractsTable.riskLevel,
      aiExtracted: contractsTable.aiExtracted,
      aiRawExtraction: contractsTable.aiRawExtraction,
      notes: contractsTable.notes,
      createdAt: contractsTable.createdAt,
      updatedAt: contractsTable.updatedAt,
    })
    .from(contractsTable)
    .leftJoin(companiesTable, eq(contractsTable.supplierCompanyId, companiesTable.id))
    .where(eq(contractsTable.id, req.params.id));

  if (!contract) return res.status(404).json({ error: "Not found" });
  const userId = (req as any).session?.userId;
  if (userId) await logAudit({ userId, action: "viewed", contractId: contract.id, req });
  res.json(enrichContract(contract));
});

router.put("/:id", async (req, res) => {
  const { title, status, effectiveDate, expiryDate, autoRenewal, autoRenewalTerms, value, currency, notes } = req.body;
  const { riskLevel } = computeRiskLevel(expiryDate);
  const [contract] = await db.update(contractsTable).set({
    title, status, effectiveDate: effectiveDate ?? null, expiryDate: expiryDate ?? null,
    autoRenewal, autoRenewalTerms: autoRenewalTerms ?? null,
    value: value ?? null, currency, notes: notes ?? null, riskLevel, updatedAt: new Date(),
  }).where(eq(contractsTable.id, req.params.id)).returning();
  if (!contract) return res.status(404).json({ error: "Not found" });
  res.json(enrichContract(contract));
});

router.delete("/:id", async (req, res) => {
  await db.delete(contractsTable).where(eq(contractsTable.id, req.params.id));
  res.status(204).end();
});

router.post("/:id/analyze", async (req, res) => {
  const contractId = req.params.id;
  const userId = (req as any).session?.userId;

  const [existingContract] = await db.select().from(contractsTable).where(eq(contractsTable.id, contractId));
  if (!existingContract) return res.status(404).json({ error: "Contract not found" });

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.ownerCompanyId, existingContract.ownerCompanyId ?? ""));

  let contractText = "";
  if (doc) {
    const filePath = path.join(process.cwd(), doc.fileUrl.replace(/^\//, ""));
    if (fs.existsSync(filePath)) {
      try {
        const { default: pdfParse } = await import("pdf-parse");
        const buffer = fs.readFileSync(filePath);
        const parsed = await pdfParse(buffer);
        contractText = parsed.text.slice(0, 4000);
      } catch {}
    }
  }

  const prompt = `You are a contract analysis AI. Analyze the following contract and extract:
1. Effective Date (format: YYYY-MM-DD if found)
2. Expiry Date (format: YYYY-MM-DD if found)
3. Auto-Renewal Clause: yes/no and terms
4. Key Terms (up to 5 bullet points)

Contract title: ${existingContract.title}
Contract text: ${contractText || "(No PDF text available — use contract metadata only)"}

Respond ONLY with valid JSON:
{"effectiveDate":"YYYY-MM-DD or null","expiryDate":"YYYY-MM-DD or null","autoRenewal":true/false,"autoRenewalTerms":"terms or null","keyTerms":["term1","term2"],"confidence":0.0}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });
    const rawText = completion.choices[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try {
      const m = rawText.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    } catch {}

    const { riskLevel } = computeRiskLevel(parsed.expiryDate);
    await db.update(contractsTable).set({
      effectiveDate: parsed.effectiveDate ?? existingContract.effectiveDate,
      expiryDate: parsed.expiryDate ?? existingContract.expiryDate,
      autoRenewal: parsed.autoRenewal ?? existingContract.autoRenewal,
      autoRenewalTerms: parsed.autoRenewalTerms ?? existingContract.autoRenewalTerms,
      riskLevel, aiExtracted: true, aiRawExtraction: rawText, updatedAt: new Date(),
    }).where(eq(contractsTable.id, contractId));

    if (userId) await logAudit({ userId, action: "analyzed", contractId, req });

    res.json({ effectiveDate: parsed.effectiveDate ?? null, expiryDate: parsed.expiryDate ?? null, autoRenewal: parsed.autoRenewal ?? false, autoRenewalTerms: parsed.autoRenewalTerms ?? null, keyTerms: parsed.keyTerms ?? [], confidence: parsed.confidence ?? 0, rawExtraction: rawText });
  } catch (err: any) {
    res.status(500).json({ error: "AI analysis failed", details: err.message });
  }
});

router.get("/:id/risk", async (req, res) => {
  const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, req.params.id));
  if (!contract) return res.status(404).json({ error: "Not found" });

  const { riskLevel, daysUntilExpiry, score } = computeRiskLevel(contract.expiryDate);
  const factors: string[] = [];
  if (daysUntilExpiry !== null && daysUntilExpiry < 0) factors.push("Contract has already expired");
  else if (daysUntilExpiry !== null && daysUntilExpiry <= 30) factors.push(`Expires in ${daysUntilExpiry} days`);
  else if (daysUntilExpiry !== null && daysUntilExpiry <= 90) factors.push(`Expires in ${daysUntilExpiry} days (within 90-day window)`);
  if (contract.autoRenewal) factors.push("Auto-renewal clause active");
  if (!contract.expiryDate) factors.push("No expiry date set");

  const recommendation = riskLevel === "high"
    ? "Immediate action required. Initiate renewal or termination process."
    : riskLevel === "medium"
    ? "Schedule renewal review within 30 days."
    : "Contract is in good standing. Review at next quarterly check.";

  res.json({ contractId: contract.id, riskLevel, daysUntilExpiry, score, factors, recommendation });
});

export default router;
