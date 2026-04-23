import { NavLink } from "react-router-dom";
import { Home, Calendar, ClipboardCheck, Users, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUserRole } from "@/hooks/useUserRole";

const primary = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/schedule", icon: Calendar, label: "Schedule" },
  { to: "/my-day", icon: ClipboardCheck, label: "My Day" },
  { to: "/participants", icon: Users, label: "People" },
];

const moreItems = [
  { to: "/visits", label: "Visits" },
  { to: "/agreements", label: "Agreements" },
  { to: "/invoices", label: "Invoices" },
  { to: "/exceptions", label: "Exceptions" },
  { to: "/documents", label: "Documents" },
  { to: "/reports", label: "Reports" },
  { to: "/settings", label: "Settings" },
];

export default function MobileBottomBar() {
  const [open, setOpen] = useState(false);
  const { isSupportWorker } = useUserRole();

  // Workers go straight to My Day, not Schedule.
  const items = isSupportWorker
    ? [
        { to: "/my-day", icon: Home, label: "My Day", end: true },
        { to: "/visits", icon: ClipboardCheck, label: "Visits" },
        { to: "/participants", icon: Users, label: "People" },
      ]
    : primary;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={(item as any).end}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground">
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <div className="grid grid-cols-2 gap-2 pt-4">
            {moreItems.map((m) => (
              <NavLink
                key={m.to}
                to={m.to}
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground hover:bg-secondary"
              >
                {m.label}
              </NavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}