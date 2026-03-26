import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, documentsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logAudit } from "../lib/audit.js";

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".pdf", ".dwg", ".dxf", ".png", ".jpg", ".jpeg", ".docx", ".xlsx"];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error("File type not allowed"));
  },
});

router.get("/", async (req, res) => {
  const session = (req as any).session;
  const userId: string | undefined = session?.userId;
  const userRole: string | undefined = session?.userRole;
  const companyId: string | undefined = session?.companyId;

  let docs = await db.select().from(documentsTable);

  // THE INTELLECTUAL PROPERTY SHIELD:
  // Suppliers can ONLY see documents where they are the designated target vendor.
  if (userRole === "supplier" && companyId) {
    docs = docs.filter((d) => d.targetVendorId === companyId);
  }

  res.json(docs);
});

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const session = (req as any).session;
  const userId: string = session?.userId ?? "system";

  const { ownerCompanyId, targetVendorId, title, docType, expiryDate } = req.body;
  if (!title || !ownerCompanyId) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "title and ownerCompanyId required" });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  const [doc] = await db.insert(documentsTable).values({
    ownerCompanyId,
    targetVendorId: targetVendorId ?? null,
    title,
    fileUrl,
    docType: (docType as any) ?? null,
    expiryDate: expiryDate ?? null,
    isEncrypted: true,
  }).returning();

  await logAudit({ userId, action: "uploaded", documentId: doc.id, req });

  res.status(201).json(doc);
});

router.get("/:id", async (req, res) => {
  const session = (req as any).session;
  const userId: string | undefined = session?.userId;
  const userRole: string | undefined = session?.userRole;
  const companyId: string | undefined = session?.companyId;

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, req.params.id));
  if (!doc) return res.status(404).json({ error: "Not found" });

  // THE INTELLECTUAL PROPERTY SHIELD — exact implementation from spec:
  // If I am a supplier, I can ONLY see it if it was specifically assigned to my company.
  if (userRole === "supplier" && doc.targetVendorId !== companyId) {
    return res.status(403).json({
      error: "Access Forbidden: Intellectual Property Shield Active.",
    });
  }

  if (userId) await logAudit({ userId, action: "viewed", documentId: doc.id, req });
  res.json(doc);
});

router.get("/:id/download", async (req, res) => {
  const session = (req as any).session;
  const userId: string | undefined = session?.userId;
  const userRole: string | undefined = session?.userRole;
  const companyId: string | undefined = session?.companyId;

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, req.params.id));
  if (!doc) return res.status(404).json({ error: "Not found" });

  // SAME SHIELD for downloads
  if (userRole === "supplier" && doc.targetVendorId !== companyId) {
    return res.status(403).json({
      error: "Access Forbidden: Intellectual Property Shield Active.",
    });
  }

  const filePath = path.join(process.cwd(), doc.fileUrl.replace(/^\//, ""));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found on disk" });

  if (userId) await logAudit({ userId, action: "downloaded", documentId: doc.id, req });
  res.download(filePath, path.basename(doc.fileUrl));
});

router.delete("/:id", async (req, res) => {
  const session = (req as any).session;
  const userId: string | undefined = session?.userId;

  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, req.params.id));
  if (!doc) return res.status(404).json({ error: "Not found" });

  if (userId) await logAudit({ userId, action: "deleted", documentId: doc.id, req });

  try {
    const filePath = path.join(process.cwd(), doc.fileUrl.replace(/^\//, ""));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {}

  await db.delete(documentsTable).where(eq(documentsTable.id, req.params.id));
  res.status(204).end();
});

export default router;
