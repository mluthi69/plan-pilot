import { FolderOpen } from "lucide-react";

export default function Documents() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">Participant agreements, IDs, plans, and visit attachments.</p>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card py-16 text-center">
        <FolderOpen className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Coming in Slice 2</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Visit attachments are already captured. The unified document library lands with agreements.
        </p>
      </div>
    </div>
  );
}