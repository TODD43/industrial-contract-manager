import { useState, useRef } from "react";
import { useListDocuments, useUploadDocument, useListSuppliers } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, Button, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge, Input, Label, Dialog } from "@/components/ui-library";
import { UploadCloud, File, Download, Trash2, Shield, FileText, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function DocumentVault() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: documents, isLoading, refetch } = useListDocuments();

  const filteredDocs = documents?.filter(d => {
    const term = searchTerm.toLowerCase();
    return (
      (d.title ?? "").toLowerCase().includes(term) ||
      (d.docType ?? "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <h1 className="text-3xl text-foreground text-glow">Secure Vault</h1>
          <p className="text-muted-foreground font-mono mt-1">Encrypted repository for compliance artifacts and schematics.</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="shadow-[0_0_20px_rgba(6,182,212,0.4)]">
          <UploadCloud className="w-5 h-5 mr-2" />
          Transmit Artifact
        </Button>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center bg-secondary/30">
         <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search artifacts by name or type..." 
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      <Card className="flex-1 p-0 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-8 text-center font-mono text-primary animate-pulse">Accessing encrypted sectors...</div>
        ) : (
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>Artifact Name</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs?.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium flex items-center">
                      <File className="w-4 h-4 text-primary mr-3 opacity-70" />
                      <span className="text-glow">{doc.title}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] border-primary/30 text-primary uppercase">
                        {doc.docType ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {doc.expiryDate ? formatDate(doc.expiryDate) : <span className="opacity-40">No expiry</span>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatDate(doc.createdAt)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="secondary" size="sm" onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (confirm(`Delete "${doc.title}"?`)) {
                          fetch(`/api/documents/${doc.id}`, { method: "DELETE" }).then(() => refetch());
                        }
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDocs?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="max-w-xs mx-auto text-center opacity-50">
                        <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="font-mono text-muted-foreground">Sector is empty. No artifacts found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <UploadModal open={isUploadOpen} onOpenChange={setIsUploadOpen} onSuccess={() => refetch()} />
    </div>
  );
}

function UploadModal({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const uploadMutation = useUploadDocument();
  const { data: companies } = useListSuppliers();
  
  const [file, setFile] = useState<File | null>(null);
  const [targetVendorId, setTargetVendorId] = useState("");
  const [docType, setDocType] = useState("contract");
  const [title, setTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !targetVendorId || !title) return;
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("targetVendorId", targetVendorId);
      formData.append("docType", docType);

      await fetch("/api/documents/upload", { method: "POST", body: formData });
      onOpenChange(false);
      onSuccess();
      setFile(null);
      setTitle("");
      setTargetVendorId("");
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <h2 className="text-xl font-display font-bold uppercase mb-4 border-b border-border pb-2 flex items-center">
        <Shield className="w-5 h-5 mr-2 text-primary" />
        Secure Transmission
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div 
          className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-colors ${file ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-secondary/50'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept=".pdf,.dwg,.docx"
          />
          {file ? (
            <div className="space-y-2">
              <FileText className="w-10 h-10 text-primary mx-auto" />
              <p className="font-mono text-primary font-bold">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="space-y-2 opacity-70">
              <UploadCloud className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="font-mono font-bold uppercase text-sm">Select Payload</p>
              <p className="text-xs text-muted-foreground">Support for .PDF, .DWG (Max 50MB)</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Artifact Title</Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Engine Mount Drawing v4.0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Target Supplier Entity</Label>
          <select 
            className="w-full bg-input border border-border h-10 px-3 rounded-sm text-sm font-mono focus:border-primary"
            value={targetVendorId}
            onChange={e => setTargetVendorId(e.target.value)}
            required
          >
            <option value="">Select Entity...</option>
            {companies?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}{c.industryType ? ` (${c.industryType})` : ""}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Classification</Label>
          <select 
            className="w-full bg-input border border-border h-10 px-3 rounded-sm text-sm font-mono focus:border-primary"
            value={docType}
            onChange={e => setDocType(e.target.value)}
          >
            <option value="contract">Legal Contract</option>
            <option value="drawing">Technical Schematic (.DWG)</option>
            <option value="sop">Standard Operating Procedure</option>
          </select>
        </div>
        
        <div className="pt-4 flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Abort</Button>
          <Button type="submit" disabled={!file || !targetVendorId || !title} isLoading={uploadMutation.isPending}>Transmit Payload</Button>
        </div>
      </form>
    </Dialog>
  );
}
