import MetricCard from "@/components/MetricCard";
import StatusBadge from "@/components/StatusBadge";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useInvoices } from "@/hooks/useInvoices";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const pieData = [
  { name: "Core", value: 45, color: "hsl(174, 62%, 38%)" },
  { name: "Capacity Building", value: 30, color: "hsl(215, 50%, 23%)" },
  { name: "Capital", value: 15, color: "hsl(38, 92%, 50%)" },
  { name: "Recurring", value: 10, color: "hsl(205, 78%, 56%)" },
];

export default function Dashboard() {
  const { data: stats } = useDashboardStats();
  const { data: invoices = [] } = useInvoices();
  const recentInvoices = invoices.slice(0, 5);

  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toLocaleString("en-AU")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your plan management operations</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Active Participants" value={stats?.activeParticipants?.toLocaleString() ?? "—"} subtitle="currently active" />
        <MetricCard title="Invoices This Month" value={stats?.totalInvoicesThisMonth?.toLocaleString() ?? "—"} subtitle="this month" />
        <MetricCard title="Pending Approvals" value={stats?.pendingApprovals?.toLocaleString() ?? "—"} subtitle="awaiting action" />
        <MetricCard title="Total Claimed" value={stats ? fmt(stats.totalClaimedThisMonth) : "—"} subtitle="this month" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="col-span-2 rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-card-foreground">Budget Allocation</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">By support category</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pieData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(215, 14%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(215, 14%, 46%)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(214, 20%, 90%)", fontSize: 12 }} />
                <Bar dataKey="value" fill="hsl(174, 62%, 38%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-card-foreground">Category Split</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Percentage breakdown</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={2} stroke="hsl(0, 0%, 100%)">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(214, 20%, 90%)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-medium text-card-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-medium text-card-foreground">Recent Invoices</h3>
          <a href="/invoices" className="text-xs font-medium text-accent hover:underline">View all</a>
        </div>
        <div className="overflow-x-auto">
          {recentInvoices.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No invoices yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-5 py-2.5 text-left font-medium">Invoice</th>
                  <th className="px-5 py-2.5 text-left font-medium">Provider</th>
                  <th className="px-5 py-2.5 text-left font-medium">Participant</th>
                  <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-5 py-2.5 text-left font-medium">Status</th>
                  <th className="px-5 py-2.5 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-card-foreground">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-card-foreground">{inv.provider_name ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{inv.participant_name ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-medium text-card-foreground">
                      ${Number(inv.amount).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(inv.received_at).toLocaleDateString("en-AU")}</td>
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
