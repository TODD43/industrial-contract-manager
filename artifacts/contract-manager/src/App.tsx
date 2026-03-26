import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ContractsList from "@/pages/contracts";
import ContractDetail from "@/pages/contract-detail";
import ExpiryCalendar from "@/pages/calendar";
import DocumentVault from "@/pages/vault";
import AuditTrail from "@/pages/audit";
import Suppliers from "@/pages/suppliers";
import UserManagement from "@/pages/users";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/contracts" component={ContractsList} />
        <Route path="/contracts/:id" component={ContractDetail} />
        <Route path="/calendar" component={ExpiryCalendar} />
        <Route path="/vault" component={DocumentVault} />
        <Route path="/audit" component={AuditTrail} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/users" component={UserManagement} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      {/* All other routes are protected under Layout */}
      <Route path="*">
        <ProtectedRouter />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
