import { useOrganization } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface RequireRoleProps {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RequireRole({ allowedRoles, children, fallback }: RequireRoleProps) {
  const { membership, isLoaded } = useOrganization();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const userRole = membership?.role ?? "";

  if (!allowedRoles.includes(userRole)) {
    return fallback ? <>{fallback}</> : <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
