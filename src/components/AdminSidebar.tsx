import { NavLink } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  Shield,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/admin/tenants", icon: Building2, label: "Tenants" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/platform-settings", icon: Settings, label: "Platform Settings" },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  return (
    <aside className="flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground shrink-0 sticky top-0">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive">
          <Shield className="h-4 w-4 text-destructive-foreground" />
        </div>
        <span className="text-sm font-semibold text-sidebar-accent-foreground">Super Admin</span>
      </div>

      {/* Back to app */}
      <div className="mx-3 mt-3">
        <NavLink
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/30 px-3 py-1.5 text-xs text-sidebar-muted hover:bg-sidebar-accent/50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to App
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">
          Administration
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
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
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <UserButton
          showName
          appearance={{
            elements: {
              rootBox: "w-full",
              userButtonBox: "w-full flex-row-reverse justify-end",
              userButtonOuterIdentifier: "text-xs font-medium text-sidebar-accent-foreground",
              avatarBox: "h-7 w-7",
            },
          }}
        />
      </div>
    </aside>
  );
}
