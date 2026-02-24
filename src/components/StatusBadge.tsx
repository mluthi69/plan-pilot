import { Badge } from "@/components/ui/badge";

export type InvoiceStatus = "pending" | "approved" | "processing" | "paid" | "exception";

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "Approved", className: "bg-info/10 text-info border-info/20" },
  processing: { label: "Processing", className: "bg-accent/10 text-accent border-accent/20" },
  paid: { label: "Paid", className: "bg-success/10 text-success border-success/20" },
  exception: { label: "Exception", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function StatusBadge({ status }: { status: InvoiceStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`text-[11px] font-medium ${config.className}`}>
      {config.label}
    </Badge>
  );
}
