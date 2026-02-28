import { Outlet } from "react-router-dom";
import { useState } from "react";
import { Menu, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import AdminSidebar from "./AdminSidebar";
import ImpersonationBanner from "./ImpersonationBanner";

export default function AdminLayout() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {!isMobile && <AdminSidebar />}
      <div className="flex flex-1 flex-col">
        <ImpersonationBanner />
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {isMobile && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="rounded-md p-1.5 hover:bg-muted">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-60 p-0">
                <AdminSidebar onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
          )}
          <Shield className="h-4 w-4 text-destructive" />
          <h1 className="text-sm font-semibold">Platform Administration</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
