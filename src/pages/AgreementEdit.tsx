import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Send, CheckCircle2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrg";
import { useParticipants } from "@/hooks/useParticipantsDb";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { AgreementStatus, AgreementItem, ServiceAgreement } from "@/hooks/useAgreements";

const DEFAULT_TERMS = {
  cancellation:
    "Short notice cancellations (less than 7 clear days) may be charged at 100% of the agreed price as per the NDIS Pricing Arrangements and Price Limits.",
  travel:
    "Travel time and travel expenses for non-labour costs may be claimed in line with the NDIS Pricing Arrangements (e.g. MMM regions).",
};

const SAMPLE_ITEMS: { code: string; description: string; unit_price: number }[] = [
  { code: "01_011_0107_1_1", description: "Assistance With Self-Care Activities - Standard - Weekday Daytime", unit_price: 70.23 },
  { code: "01_015_0107_1_1", description: "Assistance With Self-Care Activities - Standard - Weekday Evening", unit_price: 77.38 },
  { code: "04_104_0125_6_1", description: "Access Community Social and Rec Activities - Standard - Weekday Daytime", unit_price: 70.23 },
  { code: "07_001_0106_8_3", description: "Support Coordination Level 2", unit_price: 100.14 },
  { code: "15_038_0117_1_3", description: "Improved Daily Living - Therapy Assistant Level 2", unit_price: 86.79 },
];

export default function AgreementEdit() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const orgId = useOrgId();
  const { user } = useUser();
  const qc = useQueryClient();
  const { data: participants = [] } = useParticipants();

  const { data: agreement, isLoading } = useQuery({
    queryKey: ["agreement", id],
    enabled: !isNew && !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("service_agreements")
        .select("*, participants(name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as ServiceAgreement & { participants?: { name: string } };
    },
  });

  const [participantId, setParticipantId] = useState("");
  const [title, setTitle] = useState("Service Agreement");
  const [status, setStatus] = useState<AgreementStatus>("draft");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [items, setItems] = useState<AgreementItem[]>([]);
  const [cancellationPolicy, setCancellationPolicy] = useState(DEFAULT_TERMS.cancellation);
  const [travelPolicy, setTravelPolicy] = useState(DEFAULT_TERMS.travel);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (isNew || hydrated || !agreement) return;
    setParticipantId(agreement.participant_id);
    setTitle(agreement.title);
    setStatus(agreement.status);
    setStartDate(agreement.start_date);
    setEndDate(agreement.end_date);
    setItems(((agreement.items as any) ?? []).map((it: any) => ({
      code: it.code ?? "",
      description: it.description ?? "",
      unit_price: Number(it.unit_price ?? 0),
      quantity: Number(it.quantity ?? 1),
      frequency: it.frequency ?? "per week",
    })));
    setCancellationPolicy(agreement.cancellation_policy ?? DEFAULT_TERMS.cancellation);
    setTravelPolicy(agreement.travel_policy ?? DEFAULT_TERMS.travel);
    setHydrated(true);
  }, [agreement, hydrated, isNew]);

  const totalValue = useMemo(
    () => items.reduce((n, it) => n + Number(it.unit_price || 0) * Number(it.quantity || 0), 0),
    [items],
  );

  const addPreset = (p: typeof SAMPLE_ITEMS[number]) =>
    setItems((prev) => [...prev, { ...p, quantity: 1, frequency: "per week" }]);
  const addBlank = () =>
    setItems((prev) => [...prev, { code: "", description: "", unit_price: 0, quantity: 1, frequency: "per week" }]);
  const updateItem = (idx: number, patch: Partial<AgreementItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const save = useMutation({
    mutationFn: async (nextStatus: AgreementStatus) => {
      if (!orgId) throw new Error("No organization");
      if (!participantId) throw new Error("Select a participant");
      const payload: any = {
        title,
        status: nextStatus,
        start_date: startDate,
        end_date: endDate,
        total_value: totalValue,
        cancellation_policy: cancellationPolicy,
        travel_policy: travelPolicy,
        items,
      };
      if (nextStatus === "active") payload.approved_at = new Date().toISOString();
      if (isNew) {
        const { data, error } = await (supabase as any)
          .from("service_agreements")
          .insert({ ...payload, org_id: orgId, participant_id: participantId, created_by: user?.id ?? null })
          .select("id")
          .single();
        if (error) throw error;
        return data.id as string;
      } else {
        const { error } = await (supabase as any)
          .from("service_agreements")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        return id!;
      }
    },
    onSuccess: (newId, nextStatus) => {
      qc.invalidateQueries({ queryKey: ["agreements"] });
      qc.invalidateQueries({ queryKey: ["agreement", newId] });
      setStatus(nextStatus);
      toast.success("Agreement saved");
      if (isNew) navigate(`/agreements/${newId}`, { replace: true });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save"),
  });

  if (!isNew && isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading agreement…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/agreements" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to agreements
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            {isNew ? "New service agreement" : title || "Service agreement"}
          </h1>
          <p className="text-xs text-muted-foreground capitalize">Status: {status.replace("_", " ")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => save.mutate("draft")} disabled={save.isPending}>
            <Save className="mr-1.5 h-4 w-4" /> Save draft
          </Button>
          {status !== "active" && (
            <Button variant="outline" onClick={() => save.mutate("pending_review")} disabled={save.isPending}>
              <Send className="mr-1.5 h-4 w-4" /> Send for review
            </Button>
          )}
          {status === "pending_review" && (
            <Button onClick={() => save.mutate("active")} disabled={save.isPending}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Activate
            </Button>
          )}
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Basics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="participant">Participant</Label>
            <Select value={participantId} onValueChange={setParticipantId} disabled={!isNew}>
              <SelectTrigger id="participant"><SelectValue placeholder="Select participant" /></SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="start">Start date</Label>
            <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="end">End date</Label>
            <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Supports & pricing</h2>
          <span className="text-sm">Total: <span className="font-semibold">${totalValue.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span></span>
        </div>
        <div>
          <Label className="text-xs uppercase text-muted-foreground">Quick add</Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SAMPLE_ITEMS.map((s) => (
              <button key={s.code} onClick={() => addPreset(s)}
                className="rounded-md border border-border bg-secondary/50 px-2 py-1 text-[11px] hover:bg-secondary">
                + {s.code}
              </button>
            ))}
            <button onClick={addBlank}
              className="rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary">
              <Plus className="mr-0.5 inline h-3 w-3" /> Custom
            </button>
          </div>
        </div>
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Add at least one support item.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="rounded-md border border-border bg-background p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Item code" value={it.code ?? ""} onChange={(e) => updateItem(i, { code: e.target.value })} className="font-mono text-xs" />
                    <Input placeholder="Description" value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} />
                    <div className="grid grid-cols-3 gap-2">
                      <Input type="number" step="0.01" placeholder="Unit price" value={it.unit_price || ""} onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })} />
                      <Input type="number" step="0.5" placeholder="Qty" value={it.quantity || ""} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} />
                      <Input placeholder="Frequency" value={it.frequency ?? ""} onChange={(e) => updateItem(i, { frequency: e.target.value })} />
                    </div>
                  </div>
                  <button onClick={() => removeItem(i)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  Line total: <span className="font-medium text-foreground">${(Number(it.unit_price || 0) * Number(it.quantity || 0)).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Terms</h2>
        <div>
          <Label htmlFor="cancellation">Cancellation policy</Label>
          <Textarea id="cancellation" rows={3} value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="travel">Travel policy</Label>
          <Textarea id="travel" rows={3} value={travelPolicy} onChange={(e) => setTravelPolicy(e.target.value)} />
        </div>
      </section>
    </div>
  );
}