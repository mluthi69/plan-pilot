import { useOrganization } from "@clerk/clerk-react";

export function useOrgId(): string | null {
  const { organization } = useOrganization();
  return organization?.id ?? null;
}
