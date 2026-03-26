import { useState } from "react";
import { Link } from "wouter";
import { useListContracts, useCreateContract, useListSuppliers } from "@workspace/api-client-react";
import { Card, Button, Input, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge, Dialog, Label } from "@/components/ui-library";
import { Search, Plus, Filter, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ContractsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const { data: contracts, isLoading } = useListContracts({ query: { riskLevel: riskFilter ? riskFilter as any : undefined } });
  
  const filteredContracts = contracts?.filter(c => 
    (c.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.contractNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <h1 className="text-3xl text-foreground text-glow">Contract Manifest</h1>
          <p className="text-muted-foreground font-mono mt-1">Registry of all active and pending agreements.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Register Contract
        </Button>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center bg-secondary/30">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by ID or title..." 
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select 
            className="bg-input border border-border h-10 px-3 rounded-sm text-sm font-mono focus:outline-none focus:border-primary"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center font-mono text-primary animate-pulse">Querying database...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID / Title</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Risk Vector</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts?.map(contract => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <div className="font-bold text-foreground">{contract.contractNumber}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{contract.title}</div>
                  </TableCell>
                  <TableCell>{(contract as any).supplierName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={contract.status === 'active' ? 'success' : contract.status === 'expired' ? 'destructive' : 'secondary'}>
                      {contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>{formatDate(contract.expiryDate)}</div>
                    <div className="text-xs text-muted-foreground">
                      T-Minus: {(contract as any).daysUntilExpiry !== null && (contract as any).daysUntilExpiry !== undefined ? `${(contract as any).daysUntilExpiry}d` : '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contract.riskLevel === 'high' ? 'destructive' : contract.riskLevel === 'medium' ? 'warning' : 'success'}>
                      {contract.riskLevel || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/contracts/${contract.id}`}>
                      <Button variant="outline" size="sm">INSPECT</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filteredContracts?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="font-mono text-muted-foreground">No records found matching parameters.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateContractDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

function CreateContractDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateContract();
  const { data: companies } = useListSuppliers();
  
  const [formData, setFormData] = useState({
    title: "",
    contractNumber: "",
    supplierCompanyId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.contractNumber || !formData.supplierCompanyId) return;
    
    try {
      await createMutation.mutateAsync({
        data: {
          title: formData.title,
          contractNumber: formData.contractNumber,
          supplierCompanyId: formData.supplierCompanyId,
          status: "pending",
        } as any
      });
      onOpenChange(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <h2 className="text-xl font-display font-bold uppercase mb-4 border-b border-border pb-2">Initialize New Contract</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Contract Identifier</Label>
          <Input 
            value={formData.contractNumber} 
            onChange={e => setFormData({...formData, contractNumber: e.target.value})} 
            placeholder="e.g. CTR-2026-001"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Title / Description</Label>
          <Input 
            value={formData.title} 
            onChange={e => setFormData({...formData, title: e.target.value})} 
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Assigned Supplier</Label>
          <select 
            className="w-full bg-input border border-border h-10 px-3 rounded-sm text-sm font-mono focus:border-primary"
            value={formData.supplierCompanyId}
            onChange={e => setFormData({...formData, supplierCompanyId: e.target.value})}
            required
          >
            <option value="">Select Supplier...</option>
            {(companies as any[])?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}{c.industryType ? ` (${c.industryType})` : ""}</option>
            ))}
          </select>
        </div>
        
        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Abort</Button>
          <Button type="submit" isLoading={createMutation.isPending}>Initialize</Button>
        </div>
      </form>
    </Dialog>
  );
}
