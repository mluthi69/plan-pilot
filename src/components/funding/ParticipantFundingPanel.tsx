import { useState } from "react";
import { Plus, Wallet, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useFundingAgreements,
  useFundingSpend,
  useDeleteFundingAgreement,
  type FundingAgreement,
} from "@/hooks/useFundingAgreements";
import { useNdisCategories } from "@/hooks/useNdisCategories";
import { useOrgSettings } from "@/hooks/useOrgSettings";
import FundingAgreementDialog from "./FundingAgreementDialog";
import { computeAvailable } from "@/lib/fundingPeriods";

function money(n: number) {
  return `$${Number(n).toLocaleString("en-AU", { minimumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "2-digit" });
}

interface Props {
  participantId: string;
}

export default function ParticipantFundingPanel({ participantId }: Props) {
  const { data: agreements = [], isLoading } = useFundingAgreements(participantId);
  const { data: spendData } = useFundingSpend(participantId);
  const { data: categories = [] } = useNdisCategories();
  const { data: orgSettings } = useOrgSettings();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FundingAgreement | null>(null);
  const del = useDeleteFundingAgreement();

  const catName = (code: string) => categories.find((c) => c.code === code)?.name ?? code;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Funding agreements</h2>
          <p className="text-xs text-muted-foreground">Category-level budgets split into funding periods.</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New agreement
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : agreements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Wallet className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No funding agreement yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Bookings can't be funding-checked without an agreement covering the relevant category.
            </p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => { setEditing(null); setOpen(true); }}>
              Create first agreement
            </Button>
          </CardContent>
        </Card>
      ) : (
        agreements.map((a) => {
          const rolloverEnabled =
            a.allow_unspent_rollover ?? !!orgSettings?.allow_unspent_rollover;
          return (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">{a.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(a.start_date)} → {fmtDate(a.end_date)} · periods of {a.period_length_months}mo
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.status === "active" ? "default" : "outline"} className="capitalize">
                      {a.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {rolloverEnabled ? "Rollover on" : "No rollover"}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(a); setOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete agreement "${a.title}"? This will remove all category budgets and periods.`)) {
                          del.mutate(a.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {a.categories.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No categories configured.</p>
                ) : (
                  a.categories.map((c) => (
                    <div key={c.id} className="space-y-2 rounded-md border border-border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{catName(c.support_category_code)}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{c.support_category_code}</p>
                        </div>
                        <p className="text-sm font-semibold">{money(c.total_amount)}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {(c.periods ?? []).map((p) => {
                          const breakdown = computeAvailable(
                            p,
                            c.periods ?? [],
                            spendData?.spendByPeriod ?? {},
                            rolloverEnabled,
                          );
                          const usedPct =
                            breakdown.allocated > 0
                              ? Math.min(100, Math.round((breakdown.spent / breakdown.allocated) * 100))
                              : 0;
                          const tone =
                            usedPct >= 95 ? "text-destructive"
                            : usedPct >= 80 ? "text-warning"
                            : "text-muted-foreground";
                          return (
                            <div key={p.id} className="rounded border border-border p-2">
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>P{p.period_index + 1}</span>
                                <span>{fmtDate(p.period_start)} – {fmtDate(p.period_end)}</span>
                              </div>
                              <Progress value={usedPct} className="mt-1.5 h-1.5" />
                              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                                <span className={tone}>{money(breakdown.spent)} / {money(breakdown.allocated)}</span>
                                <span className="font-medium">{money(breakdown.available)} left</span>
                              </div>
                              {breakdown.rolledOver > 0 && (
                                <p className="mt-0.5 text-[10px] text-success">+{money(breakdown.rolledOver)} rolled over</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      <FundingAgreementDialog
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}
        participantId={participantId}
        agreement={editing}
      />
    </div>
  );
}
