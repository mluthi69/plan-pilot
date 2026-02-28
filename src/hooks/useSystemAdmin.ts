import { useUser } from "@clerk/clerk-react";

export function useSystemAdmin() {
  const { user, isLoaded } = useUser();
  const isSystemAdmin = (user?.publicMetadata as { role?: string })?.role === "system_admin";
  return { isSystemAdmin, isLoaded };
}
