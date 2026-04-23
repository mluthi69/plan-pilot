import { useOrganization, useUser } from "@clerk/clerk-react";

/**
 * MVP role keys used throughout the app.
 * Clerk org roles map onto these:
 *   org:admin             -> "owner"          (full access)
 *   org:coordinator       -> "coordinator"
 *   org:finance           -> "finance"
 *   org:support_worker    -> "support_worker"
 *   org:member (fallback) -> "coordinator"    (sane default for early tenants)
 */
export type AppRole =
  | "owner"
  | "coordinator"
  | "finance"
  | "support_worker";

const CLERK_TO_APP: Record<string, AppRole> = {
  "org:admin": "owner",
  "org:coordinator": "coordinator",
  "org:finance": "finance",
  "org:support_worker": "support_worker",
  "org:member": "coordinator",
};

export function useUserRole(): {
  role: AppRole;
  isLoaded: boolean;
  isOwner: boolean;
  isCoordinator: boolean;
  isFinance: boolean;
  isSupportWorker: boolean;
} {
  const { membership, isLoaded: orgLoaded } = useOrganization();
  const { user, isLoaded: userLoaded } = useUser();

  // Public metadata override (lets a tenant assign a more specific role
  // without re-keying Clerk org roles).
  const metaRole = (user?.publicMetadata?.app_role as AppRole | undefined) ?? null;

  const clerkRole = membership?.role ?? "";
  const mapped = CLERK_TO_APP[clerkRole];

  const role: AppRole = metaRole ?? mapped ?? "coordinator";

  return {
    role,
    isLoaded: orgLoaded && userLoaded,
    isOwner: role === "owner",
    isCoordinator: role === "coordinator" || role === "owner",
    isFinance: role === "finance" || role === "owner",
    isSupportWorker: role === "support_worker",
  };
}

/**
 * Returns true if the current user's role is in `allowed`.
 * Owners always pass.
 */
export function hasAnyRole(role: AppRole, allowed: AppRole[]): boolean {
  if (role === "owner") return true;
  return allowed.includes(role);
}