import { Router } from "express";
import { db, usersTable, companiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyPassword, hashPassword } from "../lib/auth.js";
import { logAudit } from "../lib/audit.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  (req as any).session.userId = user.id;
  (req as any).session.userRole = user.role;
  (req as any).session.companyId = user.companyId;

  await logAudit({ userId: user.id, action: "login", req });

  const { passwordHash: _ph, ...safeUser } = user;
  return res.json({ user: safeUser, message: "Login successful" });
});

router.post("/logout", async (req, res) => {
  const session = (req as any).session;
  const userId = session.userId;
  if (userId) await logAudit({ userId, action: "logout", req });
  session.destroy(() => res.json({ message: "Logged out" }));
});

router.get("/me", async (req, res) => {
  const userId = (req as any).session?.userId;
  if (!userId) return res.status(401).json({ error: "Not authenticated" });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return res.status(401).json({ error: "User not found" });

  const { passwordHash: _ph, ...safeUser } = user;
  return res.json(safeUser);
});

export default router;
