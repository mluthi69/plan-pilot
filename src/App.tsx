import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { ImpersonationProvider } from "./contexts/ImpersonationContext";
import AppLayout from "./components/AppLayout";
import AdminLayout from "./components/AdminLayout";
import RequireSystemAdmin from "./components/RequireSystemAdmin";
import Dashboard from "./pages/Dashboard";
import Participants from "./pages/Participants";
import ParticipantDetail from "./pages/ParticipantDetail";
import ProviderDetail from "./pages/ProviderDetail";
import Providers from "./pages/Providers";
import TasksAndNotes from "./pages/TasksAndNotes";
import PriceGuide from "./pages/PriceGuide";
import Automations from "./pages/Automations";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Schedule from "./pages/Schedule";
import Visits from "./pages/Visits";
import VisitDetail from "./pages/VisitDetail";
import MyDay from "./pages/MyDay";
import Agreements from "./pages/Agreements";
import Exceptions from "./pages/Exceptions";
import Documents from "./pages/Documents";
import Reports from "./pages/Reports";
import Invoices from "./pages/Invoices";
import InvoiceDrafts from "./pages/InvoiceDrafts";
import Staff from "./pages/Staff";
import StaffDetail from "./pages/StaffDetail";
import SignInPage from "./pages/SignIn";
import SignUpPage from "./pages/SignUp";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTenants from "./pages/admin/AdminTenants";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPlatformSettings from "./pages/admin/AdminPlatformSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ImpersonationProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />

            {/* Super Admin routes */}
            <Route
              element={
                <>
                  <SignedIn>
                    <RequireSystemAdmin>
                      <AdminLayout />
                    </RequireSystemAdmin>
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/tenants" element={<AdminTenants />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/platform-settings" element={<AdminPlatformSettings />} />
            </Route>

            {/* Protected app routes */}
            <Route
              element={
                <>
                  <SignedIn>
                    <AppLayout />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/visits" element={<Visits />} />
              <Route path="/visits/:id" element={<VisitDetail />} />
              <Route path="/my-day" element={<MyDay />} />
              <Route path="/participants" element={<Participants />} />
              <Route path="/participants/:id" element={<ParticipantDetail />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/staff/:id" element={<StaffDetail />} />
              <Route path="/agreements" element={<Agreements />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/drafts" element={<InvoiceDrafts />} />
              <Route path="/exceptions" element={<Exceptions />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/providers" element={<Providers />} />
              <Route path="/providers/:id" element={<ProviderDetail />} />
              <Route path="/tasks" element={<TasksAndNotes />} />
              <Route path="/price-guide" element={<PriceGuide />} />
              <Route path="/automations" element={<Automations />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ImpersonationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
