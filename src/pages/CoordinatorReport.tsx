import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Star, FileText, Target, Wallet, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Report {
  participant: { name: string; ndis_number: string; plan_start: string | null; plan_end: string | null };
  window: { from: string | null; to: string | null };
  totals: { visits: number; goals: number };
  goals: Array<{
    id: string;
    title: string;
    description: string | null;
    ndis_outcome_domain: string | null;
    status: string;
    target_date: string | null;
    visit_count: number;
    hours: number;
    avg_rating: number | null;
    latest_notes: { note: string; rating: number | null; at: string }[];
  }>;
  categories: Array<{
    agreement_title: string;
    support_category_code: string;
    budget: number;
    spend_in_window: number;
  }>;
}

export default function CoordinatorReport() {
  const { token } = useParams<{ token: string }>();
  const [params] = useSearchParams();
  const from = params.get("from");
  const to = params.get("to");
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const qs = new URLSearchParams({ token });
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/coordinator-report?${qs}`;
    fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "" } })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token, from, to]);

  const totalBudget = useMemo(
    () => (data?.categories ?? []).reduce((s, c) => s + c.budget, 0),
    [data],
  );
  const totalSpend = useMemo(
    () => (data?.categories ?? []).reduce((s, c) => s + c.spend_in_window, 0),
    [data],
  );

  if (error) return <div className="mx-auto max-w-2xl p-8 text-sm text-destructive">{error}</div>;
  if (!data) return <div className="mx-auto max-w-2xl p-8 text-sm text-muted-foreground">Loading report…</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-6 print:p-0">
      <header className="flex items-start justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Support Coordinator report</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            {data.participant.name} · NDIS {data.participant.ndis_number}
            {data.window.from || data.window.to ? (
              <> · Window {data.window.from ?? "…"} → {data.window.to ?? "…"}</>
            ) : null}
          </p>
        </div>
        <Button onClick={() => window.print()} variant="outline" size="sm">
          Print / Save PDF
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Visits in window</p>
          <p className="text-2xl font-semibold">{data.totals.visits}</p>
        </CardContent></Card>
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Goals tracked</p>
          <p className="text-2xl font-semibold">{data.totals.goals}</p>
        </CardContent></Card>
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Spend / Budget</p>
          <p className="text-2xl font-semibold">${totalSpend.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">/ ${totalBudget.toFixed(0)}</span></p>
        </CardContent></Card>
      </div>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Goals progress</h2>
        </div>
        {data.goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No goals captured.</p>
        ) : (
          <div className="space-y-2">
            {data.goals.map((g) => (
              <Card key={g.id}>
                <CardContent className="space-y-2 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{g.title}</p>
                    {g.ndis_outcome_domain && (
                      <Badge variant="outline" className="text-[10px]">{g.ndis_outcome_domain}</Badge>
                    )}
                    <Badge variant="outline" className="text-[10px] capitalize">{g.status}</Badge>
                    <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{g.visit_count} visits</span>
                      <span>{g.hours.toFixed(1)} hrs</span>
                      {g.avg_rating !== null && (
                        <span className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map((n) => (
                            <Star key={n} className={`h-3 w-3 ${(g.avg_rating ?? 0) >= n ? "text-warning fill-current" : "text-muted-foreground"}`} />
                          ))}
                          <span className="ml-1">avg</span>
                        </span>
                      )}
                    </span>
                  </div>
                  {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                  {g.latest_notes.length > 0 && (
                    <div className="space-y-1 border-l-2 border-border pl-3">
                      {g.latest_notes.map((n, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          <span className="text-foreground">{new Date(n.at).toLocaleDateString("en-AU")}:</span>{" "}
                          {n.note}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Category spend</h2>
        </div>
        {data.categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active funding categories.</p>
        ) : (
          <Card><CardContent className="py-3">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="py-1 text-left font-normal">Agreement</th>
                  <th className="py-1 text-left font-normal">Category</th>
                  <th className="py-1 text-right font-normal">Budget</th>
                  <th className="py-1 text-right font-normal">Spend (window)</th>
                </tr>
              </thead>
              <tbody>
                {data.categories.map((c, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-1.5">{c.agreement_title}</td>
                    <td className="py-1.5 font-mono text-xs">{c.support_category_code}</td>
                    <td className="py-1.5 text-right">${c.budget.toFixed(2)}</td>
                    <td className="py-1.5 text-right">${c.spend_in_window.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        )}
      </section>

      <footer className="pt-2 text-[10px] text-muted-foreground">
        <FileText className="mr-1 inline h-3 w-3" /> Generated for the participant's Support Coordinator. Shareable link.
      </footer>
    </div>
  );
}