import { Link } from "wouter";
import { Button, Card } from "@/components/ui-library";
import { AlertOctagon } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      <Card className="max-w-md w-full text-center p-8 border-destructive/50 shadow-[0_0_50px_rgba(239,68,68,0.2)] bg-card/80 backdrop-blur-md relative z-10">
        <AlertOctagon className="w-20 h-20 text-destructive mx-auto mb-6 animate-pulse" />
        <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-widest text-glow-destructive">ERR 404</h1>
        <p className="font-mono text-muted-foreground mb-8 uppercase tracking-widest text-sm">Target sector does not exist or access is restricted.</p>
        
        <Link href="/">
          <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Return to Telemetry Hub
          </Button>
        </Link>
      </Card>
    </div>
  );
}
