import { useState } from "react";
import { useListUsers, useCreateUser, useListSuppliers } from "@workspace/api-client-react";
import { Card, Button, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge, Dialog, Input, Label } from "@/components/ui-library";
import { Users, Plus, ShieldAlert } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function UserManagement() {
  const { data: users, isLoading, refetch } = useListUsers();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl text-foreground text-glow flex items-center">
            <Users className="w-8 h-8 mr-3 text-primary" />
            Operative Roster
          </h1>
          <p className="text-muted-foreground font-mono mt-1">Identity and access management control panel.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Provision Access
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center font-mono text-primary animate-pulse">Loading identities...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operative Name</TableHead>
                <TableHead>Identifier</TableHead>
                <TableHead>Clearance Level</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Provision Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-bold text-foreground">{(user as any).fullName ?? user.email}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'supplier' ? 'warning' : 'primary' as any}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {(user as any).companyId ? (user as any).companyId.slice(0, 8) + '…' : 'INTERNAL'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{formatDate(user.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={() => refetch()} />
    </div>
  );
}

function CreateUserDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const createMutation = useCreateUser();
  const { data: companies } = useListSuppliers();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "auditor" as string,
    companyId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role as any,
          companyId: formData.companyId || undefined,
        } as any
      });
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <h2 className="text-xl font-display font-bold uppercase mb-4 border-b border-border pb-2 flex items-center">
        <ShieldAlert className="w-5 h-5 mr-2 text-destructive" />
        Provision New Operative
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label>Identifier (Email)</Label>
          <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label>Temporary Password</Label>
          <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label>Clearance Role</Label>
          <select 
            className="w-full bg-input border border-border h-10 px-3 rounded-sm text-sm font-mono focus:border-primary"
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
          >
            <option value="auditor">Auditor (Read-Only)</option>
            <option value="supplier">Supplier (External Vendor)</option>
            <option value="admin">Admin (Full Access)</option>
          </select>
        </div>
        
        <div className="space-y-2 p-3 border border-border/50 bg-secondary/20 rounded-sm">
          <Label>Link to Company Entity</Label>
          <select 
            className="w-full bg-input border border-border h-10 px-3 rounded-sm text-sm font-mono focus:border-primary"
            value={formData.companyId}
            onChange={e => setFormData({...formData, companyId: e.target.value})}
          >
            <option value="">None (Internal)</option>
            {companies?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}{c.industryType ? ` — ${c.industryType}` : ""}</option>
            ))}
          </select>
        </div>
        
        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Abort</Button>
          <Button type="submit" isLoading={createMutation.isPending}>Issue Credentials</Button>
        </div>
      </form>
    </Dialog>
  );
}
