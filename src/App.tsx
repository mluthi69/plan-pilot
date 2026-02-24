import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Participants from "./pages/Participants";
import Invoices from "./pages/Invoices";
import Plans from "./pages/Plans";
import PlaceholderPage from "./components/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/participants" element={<Participants />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/providers" element={<PlaceholderPage title="Providers" description="Manage registered and unregistered service providers, ABN verification, and invoice routing." />} />
            <Route path="/tasks" element={<PlaceholderPage title="Tasks & Notes" description="Support coordination tasks, case notes, contact logs, and participant goals tracking." />} />
            <Route path="/price-guide" element={<PlaceholderPage title="NDIA Price Guide" description="NDIS Pricing Arrangements and Price Limits engine with regional/remote modifiers." />} />
            <Route path="/automations" element={<PlaceholderPage title="Automations" description="Configure event routing, webhooks, email connectors, and integration endpoints." />} />
            <Route path="/notifications" element={<PlaceholderPage title="Notifications" description="View and manage system notifications, alerts, and approval requests." />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" description="Tenant configuration, branding, workflows, permissions, and integrations." />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
