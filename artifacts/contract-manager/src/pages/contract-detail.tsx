import { useParams, Link } from "wouter";
import { useGetContract, useAnalyzeContract, useListDocuments } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, DataDisplay, Badge, Button, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui-library";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft, BrainCircuit, FileText, CheckCircle, Download } from "lucide-react";
import { motion } from "framer-motion";

export default function ContractDetail() {
  const { id } = useParams();
  
  const { data: contract, isLoading, refetch } = useGetContract(id as any, { query: { enabled: !!id } });
  const { data: documents } = useListDocuments();
  const analyzeMutation = useAnalyzeContract();

  if (isLoading) return <div className="p-8 text-primary font-mono animate-pulse">Decrypting secure file...</div>;
  if (!contract) return <div>Contract not found.</div>;

  const handleAnalyze = async () => {
    try {
      await analyzeMutation.mutateAsync({ id: id as any });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-4 mb-2">
        <Link href="/contracts">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-primary/30 text-primary">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-display font-bold uppercase text-glow">{contract.contractNumber}</h1>
        <Badge variant={contract.status === 'active' ? 'success' : 'secondary'}>{contract.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="border-b border-border/50 pb-4 mb-4">
            <CardTitle>Metadata Parameters</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <DataDisplay label="Title" value={contract.title} className="col-span-2" />
            <DataDisplay label="Supplier" value={(contract as any).supplierName ?? "—"} />
            <DataDisplay label="Value" value={formatCurrency(contract.value, contract.currency || "USD")} />
            <DataDisplay label="Effective Date" value={formatDate(contract.effectiveDate)} />
            <DataDisplay label="Expiry Date" value={formatDate(contract.expiryDate)} />
            <DataDisplay label="Auto-Renewal" value={contract.autoRenewal ? "ENABLED" : "DISABLED"} />
            <DataDisplay label="Renewal Terms" value={contract.autoRenewalTerms} />
            <DataDisplay label="Notes" value={(contract as any).notes} className="col-span-2" />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className={`border-t-4 ${contract.riskLevel === 'high' ? 'border-t-destructive bg-destructive/5' : contract.riskLevel === 'medium' ? 'border-t-warning' : 'border-t-success'}`}>
            <CardHeader className="pb-2">
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <div className="p-6 text-center">
              <div className="text-5xl font-mono font-bold mb-2">
                T-{(contract as any).daysUntilExpiry !== null && (contract as any).daysUntilExpiry !== undefined ? (contract as any).daysUntilExpiry : '??'}
              </div>
              <p className="text-sm font-mono text-muted-foreground uppercase mb-4">Days Until Expiry</p>
              <Badge variant={contract.riskLevel === 'high' ? 'destructive' : contract.riskLevel === 'medium' ? 'warning' : 'success'} className="px-4 py-1 text-sm">
                {contract.riskLevel ? `${contract.riskLevel} RISK VECTOR` : 'UNASSESSED'}
              </Badge>
            </div>
          </Card>

          <Card className="border border-primary/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="flex items-center text-primary">
                <BrainCircuit className="w-5 h-5 mr-2" />
                AI Analysis Engine
              </CardTitle>
            </CardHeader>
            <div className="p-6 relative z-10">
              {contract.aiExtracted ? (
                <div className="space-y-4">
                  <div className="flex items-center text-success font-mono text-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Extraction Complete
                  </div>
                  <p className="text-xs text-muted-foreground">Parameters extracted via Sentry AI.</p>
                  <Button className="w-full" variant="outline" onClick={handleAnalyze} isLoading={analyzeMutation.isPending}>
                    Re-Run Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground font-mono">Document not processed. Missing vital telemetry parameters.</p>
                  <Button className="w-full shadow-[0_0_15px_rgba(6,182,212,0.5)]" onClick={handleAnalyze} isLoading={analyzeMutation.isPending}>
                    {analyzeMutation.isPending ? "Scanning Vector..." : "Initialize AI Extraction"}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Attached Vault Archives
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date Uploaded</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents?.map(doc => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium text-primary">{doc.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-[10px]">{(doc as any).docType ?? "—"}</Badge>
                </TableCell>
                <TableCell>{formatDate(doc.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}>
                    <Download className="w-4 h-4 mr-2" />
                    Fetch
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!documents || documents.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground font-mono">
                  No encrypted archives linked to this contract.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}
