import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useGetMe } from "@workspace/api-client-react";
import { Card, Button, Input, Label } from "@/components/ui-library";
import { ShieldAlert, Fingerprint } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  const loginMutation = useLogin();
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });

  if (isLoading) return null;
  if (user) {
    setLocation("/");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await loginMutation.mutateAsync({ data: { email, password } });
      setLocation("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Access denied.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 opacity-30">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Secure vault background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      {/* Cyberpunk Grid Overlay */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md p-4"
      >
        <div className="text-center mb-8">
          <motion.div 
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 5 }}
            className="inline-block"
          >
            <ShieldAlert className="w-16 h-16 mx-auto text-primary mb-4 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold tracking-widest uppercase text-white mb-2">Sentry Protocol</h1>
          <p className="font-mono text-primary text-sm tracking-widest uppercase">Industrial Contract & Supplier Manager</p>
        </div>

        <Card className="border-primary/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-card/60">
          <div className="p-2 border-b border-border/50 mb-6 flex items-center font-mono text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse mr-2"></span>
            AUTHORIZATION REQUIRED
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Operative Identifier (Email)</Label>
              <Input
                id="email"
                type="email"
                placeholder="sysadmin@sentry.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 border-primary/20 focus:border-primary"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Security Clearance (Password)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50 border-primary/20 focus:border-primary"
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/50 text-destructive text-sm font-mono rounded-sm">
                <span className="font-bold mr-2">ERR:</span>{error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-lg mt-4 group" isLoading={loginMutation.isPending}>
              <Fingerprint className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              Initialize Session
            </Button>
          </form>
          
          <div className="mt-6 text-center font-mono text-[10px] text-muted-foreground">
            <p>UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED.</p>
            <p>ALL ACTIONS ARE LOGGED AND MONITORED.</p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
