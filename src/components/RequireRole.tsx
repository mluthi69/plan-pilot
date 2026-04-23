import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useUserRole, hasAnyRole, type AppRole } from "@/hooks/useUserRole";

interface RequireRoleProps {
  allowedRoles: AppRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RequireRole({ allowedRoles, children, fallback }: RequireRoleProps) {
  const { role, isLoaded } = useUserRole();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasAnyRole(role, allowedRoles)) {
    return fallback ? <>{fallback}</> : <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
