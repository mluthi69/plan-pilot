import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, Calendar, ClipboardCheck, FileSignature, Receipt, FileText } from "lucide-react";
import { useVisits } from "@/hooks/useVisits";
import { useBookings } from "@/hooks/useBookings";
import { useAgreements } from "@/hooks/useAgreements";
import { useInvoices } from "@/hooks/useInvoices";
import { useDraftInvoiceCandidates } from "@/hooks/useDraftInvoices";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

export default function Exceptions() {
  const today = new Date();
  const { data: visits = [] } = useVisits();
  const { data: bookings = [] } = useBookings({
    from: startOfDay(today).toISOString(),
    to: new Date(today.getTime() + 7 * 86400000).toISOString(),
  });
  const { data: agreements = [] } = useAgreements();
  const { data: invoices = [] } = useInvoices();
  const { data: drafts = [] } = useDraftInvoiceCandidates();

  const groups: { title: string; icon: any; items: { id: string; label: string; sub: string; to: string }[] }[] = [
    {
      title: "Visits without notes",
      icon: ClipboardCheck,
      items: visits
        .filter((v) => v.status === "completed" && !v.notes_submitted)
        .map((v) => ({
          id: v.id,
          label: v.participant?.name ?? "Participant",
          sub: `Completed ${new Date(v.actual_end ?? v.scheduled_end).toLocaleString("en-AU")}`,
          to: `/visits/${v.id}`,
        })),
    },
    {
      title: "Unsigned visits",
      icon: ClipboardCheck,
      items: visits
        .filter((v) => v.status === "completed" && !v.participant_signed)
        .map((v) => ({
          id: v.id,
          label: v.participant?.name ?? "Participant",
          sub: `Completed ${new Date(v.actual_end ?? v.scheduled_end).toLocaleString("en-AU")}`,
          to: `/visits/${v.id}`,
        })),
    },
    {
      title: "Unallocated bookings (next 7 days)",
      icon: Calendar,
      items: bookings
        .filter((b) => b.staff.length === 0 && b.status !== "cancelled")
        .map((b) => ({
          id: b.id,
          label: b.participant?.name ?? "Participant",
          sub: new Date(b.starts_at).toLocaleString("en-AU"),
          to: `/schedule`,
        })),
    },
    {
      title: "Cancellations & no-shows",
      icon: AlertTriangle,
      items: visits
        .filter((v) => v.status === "cancelled" || v.status === "no_show")
        .map((v) => ({
          id: v.id,
          label: `${v.participant?.name ?? "Participant"} — ${v.status.replace("_", " ")}`,
          sub: new Date(v.scheduled_start).toLocaleString("en-AU"),
          to: `/visits/${v.id}`,
        })),
    },
    {
      title: "Agreements expiring within 30 days",
      icon: FileSignature,
      items: agreements
        .filter((a) => {
          if (a.status !== "active") return false;
          const days = (new Date(a.end_date).getTime() - today.getTime()) / 86400000;
          return days <= 30 && days >= 0;
        })
        .map((a) => ({
          id: a.id,
          label: a.title,
          sub: `Ends ${new Date(a.end_date).toLocaleDateString("en-AU")}`,
          to: `/agreements`,
        })),
    },
    {
      title: "Visits ready to invoice",
      icon: FileText,
      items: drafts
        .filter((d) => d.warnings.length === 0 && d.amount && d.amount > 0)
        .map((d) => ({
          id: d.visit_id,
          label: `${d.participant_name} — $${d.amount?.toFixed(2)}`,
          sub: `${d.duration_hours}h · ${new Date(d.scheduled_start).toLocaleDateString("en-AU")}`,
          to: `/invoices/drafts`,
        })),
    },
    {
      title: "Rejected invoices",
      icon: Receipt,
      items: invoices
        .filter((i) => i.status === "rejected" || i.status === "exception")
        .map((i) => ({
          id: i.id,
          label: `${i.invoice_number} — $${Number(i.amount).toFixed(2)}`,
          sub: `${i.participant?.name ?? "—"} · ${i.status}`,
          to: `/invoices`,
        })),
    },
  ];

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Exceptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total === 0 ? "Nothing to resolve right now." : `${total} item${total === 1 ? "" : "s"} need attention.`}
        </p>
      </div>

      {groups.map((g) => (
        <section key={g.title} className="rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <g.icon className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">{g.title}</h2>
            <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {g.items.length}
            </span>
          </div>
          {g.items.length === 0 ? (
            <div className="px-4 py-4 text-xs text-muted-foreground">No items.</div>
          ) : (
            <ul className="divide-y divide-border">
              {g.items.map((it) => (
                <li key={it.id}>
                  <Link to={it.to} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium">{it.label}</p>
                      <p className="text-xs text-muted-foreground">{it.sub}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}