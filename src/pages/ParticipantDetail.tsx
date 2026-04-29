import { useParams, Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, User, ClipboardList,
  MoreHorizontal, ExternalLink, Shield,
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
import CommunicationTimeline from "@/components/CommunicationTimeline";
import ParticipantAddressesPanel from "@/components/locations/ParticipantAddressesPanel";
import ParticipantFundingPanel from "@/components/funding/ParticipantFundingPanel";
import ParticipantGoalsPanel from "@/components/goals/ParticipantGoalsPanel";
import { useParticipant } from "@/hooks/useParticipantsDb";
import { useBudgetCategories } from "@/hooks/useBudgetCategories";
import { useAgreements } from "@/hooks/useAgreements";
import { useInvoices } from "@/hooks/useInvoices";
import { useNotes } from "@/hooks/useNotes";
import { useBookings } from "@/hooks/useBookings";
import { useVisits } from "@/hooks/useVisits";
import { buildCategoryUtilisation } from "@/lib/budgetUtilisation";

const budgetTypeColor: Record<string, string> = {
  Core: "bg-accent/10 text-accent border-accent/20",
  CB: "bg-info/10 text-info border-info/20",
  Capital: "bg-warning/10 text-warning border-warning/20",
};

const noteTypeColor: Record<string, string> = {
  contact: "bg-info/10 text-info border-info/20",
  progress: "bg-accent/10 text-accent border-accent/20",
  incident: "bg-destructive/10 text-destructive border-destructive/20",
  case: "bg-accent/10 text-accent border-accent/20",
};

const visitStatusColor: Record<string, string> = {
  scheduled: "bg-info/10 text-info border-info/30",
  in_progress: "bg-warning/15 text-warning border-warning/40",
  completed: "bg-success/10 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  no_show: "bg-destructive/10 text-destructive border-destructive/30",
};

function formatDateTime(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString("en-AU")}`;
}

export default function ParticipantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: participant, isLoading } = useParticipant(id);
  const { data: categories = [] } = useBudgetCategories(id);
  const { data: agreements = [] } = useAgreements(id);
  const { data: allInvoices = [] } = useInvoices();
  const { data: notes = [] } = useNotes({ participantId: id });
  const { data: allBookings = [] } = useBookings();
  const { data: allVisits = [] } = useVisits();

  const now = new Date();
  const appointments = useMemo(
    () =>
      allBookings
        .filter((b) => b.participant_id === id && new Date(b.ends_at) >= now)
        .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allBookings, id],
  );
  const participantVisits = useMemo(
    () =>
      allVisits
        .filter((v) => v.participant_id === id)
        .sort((a, b) => +new Date(b.scheduled_start) - +new Date(a.scheduled_start)),
    [allVisits, id],
  );

  const invoices = useMemo(
    () => allInvoices.filter((i) => i.participant_id === id),
    [allInvoices, id]
  );

  const utilisation = useMemo(
    () => buildCategoryUtilisation(categories, agreements, invoices),
    [categories, agreements, invoices]
  );

  const totals = useMemo(() => {
    const totalBudget = utilisation.reduce((s, c) => s + Number(c.budget), 0);
    const totalUsed = utilisation.reduce((s, c) => s + c.used, 0);
    return {
      totalBudget,
      totalUsed,
      pct: totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0,
    };
  }, [utilisation]);

  const providerSummary = useMemo(() => {
    const map = new Map<string, { name: string; abn: string; count: number; amount: number }>();
    for (const inv of invoices) {
      const key = inv.provider_id ?? inv.provider?.name ?? "unknown";
      const existing = map.get(key) ?? {
        name: inv.provider?.name ?? "Unknown provider",
        abn: inv.provider?.abn ?? "—",
        count: 0,
        amount: 0,
      };
      existing.count += 1;
      existing.amount += Number(inv.amount ?? 0);
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [invoices]);

  if (isLoading || !participant) {
    return <div className="p-6 text-sm text-muted-foreground">Loading participant…</div>;
  }

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
        <span className="text-sm font-medium">{participant.name}</span>
      </div>

      {/* Profile header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {participant.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{participant.name}</h1>
              <Badge
                variant="outline"
                className={`text-[11px] capitalize ${
                  participant.status === "active"
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-warning/10 text-warning border-warning/20"
                }`}
              >
                {participant.status}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="h-3 w-3" /> NDIS {participant.ndis_number}</span>
              {participant.date_of_birth && (
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> DOB {formatDate(participant.date_of_birth)}</span>
              )}
              {participant.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {participant.phone}</span>}
              {participant.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {participant.email}</span>}
              {participant.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {participant.address}</span>}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">Plan Managed</Badge>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Shield className="h-3 w-3" /> Plan {formatDate(participant.plan_start)} – {formatDate(participant.plan_end)}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
      </div>

      {/* Plan summary strip */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Plan Period</p>
            <p className="text-sm font-semibold mt-0.5">{formatDate(participant.plan_start)}</p>
            <p className="text-[11px] text-muted-foreground">to {formatDate(participant.plan_end)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Budget</p>
            <p className="text-sm font-semibold mt-0.5">{money(Number(participant.total_budget))}</p>
            <p className="text-[11px] text-muted-foreground">Across {categories.length} categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Utilisation</p>
            <p className="text-sm font-semibold mt-0.5">{totals.pct}%</p>
            <Progress value={totals.pct} className="mt-1.5 h-1.5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Active Providers</p>
            <p className="text-sm font-semibold mt-0.5">{providerSummary.length}</p>
            <p className="text-[11px] text-muted-foreground">{invoices.length} invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed detail */}
      <Tabs defaultValue="budget">
        <TabsList>
          <TabsTrigger value="budget">Budget & Funding</TabsTrigger>
          <TabsTrigger value="funding">Funding Agreements</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="notes">Notes & Activity</TabsTrigger>
          <TabsTrigger value="comms">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="funding" className="mt-4">
          {id && <ParticipantFundingPanel participantId={id} />}
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          {id && <ParticipantGoalsPanel participantId={id} />}
        </TabsContent>

        {/* ── Appointments (upcoming bookings) ── */}
        <TabsContent value="appointments" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Upcoming Appointments</CardTitle>
              <CardDescription>
                Scheduled bookings for this participant. Click a row to open the linked visit.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {appointments.length === 0 ? (
                <p className="px-6 py-8 text-sm text-muted-foreground">No upcoming appointments.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((b) => {
                      const visit = allVisits.find((v) => v.booking_id === b.id);
                      const href = visit ? `/visits/${visit.id}` : "#";
                      return (
                        <TableRow
                          key={b.id}
                          className={visit ? "cursor-pointer hover:bg-muted/50" : ""}
                          onClick={() => visit && (window.location.href = href)}
                        >
                          <TableCell className="text-xs">{formatDateTime(b.starts_at)}</TableCell>
                          <TableCell className="text-sm">
                            {b.support_category ?? b.service_type}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {b.staff[0]?.display_name ?? "Unallocated"}
                            {b.staff.length > 1 && (
                              <span className="ml-1">+{b.staff.length - 1}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {b.resolved_location_name ?? b.location_address ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize ${visitStatusColor[b.status] ?? ""}`}
                            >
                              {b.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Visits (history) ── */}
        <TabsContent value="visits" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Visits</CardTitle>
              <CardDescription>
                All visits for this participant. Click a row to open the visit detail.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {participantVisits.length === 0 ? (
                <p className="px-6 py-8 text-sm text-muted-foreground">No visits recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Signed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participantVisits.map((v) => (
                      <TableRow
                        key={v.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => (window.location.href = `/visits/${v.id}`)}
                      >
                        <TableCell className="text-xs">
                          {formatDateTime(v.scheduled_start)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {v.staff[0]?.display_name ?? "Unallocated"}
                          {v.staff.length > 1 && (
                            <span className="ml-1">+{v.staff.length - 1}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${visitStatusColor[v.status] ?? ""}`}
                          >
                            {v.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className={v.notes_submitted ? "text-success" : "text-muted-foreground"}>
                            {v.notes_submitted ? "✓" : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className={v.participant_signed ? "text-success" : "text-muted-foreground"}>
                            {v.participant_signed ? "✓" : "—"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Budget ── */}
        <TabsContent value="budget" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Support Categories</CardTitle>
              <CardDescription>
                Budget breakdown by support category. Committed = active agreements; Pending = unpaid invoices; Paid = settled invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {utilisation.length === 0 ? (
                <p className="px-6 py-8 text-sm text-muted-foreground">No budget categories configured for this plan.</p>
              ) : (
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
                    {utilisation.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium text-sm">{cat.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${budgetTypeColor[cat.code] ?? ""}`}>{cat.code}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">{money(Number(cat.budget))}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{money(cat.committed)}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{money(cat.pending)}</TableCell>
                        <TableCell className="text-right text-sm">{money(cat.paid)}</TableCell>
                        <TableCell
                          className={`text-right text-sm font-medium ${
                            cat.remaining < Number(cat.budget) * 0.15 ? "text-destructive" : ""
                          }`}
                        >
                          {money(cat.remaining)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={cat.pct} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-8 text-right">{cat.pct}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
              {invoices.length === 0 ? (
                <p className="px-6 py-8 text-sm text-muted-foreground">No invoices for this participant yet.</p>
              ) : (
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
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs font-medium">{inv.invoice_number}</TableCell>
                        <TableCell className="text-sm">{inv.provider?.name ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{inv.category}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(inv.received_at)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{money(Number(inv.amount))}</TableCell>
                        <TableCell><StatusBadge status={inv.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Providers ── */}
        <TabsContent value="providers" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Connected Providers</CardTitle>
              <CardDescription>Providers who have invoiced for this participant.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {providerSummary.length === 0 ? (
                <p className="px-6 py-8 text-sm text-muted-foreground">No connected providers yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>ABN</TableHead>
                      <TableHead className="text-right">Invoices</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providerSummary.map((prov) => (
                      <TableRow key={prov.name}>
                        <TableCell className="font-medium text-sm">{prov.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{prov.abn}</TableCell>
                        <TableCell className="text-right text-sm">{prov.count}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{money(prov.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {notes.map((note, i) => (
                    <div key={note.id}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                          {(note.author_name ?? "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">{note.author_name ?? "Unknown"}</p>
                            <Badge variant="outline" className={`text-[10px] h-4 px-1.5 capitalize ${noteTypeColor[note.note_type] || ""}`}>
                              {note.note_type}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground ml-auto">{formatDate(note.created_at)}</span>
                          </div>
                          {note.title && <p className="text-sm font-medium mb-1">{note.title}</p>}
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{note.body}</p>
                        </div>
                      </div>
                      {i < notes.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Communications ── */}
        <TabsContent value="comms" className="mt-4">
          <CommunicationTimeline
            participantId={id || ""}
            participantName={participant.name}
            participantPhone={participant.phone ?? ""}
            participantEmail={participant.email ?? ""}
          />
        </TabsContent>

        {/* ── Addresses ── */}
        <TabsContent value="addresses" className="mt-4">
          <ParticipantAddressesPanel participantId={id || ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
