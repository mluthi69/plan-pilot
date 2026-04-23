import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useParticipants, useCreateParticipant } from "@/hooks/useParticipantsDb";

function ParticipantStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-success/10 text-success border-success/20",
    review: "bg-warning/10 text-warning border-warning/20",
    expiring: "bg-destructive/10 text-destructive border-destructive/20",
    inactive: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={`text-[11px] font-medium capitalize ${styles[status] || ""}`}>
      {status}
    </Badge>
  );
}

function AddParticipantDialog() {
  const [open, setOpen] = useState(false);
  const create = useCreateParticipant();
  const [form, setForm] = useState({
    name: "", ndis_number: "", email: "", phone: "", address: "",
    plan_start: "", plan_end: "", total_budget: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({
      name: form.name,
      ndis_number: form.ndis_number,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      plan_start: form.plan_start || null,
      plan_end: form.plan_end || null,
      total_budget: form.total_budget ? Number(form.total_budget) : 0,
      status: "active",
      date_of_birth: null,
    } as any);
    setOpen(false);
    setForm({ name: "", ndis_number: "", email: "", phone: "", address: "", plan_start: "", plan_end: "", total_budget: "" });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Participant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New participant</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>NDIS number</Label>
              <Input value={form.ndis_number} onChange={(e) => setForm({ ...form, ndis_number: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5"><Label>Plan start</Label><Input type="date" value={form.plan_start} onChange={(e) => setForm({ ...form, plan_start: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Plan end</Label><Input type="date" value={form.plan_end} onChange={(e) => setForm({ ...form, plan_end: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Total budget</Label><Input type="number" value={form.total_budget} onChange={(e) => setForm({ ...form, total_budget: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving…" : "Add participant"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Participants() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: participants = [], isLoading } = useParticipants();

  const filtered = participants.filter((p) =>
    [p.name, p.ndis_number, p.email].filter(Boolean).some((s) => s!.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Participants</h1>
          <p className="mt-1 text-sm text-muted-foreground">Operational truth for every participant: contacts, agreements, visits, notes.</p>
        </div>
        <AddParticipantDialog />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, NDIS number..."
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {participants.length === 0 ? "No participants yet. Add your first." : "No matches."}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 text-left font-medium">Name</th>
                  <th className="px-5 py-2.5 text-left font-medium">NDIS No.</th>
                  <th className="px-5 py-2.5 text-left font-medium">Plan End</th>
                  <th className="px-5 py-2.5 text-right font-medium">Budget</th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                  <th className="px-5 py-2.5 text-left font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} onClick={() => navigate(`/participants/${p.id}`)} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                    <td className="px-5 py-3">
                      <p className="font-medium text-card-foreground">{p.name}</p>
                      {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{p.ndis_number}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {p.plan_end ? new Date(p.plan_end).toLocaleDateString("en-AU") : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">
                      ${Number(p.total_budget).toLocaleString("en-AU")}
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
          )}
        </div>
      </div>
    </div>
  );
}
