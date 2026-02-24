import { Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    participant: "Sarah Mitchell",
    id: "P-1001",
    planStart: "16 Aug 2025",
    planEnd: "15 Aug 2026",
    totalBudget: "$87,400",
    periods: 4,
    currentPeriod: 3,
    categories: [
      { name: "Assistance with Daily Life", budget: "$32,000", used: "$18,400", pct: 57 },
      { name: "Social & Community", budget: "$15,400", used: "$6,200", pct: 40 },
      { name: "Support Coordination", budget: "$8,000", used: "$5,600", pct: 70 },
      { name: "Consumables", budget: "$4,000", used: "$2,100", pct: 52 },
    ],
  },
  {
    participant: "James Thornton",
    id: "P-1002",
    planStart: "04 May 2025",
    planEnd: "03 May 2026",
    totalBudget: "$124,200",
    periods: 4,
    currentPeriod: 4,
    categories: [
      { name: "Assistance with Daily Life", budget: "$56,000", used: "$48,300", pct: 86 },
      { name: "Improved Daily Living", budget: "$24,200", used: "$18,100", pct: 75 },
      { name: "Transport", budget: "$6,000", used: "$4,800", pct: 80 },
      { name: "Support Coordination", budget: "$8,000", used: "$7,200", pct: 90 },
    ],
  },
  {
    participant: "Anika Rao",
    id: "P-1003",
    planStart: "23 Nov 2025",
    planEnd: "22 Nov 2026",
    totalBudget: "$56,800",
    periods: 4,
    currentPeriod: 1,
    categories: [
      { name: "Assistance with Daily Life", budget: "$22,000", used: "$3,100", pct: 14 },
      { name: "Improved Daily Living", budget: "$12,800", used: "$1,200", pct: 9 },
      { name: "Social & Community", budget: "$8,000", used: "$800", pct: 10 },
    ],
  },
];

function UtilBar({ pct }: { pct: number }) {
  const color = pct > 85 ? "bg-destructive" : pct > 60 ? "bg-warning" : "bg-accent";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-muted">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{pct}%</span>
    </div>
  );
}

export default function Plans() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Plans & Budgets</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track plan budgets, funding periods, and utilisation</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search plans..." className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <h3 className="text-sm font-medium text-card-foreground">{plan.participant}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {plan.id} · {plan.planStart} – {plan.planEnd}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[11px] font-medium bg-accent/10 text-accent border-accent/20">
                  Period {plan.currentPeriod}/{plan.periods}
                </Badge>
                <span className="text-sm font-semibold text-card-foreground">{plan.totalBudget}</span>
              </div>
            </div>
            <div className="p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="pb-2 text-left font-medium">Support Category</th>
                    <th className="pb-2 text-right font-medium">Budget</th>
                    <th className="pb-2 text-right font-medium">Used</th>
                    <th className="pb-2 text-right font-medium">Utilisation</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.categories.map((cat) => (
                    <tr key={cat.name} className="border-t border-border">
                      <td className="py-2.5 text-card-foreground">{cat.name}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{cat.budget}</td>
                      <td className="py-2.5 text-right text-card-foreground font-medium">{cat.used}</td>
                      <td className="py-2.5">
                        <div className="flex justify-end">
                          <UtilBar pct={cat.pct} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
