import { createContext, useContext, useState, type ReactNode } from "react";

interface ImpersonationState {
  isImpersonating: boolean;
  targetOrgId: string | null;
  targetOrgName: string | null;
  targetUserId: string | null;
  targetUserName: string | null;
  startImpersonatingOrg: (orgId: string, orgName: string) => void;
  startImpersonatingUser: (userId: string, userName: string) => void;
  stopImpersonating: () => void;
}

const ImpersonationContext = createContext<ImpersonationState | null>(null);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [targetOrgId, setTargetOrgId] = useState<string | null>(null);
  const [targetOrgName, setTargetOrgName] = useState<string | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetUserName, setTargetUserName] = useState<string | null>(null);

  const isImpersonating = !!(targetOrgId || targetUserId);

  const startImpersonatingOrg = (orgId: string, orgName: string) => {
    setTargetOrgId(orgId);
    setTargetOrgName(orgName);
    setTargetUserId(null);
    setTargetUserName(null);
  };

  const startImpersonatingUser = (userId: string, userName: string) => {
    setTargetUserId(userId);
    setTargetUserName(userName);
    setTargetOrgId(null);
    setTargetOrgName(null);
  };

  const stopImpersonating = () => {
    setTargetOrgId(null);
    setTargetOrgName(null);
    setTargetUserId(null);
    setTargetUserName(null);
  };

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        targetOrgId,
        targetOrgName,
        targetUserId,
        targetUserName,
        startImpersonatingOrg,
        startImpersonatingUser,
        stopImpersonating,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) throw new Error("useImpersonation must be used within ImpersonationProvider");
  return ctx;
}
