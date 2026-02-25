import { useNavigate } from "react-router-dom";
import { Search, Filter, Plus, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const participants = [
  { id: "P-1001", name: "Sarah Mitchell", ndisNo: "4312789456", planEnd: "15 Aug 2026", funding: "Plan Managed", budget: "$87,400", utilised: "42%", status: "active" },
  { id: "P-1002", name: "James Thornton", ndisNo: "4312654321", planEnd: "03 May 2026", funding: "Plan Managed", budget: "$124,200", utilised: "68%", status: "active" },
  { id: "P-1003", name: "Anika Rao", ndisNo: "4312987654", planEnd: "22 Nov 2026", funding: "Plan Managed", budget: "$56,800", utilised: "15%", status: "active" },
  { id: "P-1004", name: "David Lee", ndisNo: "4312111222", planEnd: "10 Mar 2026", funding: "Combo", budget: "$201,600", utilised: "81%", status: "review" },
  { id: "P-1005", name: "Emma Kelly", ndisNo: "4312333444", planEnd: "28 Jun 2026", funding: "Plan Managed", budget: "$43,500", utilised: "55%", status: "active" },
  { id: "P-1006", name: "Mohammad Al-Farsi", ndisNo: "4312555666", planEnd: "01 Apr 2026", funding: "Plan Managed", budget: "$98,700", utilised: "73%", status: "active" },
  { id: "P-1007", name: "Lucy Chen", ndisNo: "4312777888", planEnd: "19 Sep 2026", funding: "Plan Managed", budget: "$67,100", utilised: "29%", status: "active" },
  { id: "P-1008", name: "Robert Nguyen", ndisNo: "4312999000", planEnd: "07 Feb 2026", funding: "Plan Managed", budget: "$112,000", utilised: "91%", status: "expiring" },
];

function ParticipantStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-success/10 text-success border-success/20",
    review: "bg-warning/10 text-warning border-warning/20",
    expiring: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <Badge variant="outline" className={`text-[11px] font-medium capitalize ${styles[status] || ""}`}>
      {status}
    </Badge>
  );
}

export default function Participants() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Participants</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage participant records and plan details</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Participant
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, NDIS number..."
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-medium">Name</th>
                <th className="px-5 py-2.5 text-left font-medium">NDIS No.</th>
                <th className="px-5 py-2.5 text-left font-medium">Plan End</th>
                <th className="px-5 py-2.5 text-left font-medium">Funding</th>
                <th className="px-5 py-2.5 text-right font-medium">Budget</th>
                <th className="px-5 py-2.5 text-right font-medium">Utilised</th>
                <th className="px-5 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-left font-medium" />
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id} onClick={() => navigate(`/participants/${p.id}`)} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                  <td className="px-5 py-3">
                    <p className="font-medium text-card-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.id}</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{p.ndisNo}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{p.planEnd}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{p.funding}</td>
                  <td className="px-5 py-3 text-right font-medium text-card-foreground">{p.budget}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-accent"
                          style={{ width: p.utilised }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{p.utilised}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><ParticipantStatusBadge status={p.status} /></td>
                  <td className="px-5 py-3">
                    <button className="rounded p-1 text-muted-foreground hover:bg-muted transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
