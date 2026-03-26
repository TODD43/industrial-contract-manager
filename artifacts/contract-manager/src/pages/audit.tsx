import { useListAuditLogs } from "@workspace/api-client-react";
import { Card, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from "@/components/ui-library";
import { History, Search } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function AuditTrail() {
  const { data: auditData, isLoading } = useListAuditLogs({ limit: 100 });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl text-foreground text-glow flex items-center">
            <History className="w-8 h-8 mr-3 text-primary" />
            Audit Ledger
          </h1>
          <p className="text-muted-foreground font-mono mt-1">Immutable cryptographic log of system interactions.</p>
        </div>
        <div className="px-3 py-1 bg-destructive/10 border border-destructive text-destructive font-mono text-xs rounded-sm animate-pulse">
          CONFIDENTIAL
        </div>
      </div>

      <Card className="flex-1 p-0 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-8 text-center font-mono text-primary animate-pulse">Decrypting ledger blocks...</div>
        ) : (
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead className="w-48">Timestamp</TableHead>
                  <TableHead>Operative</TableHead>
                  <TableHead>Action Vector</TableHead>
                  <TableHead>Target Artifact</TableHead>
                  <TableHead>IP Trace</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData?.logs?.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">{formatDateTime(log.createdAt)}</TableCell>
                    <TableCell className="text-foreground font-bold">{log.userName || log.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`
                        ${log.action === 'login' ? 'border-success text-success' : ''}
                        ${log.action === 'download' || log.action === 'view' ? 'border-primary text-primary' : ''}
                        ${log.action === 'delete' ? 'border-destructive text-destructive' : ''}
                      `}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {log.documentName || `Contract ${log.contractId}` || '--'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{log.ipAddress || '127.0.0.1'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
