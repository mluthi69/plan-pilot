import { BarChart3 } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visit utilisation, exceptions, and claim readiness.</p>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-card py-16 text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Coming in Slice 3</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Operational reports follow once daily-loop data flows through bookings, visits, and notes.
        </p>
      </div>
    </div>
  );
}