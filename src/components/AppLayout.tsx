import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Bell, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

export default function AppLayout() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      {!isMobile && <AppSidebar />}

      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 sm:px-6 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary transition-colors">
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-60 p-0 bg-sidebar border-sidebar-border">
                  <AppSidebar onNavigate={() => setOpen(false)} />
                </SheetContent>
              </Sheet>
            )}
            {isMobile && (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                  <span className="text-xs font-bold text-primary-foreground">N</span>
                </div>
                <span className="text-sm font-semibold text-foreground">NDIS Ops</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-md p-1.5 text-muted-foreground hover:bg-secondary transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
