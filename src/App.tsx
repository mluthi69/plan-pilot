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
              <Route path="/participants" element={<Participants />} />
              <Route path="/participants/:id" element={<ParticipantDetail />} />
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
