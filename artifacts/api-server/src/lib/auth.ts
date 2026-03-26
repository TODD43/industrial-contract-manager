import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getUserById(id: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  return user ?? null;
}

export function computeRiskLevel(expiryDate: string | null | undefined): {
  riskLevel: "low" | "medium" | "high";
  daysUntilExpiry: number | null;
  score: number;
} {
  if (!expiryDate) {
    return { riskLevel: "low", daysUntilExpiry: null, score: 0 };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let riskLevel: "low" | "medium" | "high";
  let score: number;

  if (daysUntilExpiry < 0) {
    riskLevel = "high";
    score = 100;
  } else if (daysUntilExpiry <= 30) {
    riskLevel = "high";
    score = 90 + (30 - daysUntilExpiry) / 30 * 10;
  } else if (daysUntilExpiry <= 90) {
    riskLevel = "medium";
    score = 50 + (90 - daysUntilExpiry) / 60 * 40;
  } else {
    riskLevel = "low";
    score = Math.max(0, 50 - (daysUntilExpiry - 90) / 275 * 50);
  }

  return { riskLevel, daysUntilExpiry, score: Math.round(score) };
}
