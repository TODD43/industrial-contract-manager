import { db, auditLogsTable } from "@workspace/db";
import { Request } from "express";

export async function logAudit(params: {
  userId: string;
  action: string;
  documentId?: string;
  contractId?: string;
  req?: Request;
  metadata?: string;
}) {
  try {
    await db.insert(auditLogsTable).values({
      userId: params.userId,
      action: params.action,
      documentId: params.documentId ?? null,
      ipAddress: params.req
        ? (params.req.ip ?? params.req.socket.remoteAddress ?? null)
        : null,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}
