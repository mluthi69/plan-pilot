import MetricCard from "@/components/MetricCard";
import StatusBadge, { type InvoiceStatus } from "@/components/StatusBadge";
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

const barData = [
  { month: "Sep", invoices: 312, amount: 148200 },
  { month: "Oct", invoices: 378, amount: 172400 },
  { month: "Nov", invoices: 421, amount: 195600 },
  { month: "Dec", invoices: 289, amount: 134100 },
  { month: "Jan", invoices: 456, amount: 211800 },
  { month: "Feb", invoices: 387, amount: 179300 },
];

const pieData = [
  { name: "Core", value: 45, color: "hsl(174, 62%, 38%)" },
  { name: "Capacity Building", value: 30, color: "hsl(215, 50%, 23%)" },
  { name: "Capital", value: 15, color: "hsl(38, 92%, 50%)" },
  { name: "Recurring", value: 10, color: "hsl(205, 78%, 56%)" },
];

const recentInvoices: { id: string; provider: string; participant: string; amount: string; status: InvoiceStatus; date: string }[] = [
  { id: "INV-2847", provider: "Allied Health Co", participant: "Sarah M.", amount: "$1,240.00", status: "pending", date: "24 Feb 2026" },
  { id: "INV-2846", provider: "Care Connect Pty", participant: "James T.", amount: "$856.50", status: "approved", date: "24 Feb 2026" },
  { id: "INV-2845", provider: "Therapy Plus", participant: "Anika R.", amount: "$2,100.00", status: "processing", date: "23 Feb 2026" },
  { id: "INV-2844", provider: "Support Works", participant: "David L.", amount: "$445.00", status: "paid", date: "23 Feb 2026" },
  { id: "INV-2843", provider: "Mobility Assist", participant: "Emma K.", amount: "$3,780.00", status: "exception", date: "22 Feb 2026" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your plan management operations</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Active Participants" value="1,247" change="+12" trend="up" subtitle="this month" />
        <MetricCard title="Invoices This Month" value="387" change="+8.2%" trend="up" subtitle="vs last month" />
        <MetricCard title="Pending Approvals" value="43" change="-15%" trend="down" subtitle="vs last week" />
        <MetricCard title="Total Claimed (Feb)" value="$179,300" change="+3.8%" trend="up" subtitle="vs Jan" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="col-span-2 rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-card-foreground">Invoice Volume</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Monthly invoices processed</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(215, 14%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(215, 14%, 46%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(214, 20%, 90%)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="invoices" fill="hsl(174, 62%, 38%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-card-foreground">Budget Allocation</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">By support category</p>
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
                  <td className="px-5 py-3 font-mono text-xs font-medium text-card-foreground">{inv.id}</td>
                  <td className="px-5 py-3 text-card-foreground">{inv.provider}</td>
                  <td className="px-5 py-3 text-muted-foreground">{inv.participant}</td>
                  <td className="px-5 py-3 text-right font-medium text-card-foreground">{inv.amount}</td>
                  <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{inv.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
