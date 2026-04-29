import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Target, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useNdisCategories } from "@/hooks/useNdisCategories";
import {
  useCreateFundingAgreement,
  useUpdateFundingAgreement,
  type FundingAgreement,
} from "@/hooks/useFundingAgreements";
import { useOrgSettings } from "@/hooks/useOrgSettings";
import { useParticipantGoals } from "@/hooks/useGoals";
import {
  useAgreementGoalLinks,
  useReplaceAgreementCategoryGoals,
} from "@/hooks/useAgreementCategoryGoals";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participantId: string;
  /** When provided, the dialog enters edit mode. */
  agreement?: FundingAgreement | null;
}

interface CategoryDraft {
  id?: string;
  support_category_code: string;
  total_amount: number;
  goal_ids: string[];
}

export default function FundingAgreementDialog({ open, onOpenChange, participantId, agreement }: Props) {
  const { data: categories = [] } = useNdisCategories();
  const { data: orgSettings } = useOrgSettings();
  const create = useCreateFundingAgreement();
  const update = useUpdateFundingAgreement();
  const replaceLinks = useReplaceAgreementCategoryGoals();
  const isEdit = !!agreement;

  const { data: goals = [] } = useParticipantGoals(participantId);
  const existingCatIds = (agreement?.categories ?? []).map((c) => c.id);
  const { data: existingLinks = [] } = useAgreementGoalLinks(existingCatIds);

  const today = new Date().toISOString().slice(0, 10);
  const oneYear = new Date();
  oneYear.setFullYear(oneYear.getFullYear() + 1);

  const [title, setTitle] = useState("Annual NDIS Plan");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(oneYear.toISOString().slice(0, 10));
  const [periodLength, setPeriodLength] = useState<number>(orgSettings?.default_period_length_months ?? 3);
  const [rolloverOverride, setRolloverOverride] = useState<"inherit" | "yes" | "no">("inherit");
  const [status, setStatus] = useState<FundingAgreement["status"]>("active");
  const [rows, setRows] = useState<CategoryDraft[]>([
    { support_category_code: "", total_amount: 0, goal_ids: [] },
  ]);

  useEffect(() => {
    if (!open) return;
    if (agreement) {
      setTitle(agreement.title);
      setStart(agreement.start_date);
      setEnd(agreement.end_date);
      setPeriodLength(agreement.period_length_months);
      setStatus(agreement.status);
      setRolloverOverride(
        agreement.allow_unspent_rollover === null
          ? "inherit"
          : agreement.allow_unspent_rollover
            ? "yes"
            : "no",
      );
      setRows(
        (agreement.categories ?? []).map((c) => ({
          id: c.id,
          support_category_code: c.support_category_code,
          total_amount: Number(c.total_amount),
          goal_ids: existingLinks
            .filter((l) => l.agreement_category_id === c.id)
            .map((l) => l.goal_id),
        })),
      );
    } else {
      setTitle("Annual NDIS Plan");
      setStart(today);
      setEnd(oneYear.toISOString().slice(0, 10));
      setPeriodLength(orgSettings?.default_period_length_months ?? 3);
      setRolloverOverride("inherit");
      setStatus("active");
      setRows([{ support_category_code: "", total_amount: 0, goal_ids: [] }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, agreement?.id, existingLinks.length]);

  function addRow() {
    setRows((r) => [...r, { support_category_code: "", total_amount: 0, goal_ids: [] }]);
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
    const validRows = rows.filter((r) => r.support_category_code && Number(r.total_amount) > 0);
    if (validRows.length === 0) return;
    const valid = validRows.map(({ goal_ids: _gi, ...rest }) => rest);
    const allowRollover =
      rolloverOverride === "inherit" ? null : rolloverOverride === "yes";
    if (isEdit && agreement) {
      await update.mutateAsync({
        id: agreement.id,
        title,
        start_date: start,
        end_date: end,
        period_length_months: periodLength,
        allow_unspent_rollover: allowRollover,
        status,
        categories: valid,
      });
      // Refetch fresh category ids (some may be brand new) to map by code, then save links.
      const { data: freshCats } = await (supabase as any)
        .from("funding_agreement_categories")
        .select("id, support_category_code")
        .eq("agreement_id", agreement.id);
      const codeToId = new Map<string, string>(
        (freshCats ?? []).map((c: any) => [c.support_category_code, c.id]),
      );
      for (const r of validRows) {
        const catId = r.id ?? codeToId.get(r.support_category_code);
        if (!catId) continue;
        await replaceLinks.mutateAsync({
          agreement_category_id: catId,
          goal_ids: r.goal_ids,
        });
      }
    } else {
      const result = await create.mutateAsync({
        participant_id: participantId,
        title,
        start_date: start,
        end_date: end,
        period_length_months: periodLength,
        allow_unspent_rollover: allowRollover,
        status: "active",
        categories: valid,
      });
      const codeToId = new Map<string, string>(
        ((result as any)?.inserted_categories ?? []).map((c: any) => [c.support_category_code, c.id]),
      );
      for (const r of validRows) {
        if (!r.goal_ids.length) continue;
        const catId = codeToId.get(r.support_category_code);
        if (!catId) continue;
        await replaceLinks.mutateAsync({
          agreement_category_id: catId,
          goal_ids: r.goal_ids,
        });
      }
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit funding agreement" : "New funding agreement"}</DialogTitle>
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
            {isEdit && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
                    <th className="px-3 py-2 text-left font-medium">Linked goals</th>
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
                      <td className="px-3 py-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-full justify-between font-normal"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <Target className="h-3 w-3" />
                                {r.goal_ids.length === 0
                                  ? "Optional"
                                  : `${r.goal_ids.length} goal${r.goal_ids.length === 1 ? "" : "s"}`}
                              </span>
                              <ChevronDown className="h-3 w-3 opacity-60" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-0" align="end">
                            {goals.length === 0 ? (
                              <p className="p-3 text-xs text-muted-foreground">
                                No goals on this participant yet. Add some on the Goals tab.
                              </p>
                            ) : (
                              <div className="max-h-64 overflow-auto p-2">
                                {goals.map((g) => {
                                  const checked = r.goal_ids.includes(g.id);
                                  return (
                                    <label
                                      key={g.id}
                                      className="flex cursor-pointer items-start gap-2 rounded p-1.5 hover:bg-muted/60"
                                    >
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={(v) => {
                                          const next = v
                                            ? [...r.goal_ids, g.id]
                                            : r.goal_ids.filter((x) => x !== g.id);
                                          updateRow(i, { goal_ids: next });
                                        }}
                                      />
                                      <span className="space-y-0.5 text-xs">
                                        <span className="block font-medium leading-tight">{g.title}</span>
                                        {g.ndis_outcome_domain && (
                                          <Badge variant="outline" className="text-[10px]">
                                            {g.ndis_outcome_domain}
                                          </Badge>
                                        )}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
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
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create agreement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
