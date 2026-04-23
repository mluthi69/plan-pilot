import { NavLink } from "react-router-dom";
import { OrganizationSwitcher, UserButton } from "@clerk/clerk-react";
import { useSystemAdmin } from "@/hooks/useSystemAdmin";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import {
  LayoutDashboard,
  Calendar,
  Users,
  ClipboardCheck,
  FileSignature,
  Receipt,
  AlertTriangle,
  FolderOpen,
  BarChart3,
  Settings,
  Search,
  Shield,
  Plus,
} from "lucide-react";

type NavItem = {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles?: AppRole[]; // visible to (in addition to owner, who always sees all)
};

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Today",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/schedule", icon: Calendar, label: "Schedule", roles: ["coordinator"] },
      { to: "/visits", icon: ClipboardCheck, label: "Visits" },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/participants", icon: Users, label: "Participants" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/agreements", icon: FileSignature, label: "Agreements", roles: ["coordinator", "finance"] },
      { to: "/invoices", icon: Receipt, label: "Invoices", roles: ["finance"] },
      { to: "/exceptions", icon: AlertTriangle, label: "Exceptions", roles: ["coordinator", "finance"] },
    ],
  },
  {
    label: "Workspace",
    items: [
      { to: "/documents", icon: FolderOpen, label: "Documents" },
      { to: "/reports", icon: BarChart3, label: "Reports", roles: ["coordinator", "finance"] },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export default function AppSidebar({ onNavigate }: AppSidebarProps) {
  const { isSystemAdmin } = useSystemAdmin();
  const { role } = useUserRole();

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (it) => !it.roles || role === "owner" || it.roles.includes(role),
      ),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <aside className="flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground shrink-0 sticky top-0">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary">
          <span className="text-xs font-bold text-sidebar-primary-foreground">N</span>
        </div>
        <span className="text-sm font-semibold text-sidebar-accent-foreground">NDIS Ops</span>
      </div>

      {/* Tenant selector — Clerk OrganizationSwitcher */}
      <div className="mx-3 mt-3">
        <OrganizationSwitcher
          hidePersonal
          appearance={{
            elements: {
              rootBox: "w-full",
              organizationSwitcherTrigger:
                "w-full flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-xs text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors",
            },
          }}
          afterCreateOrganizationUrl="/"
          afterLeaveOrganizationUrl="/"
          afterSelectOrganizationUrl="/"
        />
      </div>

      {/* Search */}
      <div className="mx-3 mt-3">
        <div className="flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/30 px-3 py-1.5 text-xs text-sidebar-muted">
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
          <kbd className="ml-auto hidden sm:inline-block rounded border border-sidebar-border bg-sidebar-accent/50 px-1 py-0.5 text-[10px] text-sidebar-muted">⌘K</kbd>
        </div>
      </div>

      {/* Quick create */}
      {role !== "support_worker" && (
        <div className="mx-3 mt-2">
          <NavLink
            to="/schedule?create=1"
            onClick={onNavigate}
            className="flex items-center justify-center gap-2 rounded-md bg-sidebar-primary px-2 py-1.5 text-xs font-semibold text-sidebar-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            New booking
          </NavLink>
        </div>
      )}

      {/* Nav */}
      <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-4">
        {visibleSections.map((section) => (
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

      {/* Admin link */}
      {isSystemAdmin && (
        <div className="mx-3 mb-2">
          <NavLink
            to="/admin"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-md bg-destructive/10 px-2 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
          >
            <Shield className="h-4 w-4" />
            Super Admin
          </NavLink>
        </div>
      )}

      {/* User — Clerk UserButton */}
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
