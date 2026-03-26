import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth.js";

const router = Router();

router.get("/", async (_req, res) => {
  const users = await db.select({
    id: usersTable.id,
    companyId: usersTable.companyId,
    fullName: usersTable.fullName,
    email: usersTable.email,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable);
  res.json(users);
});

router.post("/", async (req, res) => {
  const { email, fullName, password, role, companyId } = req.body;
  if (!email || !fullName || !password || !role) {
    return res.status(400).json({ error: "email, fullName, password, role required" });
  }
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    email, fullName, passwordHash, role, companyId: companyId ?? null,
  }).returning({
    id: usersTable.id, companyId: usersTable.companyId, fullName: usersTable.fullName,
    email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt,
  });
  return res.status(201).json(user);
});

router.get("/:id", async (req, res) => {
  const [user] = await db.select({
    id: usersTable.id, companyId: usersTable.companyId, fullName: usersTable.fullName,
    email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.id, req.params.id));
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

router.put("/:id", async (req, res) => {
  const { email, fullName, role, companyId } = req.body;
  const [user] = await db.update(usersTable)
    .set({ email, fullName, role, companyId: companyId ?? null })
    .where(eq(usersTable.id, req.params.id))
    .returning({
      id: usersTable.id, companyId: usersTable.companyId, fullName: usersTable.fullName,
      email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt,
    });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

router.delete("/:id", async (req, res) => {
  await db.delete(usersTable).where(eq(usersTable.id, req.params.id));
  res.status(204).end();
});

export default router;
