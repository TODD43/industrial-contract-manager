import { useState } from "react";
import { useListSuppliers, useCreateSupplier } from "@workspace/api-client-react";
import { Card, Button, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge, Dialog, Input, Label } from "@/components/ui-library";
import { Building2, Plus } from "lucide-react";

export default function Suppliers() {
  const { data: companies, isLoading, refetch } = useListSuppliers();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl text-foreground text-glow flex items-center">
            <Building2 className="w-8 h-8 mr-3 text-primary" />
            Supplier Network
          </h1>
          <p className="text-muted-foreground font-mono mt-1">Directory of external entities and vendor organisations.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Entity
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center font-mono text-primary animate-pulse">Scanning network...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity Name</TableHead>
                <TableHead>Industry Sector</TableHead>
                <TableHead>Entity ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(companies as any[])?.map((company: any) => (
                <TableRow key={company.id}>
                  <TableCell className="font-bold text-foreground">{company.name}</TableCell>
                  <TableCell>
                    {company.industryType ? (
                      <Badge variant="outline" className="font-mono text-[10px] border-primary/30 text-primary">
                        {company.industryType}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {company.id?.slice(0, 8)}…
                  </TableCell>
                </TableRow>
              ))}
              {(!companies || (companies as any[]).length === 0) && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground font-mono">No entities found in network.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateEntityDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={() => refetch()} />
    </div>
  );
}

function CreateEntityDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const createMutation = useCreateSupplier();
  
  const [formData, setFormData] = useState({
    name: "",
    industryType: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          name: formData.name,
          industryType: formData.industryType || undefined,
        } as any
      });
      onOpenChange(false);
      onSuccess();
      setFormData({ name: "", industryType: "" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <h2 className="text-xl font-display font-bold uppercase mb-4 border-b border-border pb-2">Register New Entity</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Legal Name</Label>
          <Input 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            placeholder="e.g. Apex Industrial Solutions"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Industry Sector</Label>
          <select 
            className="w-full bg-input border border-border h-10 px-3 rounded-sm text-sm font-mono focus:border-primary"
            value={formData.industryType}
            onChange={e => setFormData({...formData, industryType: e.target.value})}
          >
            <option value="">Select sector...</option>
            <option value="Aerospace & Defense">Aerospace &amp; Defense</option>
            <option value="Automotive">Automotive</option>
            <option value="Heavy Manufacturing">Heavy Manufacturing</option>
            <option value="Electronics">Electronics</option>
            <option value="FMCG">FMCG</option>
            <option value="Energy">Energy</option>
            <option value="Logistics">Logistics</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Abort</Button>
          <Button type="submit" isLoading={createMutation.isPending}>Commit Record</Button>
        </div>
      </form>
    </Dialog>
  );
}
