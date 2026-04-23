import { useState, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrg";
import { useParticipants } from "@/hooks/useParticipantsDb";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Item {
  code: string;
  description: string;
  unit_price: number;
  quantity: number;
  frequency: string;
}

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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultParticipantId?: string;
}

export default function AgreementBuilderDialog({ open, onOpenChange, defaultParticipantId }: Props) {
  const orgId = useOrgId();
  const { user } = useUser();
  const qc = useQueryClient();
  const { data: participants = [] } = useParticipants();

  const [step, setStep] = useState(1);
  const [participantId, setParticipantId] = useState<string>(defaultParticipantId ?? "");
  const [title, setTitle] = useState("Service Agreement");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [items, setItems] = useState<Item[]>([]);
  const [cancellationPolicy, setCancellationPolicy] = useState(DEFAULT_TERMS.cancellation);
  const [travelPolicy, setTravelPolicy] = useState(DEFAULT_TERMS.travel);

  const totalValue = useMemo(
    () => items.reduce((n, it) => n + it.unit_price * it.quantity, 0),
    [items]
  );

  const reset = () => {
    setStep(1);
    setParticipantId(defaultParticipantId ?? "");
    setTitle("Service Agreement");
    setItems([]);
    setCancellationPolicy(DEFAULT_TERMS.cancellation);
    setTravelPolicy(DEFAULT_TERMS.travel);
  };

  const addPreset = (preset: typeof SAMPLE_ITEMS[number]) => {
    setItems((prev) => [
      ...prev,
      { ...preset, quantity: 1, frequency: "per week" },
    ]);
  };

  const addBlank = () => {
    setItems((prev) => [
      ...prev,
      { code: "", description: "", unit_price: 0, quantity: 1, frequency: "per week" },
    ]);
  };

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const create = useMutation({
    mutationFn: async (status: "draft" | "pending_review") => {
      if (!orgId) throw new Error("No organization");
      if (!participantId) throw new Error("Select a participant");
      const { error } = await (supabase as any).from("service_agreements").insert({
        org_id: orgId,
        participant_id: participantId,
        title,
        status,
        start_date: startDate,
        end_date: endDate,
        total_value: totalValue,
        cancellation_policy: cancellationPolicy,
        travel_policy: travelPolicy,
        items,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_data, status) => {
      qc.invalidateQueries({ queryKey: ["agreements"] });
      toast.success(status === "draft" ? "Draft saved" : "Sent for review");
      onOpenChange(false);
      reset();
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create agreement"),
  });

  const canNext1 = participantId && title && startDate && endDate;
  const canNext2 = items.length > 0 && items.every((i) => i.description && i.unit_price > 0);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New service agreement</DialogTitle>
          <DialogDescription>Step {step} of 3 — {step === 1 ? "Basics" : step === 2 ? "Supports & pricing" : "Terms & review"}</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="participant">Participant</Label>
              <Select value={participantId} onValueChange={setParticipantId}>
                <SelectTrigger id="participant">
                  <SelectValue placeholder="Select participant" />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="title">Agreement title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start">Start date</Label>
                <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="end">End date</Label>
                <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Quick add from NDIS Price Guide</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SAMPLE_ITEMS.map((s) => (
                  <button
                    key={s.code}
                    onClick={() => addPreset(s)}
                    className="rounded-md border border-border bg-secondary/50 px-2 py-1 text-[11px] hover:bg-secondary"
                  >
                    + {s.code}
                  </button>
                ))}
                <button
                  onClick={addBlank}
                  className="rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary"
                >
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
                  <div key={i} className="rounded-md border border-border bg-card p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Item code (e.g. 01_011_0107_1_1)"
                          value={it.code}
                          onChange={(e) => updateItem(i, { code: e.target.value })}
                          className="font-mono text-xs"
                        />
                        <Input
                          placeholder="Description"
                          value={it.description}
                          onChange={(e) => updateItem(i, { description: e.target.value })}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Unit price"
                            value={it.unit_price || ""}
                            onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })}
                          />
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="Qty"
                            value={it.quantity || ""}
                            onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                          />
                          <Input
                            placeholder="Frequency"
                            value={it.frequency}
                            onChange={(e) => updateItem(i, { frequency: e.target.value })}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(i)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      Line total: <span className="font-medium text-foreground">${(it.unit_price * it.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
              <span className="text-sm font-medium">Estimated total value</span>
              <span className="text-base font-semibold">${totalValue.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="cancellation">Cancellation policy</Label>
              <Textarea
                id="cancellation"
                rows={3}
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="travel">Travel policy</Label>
              <Textarea
                id="travel"
                rows={3}
                value={travelPolicy}
                onChange={(e) => setTravelPolicy(e.target.value)}
              />
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium">Summary</p>
              <p className="mt-1 text-muted-foreground">
                {participants.find((p) => p.id === participantId)?.name ?? "—"} ·{" "}
                {new Date(startDate).toLocaleDateString("en-AU")} – {new Date(endDate).toLocaleDateString("en-AU")} ·{" "}
                {items.length} item{items.length === 1 ? "" : "s"} · ${totalValue.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row justify-between">
          <Button
            variant="ghost"
            onClick={() => (step === 1 ? onOpenChange(false) : setStep(step - 1))}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <div className="flex gap-2">
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
              >
                Next
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => create.mutate("draft")} disabled={create.isPending}>
                  Save draft
                </Button>
                <Button onClick={() => create.mutate("pending_review")} disabled={create.isPending}>
                  Send for review
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
