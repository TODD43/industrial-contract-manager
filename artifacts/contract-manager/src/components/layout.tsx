import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Users, 
  Building2, 
  FolderLock, 
  History,
  LogOut,
  Menu,
  Activity
} from "lucide-react";
import { Button } from "./ui-library";
import { motion } from "framer-motion";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Telemetry", icon: LayoutDashboard, roles: ["admin", "auditor", "supplier"] },
  { href: "/contracts", label: "Contracts", icon: FileText, roles: ["admin", "auditor", "supplier"] },
  { href: "/calendar", label: "Expiry Matrix", icon: Calendar, roles: ["admin", "auditor"] },
  { href: "/vault", label: "Secure Vault", icon: FolderLock, roles: ["admin", "auditor", "supplier"] },
  { href: "/suppliers", label: "Suppliers", icon: Building2, roles: ["admin", "auditor"] },
  { href: "/users", label: "Operatives", icon: Users, roles: ["admin"] },
  { href: "/audit", label: "Audit Ledger", icon: History, roles: ["admin", "auditor"] },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });
  const logoutMutation = useLogout();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-primary">
        <Activity className="w-16 h-16 animate-pulse mb-4" />
        <h2 className="font-display tracking-widest uppercase text-xl text-glow">Establishing Secure Connection...</h2>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const allowedNavItems = navItems.filter(item => item.roles.includes(user.role));

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : -300 }}
        className="fixed md:relative z-40 w-64 h-screen border-r border-border bg-card/95 backdrop-blur flex flex-col"
      >
        <div className="h-16 flex items-center px-6 border-b border-border">
          <ShieldAlert className="w-6 h-6 text-primary mr-3" />
          <span className="font-display font-bold uppercase tracking-widest text-primary text-glow text-lg">SENTRY</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-display font-bold mb-4 px-2">Access Grid</div>
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="block">
                <Button 
                  variant={isActive ? "secondary" : "ghost"} 
                  className={`w-full justify-start ${isActive ? 'border-l-2 border-primary text-primary' : ''}`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border bg-secondary/20">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-sm bg-accent flex items-center justify-center text-primary font-bold mr-3 border border-primary/30">
              {(user.fullName ?? user.email ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user.fullName ?? user.email}</p>
              <p className="text-[10px] text-primary uppercase tracking-widest font-mono">{user.role}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full text-muted-foreground hover:text-destructive hover:border-destructive" onClick={handleLogout} isLoading={logoutMutation.isPending}>
            <LogOut className="w-4 h-4 mr-2" />
            Terminate Session
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center px-4 md:px-6 justify-between shrink-0">
          <div className="flex items-center">
            <button className="md:hidden mr-4 text-muted-foreground hover:text-primary" onClick={() => setSidebarOpen(!isSidebarOpen)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2 text-xs font-mono text-muted-foreground">
              <span className="animate-pulse w-2 h-2 rounded-full bg-success block"></span>
              <span>SYSTEM.ONLINE</span>
              <span className="px-2">|</span>
              <span>{new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="text-xs font-mono px-3 py-1 border border-border bg-background rounded-sm">
                ENCRYPTION: ACTIVE
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
      
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
