import { useGetRiskSummary, useListContracts, useListAuditLogs } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui-library";
import { Activity, AlertTriangle, CheckCircle, Clock, ShieldCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatDateTime } from "@/lib/utils";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetRiskSummary();
  const { data: recentContracts } = useListContracts({ query: { status: "active" } });
  const { data: auditLogs } = useListAuditLogs({ limit: 5 });

  if (isLoadingSummary) return <div className="p-8 text-primary font-mono animate-pulse">Gathering telemetry...</div>;

  const chartData = [
    { name: "High", value: summary?.highRisk || 0, color: "hsl(var(--destructive))" },
    { name: "Medium", value: summary?.mediumRisk || 0, color: "hsl(var(--warning))" },
    { name: "Low", value: summary?.lowRisk || 0, color: "hsl(var(--success))" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl text-foreground text-glow">Global Telemetry</h1>
          <p className="text-muted-foreground font-mono mt-1">System status overview and risk analysis.</p>
        </div>
        <div className="flex items-center px-4 py-2 bg-secondary rounded-sm border border-border">
          <Activity className="w-5 h-5 text-primary mr-2 animate-pulse" />
          <span className="font-mono text-sm tracking-widest">REAL-TIME MONITORING</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Active Contracts</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6 flex items-center justify-between">
            <div className="text-4xl font-mono font-bold">{summary?.active || 0}</div>
            <FileTextIcon className="w-8 h-8 text-primary/50" />
          </div>
        </Card>
        
        <Card className="border-t-4 border-t-destructive bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive">Critical Risk (High)</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6 flex items-center justify-between">
            <div className="text-4xl font-mono font-bold text-destructive">{summary?.highRisk || 0}</div>
            <AlertTriangle className="w-8 h-8 text-destructive/50" />
          </div>
        </Card>

        <Card className="border-t-4 border-t-warning">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-warning">Elevated Risk (Med)</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6 flex items-center justify-between">
            <div className="text-4xl font-mono font-bold text-warning">{summary?.mediumRisk || 0}</div>
            <AlertTriangle className="w-8 h-8 text-warning/50" />
          </div>
        </Card>

        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Expiring Within 30d</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6 flex items-center justify-between">
            <div className="text-4xl font-mono font-bold text-primary">{summary?.expiringSoon || 0}</div>
            <Clock className="w-8 h-8 text-primary/50" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{fontFamily: 'var(--font-mono)'}} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{fontFamily: 'var(--font-mono)'}} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--secondary))'}} 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'var(--font-mono)' }} 
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Priority Contracts */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Priority Watchlist</CardTitle>
            <Link href="/contracts">
              <span className="text-xs font-mono text-primary hover:underline cursor-pointer">VIEW_ALL()</span>
            </Link>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identifier</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>T-Minus (Days)</TableHead>
                <TableHead>Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(recentContracts || []).sort((a,b) => (a.daysUntilExpiry||999) - (b.daysUntilExpiry||999)).slice(0, 5).map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/contracts/${c.id}`} className="text-primary hover:underline font-bold">
                      {c.contractNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{c.supplierName}</TableCell>
                  <TableCell>
                    <span className={`font-bold ${c.daysUntilExpiry && c.daysUntilExpiry < 30 ? 'text-destructive' : ''}`}>
                      {c.daysUntilExpiry !== null ? c.daysUntilExpiry : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.riskLevel === 'high' ? 'destructive' : c.riskLevel === 'medium' ? 'warning' : 'success'}>
                      {c.riskLevel || 'unknown'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Audit Log Snippet */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <ShieldCheck className="w-5 h-5 text-primary mr-2" />
            <CardTitle>Recent System Events</CardTitle>
          </div>
        </CardHeader>
        <Table>
          <TableBody>
            {auditLogs?.logs?.map(log => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground w-48">{formatDateTime(log.createdAt)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="mr-2 font-mono text-[10px]">{log.action}</Badge>
                  <span className="text-foreground">{log.userName}</span>
                </TableCell>
                <TableCell className="text-right text-muted-foreground truncate max-w-[200px]">
                  {log.documentName || log.contractId || '-'}
                </TableCell>
              </TableRow>
            ))}
            {(!auditLogs?.logs || auditLogs.logs.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No recent events logged.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// Inline icon component to avoid missing import
function FileTextIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}
