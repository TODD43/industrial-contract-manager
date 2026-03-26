import { Router } from "express";
import { db, auditLogsTable, usersTable, documentsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { userId, documentId, action, limit = "50", offset = "0" } = req.query;

  const conditions: any[] = [];
  if (userId) conditions.push(eq(auditLogsTable.userId, userId as string));
  if (documentId) conditions.push(eq(auditLogsTable.documentId, documentId as string));
  if (action) conditions.push(eq(auditLogsTable.action, action as string));

  const baseQuery = db
    .select({
      id: auditLogsTable.id,
      userId: auditLogsTable.userId,
      userName: usersTable.fullName,
      userEmail: usersTable.email,
      action: auditLogsTable.action,
      documentId: auditLogsTable.documentId,
      documentTitle: documentsTable.title,
      ipAddress: auditLogsTable.ipAddress,
      timestamp: auditLogsTable.timestamp,
    })
    .from(auditLogsTable)
    .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
    .leftJoin(documentsTable, eq(auditLogsTable.documentId, documentsTable.id))
    .orderBy(desc(auditLogsTable.timestamp))
    .limit(Number(limit))
    .offset(Number(offset));

  const logs = conditions.length > 0
    ? await baseQuery.where(and(...conditions))
    : await baseQuery;

  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(auditLogsTable);
  const total = Number(totalResult[0]?.count ?? 0);

  res.json({ logs, total, limit: Number(limit), offset: Number(offset) });
});

export default router;
