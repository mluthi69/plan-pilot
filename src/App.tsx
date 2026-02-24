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
import Providers from "./pages/Providers";
import TasksAndNotes from "./pages/TasksAndNotes";
import PriceGuide from "./pages/PriceGuide";
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
            <Route path="/providers" element={<Providers />} />
            <Route path="/tasks" element={<TasksAndNotes />} />
            <Route path="/price-guide" element={<PriceGuide />} />
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
