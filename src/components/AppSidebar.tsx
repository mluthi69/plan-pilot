import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  ClipboardList,
  Settings,
  Bell,
  Zap,
  BookOpen,
  Building2,
  Search,
  ChevronDown,
} from "lucide-react";

const navSections = [
  {
    label: "Overview",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/participants", icon: Users, label: "Participants" },
      { to: "/plans", icon: Wallet, label: "Plans & Budgets" },
      { to: "/invoices", icon: FileText, label: "Invoices" },
      { to: "/providers", icon: Building2, label: "Providers" },
    ],
  },
  {
    label: "Coordination",
    items: [
      { to: "/tasks", icon: ClipboardList, label: "Tasks & Notes" },
      { to: "/price-guide", icon: BookOpen, label: "Price Guide" },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/automations", icon: Zap, label: "Automations" },
      { to: "/notifications", icon: Bell, label: "Notifications" },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export default function AppSidebar({ onNavigate }: AppSidebarProps) {
  return (
    <aside className="flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground shrink-0 sticky top-0">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary">
          <span className="text-xs font-bold text-sidebar-primary-foreground">N</span>
        </div>
        <span className="text-sm font-semibold text-sidebar-accent-foreground">NDIS Ops</span>
      </div>

      {/* Tenant selector */}
      <button className="mx-3 mt-3 flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-xs text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors">
        <Building2 className="h-3.5 w-3.5 text-sidebar-muted" />
        <span className="flex-1 truncate text-left">Acme Plan Managers</span>
        <ChevronDown className="h-3 w-3 text-sidebar-muted" />
      </button>

      {/* Search */}
      <div className="mx-3 mt-3">
        <div className="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/30 px-3 py-1.5 text-xs text-sidebar-muted">
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
          <kbd className="ml-auto hidden sm:inline-block rounded border border-sidebar-border bg-sidebar-accent/50 px-1 py-0.5 text-[10px] text-sidebar-muted">⌘K</kbd>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
              {section.label}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium text-sidebar-accent-foreground">Jane Doe</p>
            <p className="truncate text-[10px] text-sidebar-muted">Plan Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
