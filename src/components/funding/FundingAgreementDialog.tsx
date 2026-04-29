import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useNdisCategories } from "@/hooks/useNdisCategories";
import { useCreateFundingAgreement } from "@/hooks/useFundingAgreements";
import { useOrgSettings } from "@/hooks/useOrgSettings";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantId: string;
}

interface CategoryDraft {
  support_category_code: string;
  total_amount: number;
}

export default function FundingAgreementDialog({ open, onOpenChange, participantId }: Props) {
  const { data: categories = [] } = useNdisCategories();
  const { data: orgSettings } = useOrgSettings();
  const create = useCreateFundingAgreement();

  const today = new Date().toISOString().slice(0, 10);
  const oneYear = new Date();
  oneYear.setFullYear(oneYear.getFullYear() + 1);

  const [title, setTitle] = useState("Annual NDIS Plan");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(oneYear.toISOString().slice(0, 10));
  const [periodLength, setPeriodLength] = useState<number>(orgSettings?.default_period_length_months ?? 3);
  const [rolloverOverride, setRolloverOverride] = useState<"inherit" | "yes" | "no">("inherit");
  const [rows, setRows] = useState<CategoryDraft[]>([{ support_category_code: "", total_amount: 0 }]);

  function addRow() {
    setRows((r) => [...r, { support_category_code: "", total_amount: 0 }]);
  }
  function updateRow(i: number, patch: Partial<CategoryDraft>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  const total = rows.reduce((s, r) => s + Number(r.total_amount || 0), 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const valid = rows.filter((r) => r.support_category_code && Number(r.total_amount) > 0);
    if (valid.length === 0) return;
    await create.mutateAsync({
      participant_id: participantId,
      title,
      start_date: start,
      end_date: end,
      period_length_months: periodLength,
      allow_unspent_rollover:
        rolloverOverride === "inherit" ? null : rolloverOverride === "yes",
      status: "active",
      categories: valid,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New funding agreement</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>End date</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Period length (months)</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value) || 3)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rollover</Label>
              <Select value={rolloverOverride} onValueChange={(v: any) => setRolloverOverride(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Use org default</SelectItem>
                  <SelectItem value="yes">Allow rollover</SelectItem>
                  <SelectItem value="no">Strict — no rollover</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Category budgets</Label>
              <Button type="button" size="sm" variant="ghost" onClick={addRow}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add category
              </Button>
            </div>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium">NDIS support category</th>
                    <th className="px-3 py-2 text-right font-medium">Total amount</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <Select
                          value={r.support_category_code}
                          onValueChange={(v) => updateRow(i, { support_category_code: v })}
                        >
                          <SelectTrigger className="h-8"><SelectValue placeholder="Select…" /></SelectTrigger>
                          <SelectContent>
                            {categories.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                <span className="font-mono text-[10px] mr-2 text-muted-foreground">{c.code}</span>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Input
                          type="number"
                          step={0.01}
                          className="h-8 text-right"
                          value={r.total_amount}
                          onChange={(e) => updateRow(i, { total_amount: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button type="button" onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 text-xs">
                    <td className="px-3 py-2 text-right font-medium">Total</td>
                    <td className="px-3 py-2 text-right font-semibold">${total.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Each category will be split into equal periods of {periodLength} month{periodLength === 1 ? "" : "s"}.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Saving…" : "Create agreement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
