import { Router } from "express";
import { db, companiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// /api/suppliers is aliased to companies for backward compatibility with the generated API client

router.get("/", async (_req, res) => {
  const companies = await db.select().from(companiesTable);
  res.json(companies);
});

router.get("/:id", async (req, res) => {
  const [company] = await db.select().from(companiesTable).where(eq(companiesTable.id, req.params.id));
  if (!company) return res.status(404).json({ error: "Not found" });
  res.json(company);
});

router.post("/", async (req, res) => {
  const { name, industryType } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const [company] = await db.insert(companiesTable).values({ name, industryType: industryType ?? null }).returning();
  return res.status(201).json(company);
});

router.put("/:id", async (req, res) => {
  const { name, industryType } = req.body;
  const [company] = await db.update(companiesTable).set({ name, industryType: industryType ?? null })
    .where(eq(companiesTable.id, req.params.id)).returning();
  if (!company) return res.status(404).json({ error: "Not found" });
  res.json(company);
});

export default router;
