import { useSystemAdmin } from "@/hooks/useSystemAdmin";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

export default function RequireSystemAdmin({ children }: { children: ReactNode }) {
  const { isSystemAdmin, isLoaded } = useSystemAdmin();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isSystemAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
