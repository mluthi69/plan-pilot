import { useImpersonation } from "@/contexts/ImpersonationContext";
import { X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImpersonationBanner() {
  const { isImpersonating, targetOrgName, targetUserName, stopImpersonating } = useImpersonation();

  if (!isImpersonating) return null;

  const label = targetOrgName
    ? `Viewing as tenant: ${targetOrgName}`
    : `Viewing as user: ${targetUserName}`;

  return (
    <div className="sticky top-0 z-[60] flex items-center justify-center gap-3 bg-warning px-4 py-2 text-warning-foreground text-sm font-medium">
      <Eye className="h-4 w-4" />
      <span>{label}</span>
      <Button
        size="sm"
        variant="ghost"
        className="ml-2 h-6 gap-1 text-warning-foreground hover:bg-warning/80"
        onClick={stopImpersonating}
      >
        <X className="h-3 w-3" />
        Exit
      </Button>
    </div>
  );
}
