import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, User, FileText, ClipboardList,
  AlertTriangle, TrendingUp, MoreHorizontal, ExternalLink, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";

// ── Mock data keyed by participant id ──────────────────────────────────
const participantData: Record<string, any> = {
  "P-1001": {
    name: "Sarah Mitchell", ndisNo: "4312789456", dob: "14 Mar 1988", phone: "+61 412 345 678",
    email: "sarah.mitchell@email.com", address: "42 Banksia Ave, Hornsby NSW 2077",
    funding: "Plan Managed", status: "active", nominee: "Karen Mitchell (Plan Nominee)",
    plan: {
      id: "PLN-8821", start: "16 Aug 2025", end: "15 Aug 2026", reviewDate: "01 Jul 2026",
      totalBudget: 87400,
      categories: [
        { name: "Assistance with Daily Life", code: "Core", budget: 32000, committed: 8400, pending: 1200, paid: 4800, period: "Q3 2025–26" },
        { name: "Social & Community Participation", code: "Core", budget: 18000, committed: 4500, pending: 800, paid: 3200, period: "Q3 2025–26" },
        { name: "Consumables", code: "Core", budget: 4200, committed: 600, pending: 0, paid: 1800, period: "Q3 2025–26" },
        { name: "Improved Daily Living", code: "CB", budget: 22000, committed: 6200, pending: 1500, paid: 3100, period: "Q3 2025–26" },
        { name: "Support Coordination", code: "CB", budget: 6200, committed: 1800, pending: 0, paid: 2400, period: "Q3 2025–26" },
        { name: "Improved Life Choices", code: "CB", budget: 5000, committed: 1200, pending: 400, paid: 800, period: "Q3 2025–26" },
      ],
      fundingPeriods: [
        { label: "Q1 (Aug–Oct 2025)", available: 21850, spent: 14200, status: "complete" },
        { label: "Q2 (Nov–Jan 2026)", available: 21850, spent: 18600, status: "complete" },
        { label: "Q3 (Feb–Apr 2026)", available: 21850, spent: 3900, status: "current" },
        { label: "Q4 (May–Jul 2026)", available: 21850, spent: 0, status: "future" },
      ],
    },
    invoices: [
      { id: "INV-2024-0871", provider: "Allied Health Partners", date: "20 Feb 2026", amount: "$1,240.00", status: "approved" as const, category: "Improved Daily Living" },
      { id: "INV-2024-0856", provider: "Community Access Co", date: "15 Feb 2026", amount: "$680.00", status: "paid" as const, category: "Social & Community" },
      { id: "INV-2024-0842", provider: "Therapy Plus", date: "08 Feb 2026", amount: "$920.00", status: "paid" as const, category: "Improved Daily Living" },
      { id: "INV-2024-0831", provider: "HomeCare Services", date: "01 Feb 2026", amount: "$2,100.00", status: "paid" as const, category: "Daily Life" },
      { id: "INV-2024-0819", provider: "Mobility Supplies AU", date: "28 Jan 2026", amount: "$345.00", status: "paid" as const, category: "Consumables" },
      { id: "INV-2024-0803", provider: "Allied Health Partners", date: "18 Jan 2026", amount: "$1,860.00", status: "exception" as const, category: "Improved Daily Living" },
    ],
    notes: [
      { id: "N-01", date: "22 Feb 2026", author: "Jane Doe", type: "Contact Log", content: "Phone call with Sarah re: upcoming OT sessions. Confirmed new schedule starting March." },
      { id: "N-02", date: "14 Feb 2026", author: "Tom Richards", type: "Case Note", content: "SC meeting — reviewed plan utilisation. Core budget tracking well. Capacity building underspent, discussed options for increasing therapy sessions." },
      { id: "N-03", date: "02 Feb 2026", author: "Jane Doe", type: "Incident", content: "Provider HomeCare Services invoiced for dates outside service agreement window. Flagged for review and contacted provider." },
      { id: "N-04", date: "18 Jan 2026", author: "Tom Richards", type: "Contact Log", content: "Email from nominee Karen requesting statement for Q2. Generated and sent same day." },
    ],
    providers: [
      { name: "Allied Health Partners", abn: "12 345 678 901", type: "Registered", services: "OT, Physiotherapy", invoicesYTD: 8, amountYTD: "$9,240" },
      { name: "Community Access Co", abn: "98 765 432 100", type: "Registered", services: "Community Participation", invoicesYTD: 12, amountYTD: "$7,840" },
      { name: "HomeCare Services", abn: "55 123 456 789", type: "Registered", services: "Daily Life Assistance", invoicesYTD: 6, amountYTD: "$12,600" },
      { name: "Therapy Plus", abn: "33 987 654 321", type: "Unregistered", services: "Psychology", invoicesYTD: 4, amountYTD: "$3,680" },
      { name: "Mobility Supplies AU", abn: "77 246 813 579", type: "Registered", services: "Consumables, AT", invoicesYTD: 3, amountYTD: "$1,035" },
    ],
  },
};

// Fallback for any participant id
const getParticipant = (id: string) => participantData[id] || participantData["P-1001"];

const budgetTypeColor: Record<string, string> = {
  Core: "bg-accent/10 text-accent border-accent/20",
  CB: "bg-info/10 text-info border-info/20",
  Capital: "bg-warning/10 text-warning border-warning/20",
};

const noteTypeColor: Record<string, string> = {
  "Contact Log": "bg-info/10 text-info border-info/20",
  "Case Note": "bg-accent/10 text-accent border-accent/20",
  Incident: "bg-destructive/10 text-destructive border-destructive/20",
};

const periodStatusStyle: Record<string, string> = {
  complete: "bg-muted text-muted-foreground",
  current: "bg-accent/10 text-accent border-accent/20",
  future: "bg-muted/50 text-muted-foreground",
};

export default function ParticipantDetail() {
  const { id } = useParams<{ id: string }>();
  const p = getParticipant(id || "P-1001");
  const plan = p.plan;

  const totalSpent = plan.categories.reduce((s: number, c: any) => s + c.paid + c.committed + c.pending, 0);
  const utilisationPct = Math.round((totalSpent / plan.totalBudget) * 100);

  return (
    <div className="space-y-6">
      {/* Breadcrumb + back */}
      <div className="flex items-center gap-3">
        <Link to="/participants">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Participants
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{p.name}</span>
      </div>

      {/* Profile header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {p.name.split(" ").map((n: string) => n[0]).join("")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{p.name}</h1>
              <Badge variant="outline" className={`text-[11px] capitalize ${p.status === "active" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                {p.status}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> NDIS {p.ndisNo}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> DOB {p.dob}</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {p.phone}</span>
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {p.email}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.address}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">{p.funding}</Badge>
              <span className="flex items-center gap-1 text-muted-foreground"><Shield className="h-3 w-3" /> {p.nominee}</span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
      </div>

      {/* Plan summary strip */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Plan ID</p>
            <p className="text-sm font-semibold mt-0.5">{plan.id}</p>
            <p className="text-[11px] text-muted-foreground">{plan.start} – {plan.end}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Budget</p>
            <p className="text-sm font-semibold mt-0.5">${plan.totalBudget.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">Review: {plan.reviewDate}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Utilisation</p>
            <p className="text-sm font-semibold mt-0.5">{utilisationPct}%</p>
            <Progress value={utilisationPct} className="mt-1.5 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Active Providers</p>
            <p className="text-sm font-semibold mt-0.5">{p.providers.length}</p>
            <p className="text-[11px] text-muted-foreground">{p.invoices.length} invoices YTD</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed detail */}
      <Tabs defaultValue="budget">
        <TabsList>
          <TabsTrigger value="budget">Budget & Funding</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="notes">Notes & Activity</TabsTrigger>
        </TabsList>

        {/* ── Budget ── */}
        <TabsContent value="budget" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Support Categories</CardTitle>
              <CardDescription>Budget breakdown by support category with real-time utilisation.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Committed</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="w-32">Utilisation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.categories.map((cat: any) => {
                    const used = cat.committed + cat.pending + cat.paid;
                    const remaining = cat.budget - used;
                    const pct = Math.round((used / cat.budget) * 100);
                    return (
                      <TableRow key={cat.name}>
                        <TableCell className="font-medium text-sm">{cat.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${budgetTypeColor[cat.code]}`}>{cat.code}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">${cat.budget.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">${cat.committed.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">${cat.pending.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm">${cat.paid.toLocaleString()}</TableCell>
                        <TableCell className={`text-right text-sm font-medium ${remaining < cat.budget * 0.15 ? "text-destructive" : ""}`}>
                          ${remaining.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Funding Periods</CardTitle>
              <CardDescription>Quarterly funding availability and spend tracking.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {plan.fundingPeriods.map((fp: any) => {
                  const pct = fp.available > 0 ? Math.round((fp.spent / fp.available) * 100) : 0;
                  return (
                    <div key={fp.label} className={`rounded-lg border p-3 ${fp.status === "current" ? "border-accent" : ""}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium">{fp.label}</p>
                        <Badge variant="outline" className={`text-[10px] h-4 capitalize ${periodStatusStyle[fp.status]}`}>
                          {fp.status}
                        </Badge>
                      </div>
                      <p className="text-lg font-semibold">${fp.available.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Spent: ${fp.spent.toLocaleString()}</p>
                      {fp.status !== "future" && <Progress value={pct} className="mt-2 h-1.5" />}
                      {fp.status === "future" && <p className="mt-2 text-[11px] text-muted-foreground italic">Not yet available</p>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Invoices ── */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-sm">Recent Invoices</CardTitle>
              <Link to="/invoices">
                <Button variant="ghost" size="sm" className="text-xs gap-1"><ExternalLink className="h-3 w-3" />View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {p.invoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs font-medium">{inv.id}</TableCell>
                      <TableCell className="text-sm">{inv.provider}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{inv.category}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{inv.date}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{inv.amount}</TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Providers ── */}
        <TabsContent value="providers" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Connected Providers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>ABN</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead className="text-right">Invoices YTD</TableHead>
                    <TableHead className="text-right">Amount YTD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {p.providers.map((prov: any) => (
                    <TableRow key={prov.name}>
                      <TableCell className="font-medium text-sm">{prov.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{prov.abn}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${prov.type === "Registered" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                          {prov.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{prov.services}</TableCell>
                      <TableCell className="text-right text-sm">{prov.invoicesYTD}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{prov.amountYTD}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notes ── */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-sm">Notes & Activity</CardTitle>
              <Button size="sm" variant="outline"><ClipboardList className="mr-1.5 h-3.5 w-3.5" />Add Note</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {p.notes.map((note: any, i: number) => (
                  <div key={note.id}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                        {note.author.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{note.author}</p>
                          <Badge variant="outline" className={`text-[10px] h-4 px-1.5 ${noteTypeColor[note.type] || ""}`}>
                            {note.type}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground ml-auto">{note.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{note.content}</p>
                      </div>
                    </div>
                    {i < p.notes.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
