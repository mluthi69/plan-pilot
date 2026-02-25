import { useState } from "react";
import { Zap, Plus, MoreHorizontal, Mail, Globe, ArrowRight, CheckCircle2, XCircle, Clock, Play, Pause, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const webhooks = [
  { id: "wh-001", name: "Invoice Received → Xero", event: "InvoiceReceived", target: "https://hooks.xero.com/ndis-inv", status: "active", lastFired: "2 min ago", successRate: "99.2%" },
  { id: "wh-002", name: "Approval → Slack Channel", event: "ApprovalRequested", target: "https://hooks.slack.com/T04X/B07Y", status: "active", lastFired: "18 min ago", successRate: "100%" },
  { id: "wh-003", name: "Budget Breach → PagerDuty", event: "BudgetThresholdBreached", target: "https://events.pagerduty.com/v2/enqueue", status: "paused", lastFired: "3 days ago", successRate: "97.8%" },
  { id: "wh-004", name: "Payment Run → Power Automate", event: "PaymentRunCreated", target: "https://prod-au.logic.azure.com/workflows/abc123", status: "active", lastFired: "1 hr ago", successRate: "100%" },
  { id: "wh-005", name: "Consent Changed → n8n", event: "ParticipantConsentChanged", target: "https://n8n.internal/webhook/consent", status: "error", lastFired: "6 hr ago", successRate: "82.1%" },
];

const emailConnectors = [
  { id: "ec-001", address: "invoices@acme-pm.ndisops.au", tenant: "Acme Plan Managers", purpose: "Invoice ingestion", messagesProcessed: 1247, lastReceived: "4 min ago", status: "active" },
  { id: "ec-002", address: "docs@acme-pm.ndisops.au", tenant: "Acme Plan Managers", purpose: "Document upload", messagesProcessed: 328, lastReceived: "2 hr ago", status: "active" },
  { id: "ec-003", address: "support@beta-sc.ndisops.au", tenant: "Beta Support Coord", purpose: "Case notes", messagesProcessed: 56, lastReceived: "1 day ago", status: "paused" },
];

const deliveryLog = [
  { id: "dl-001", webhook: "Invoice Received → Xero", event: "InvoiceReceived", status: "delivered", statusCode: 200, duration: "142ms", timestamp: "2026-02-25 09:12:34" },
  { id: "dl-002", webhook: "Approval → Slack Channel", event: "ApprovalRequested", status: "delivered", statusCode: 200, duration: "89ms", timestamp: "2026-02-25 08:54:11" },
  { id: "dl-003", webhook: "Consent Changed → n8n", event: "ParticipantConsentChanged", status: "failed", statusCode: 502, duration: "30012ms", timestamp: "2026-02-25 03:22:07" },
  { id: "dl-004", webhook: "Consent Changed → n8n", event: "ParticipantConsentChanged", status: "retrying", statusCode: 502, duration: "—", timestamp: "2026-02-25 03:23:07" },
  { id: "dl-005", webhook: "Payment Run → Power Automate", event: "PaymentRunCreated", status: "delivered", statusCode: 200, duration: "312ms", timestamp: "2026-02-25 08:01:00" },
];

type WebhookStatus = "active" | "paused" | "error";
type DeliveryStatus = "delivered" | "failed" | "retrying";

const webhookStatusStyles: Record<WebhookStatus, string> = {
  active: "bg-success/10 text-success border-success/20",
  paused: "bg-warning/10 text-warning border-warning/20",
  error: "bg-destructive/10 text-destructive border-destructive/20",
};

const deliveryStatusStyles: Record<DeliveryStatus, string> = {
  delivered: "bg-success/10 text-success border-success/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  retrying: "bg-warning/10 text-warning border-warning/20",
};

const DeliveryIcon = ({ status }: { status: DeliveryStatus }) => {
  if (status === "delivered") return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === "failed") return <XCircle className="h-3.5 w-3.5" />;
  return <RefreshCw className="h-3.5 w-3.5 animate-spin" />;
};

export default function Automations() {
  const [tab, setTab] = useState("webhooks");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Automations</h1>
          <p className="text-sm text-muted-foreground">Configure event routing, webhooks, email connectors, and integration endpoints.</p>
        </div>
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Automation
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <Globe className="h-4.5 w-4.5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{webhooks.filter(w => w.status === "active").length}</p>
                <p className="text-xs text-muted-foreground">Active Webhooks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10">
                <Mail className="h-4.5 w-4.5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{emailConnectors.length}</p>
                <p className="text-xs text-muted-foreground">Email Connectors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-4.5 w-4.5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">1,631</p>
                <p className="text-xs text-muted-foreground">Events Delivered (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                <XCircle className="h-4.5 w-4.5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-semibold">3</p>
                <p className="text-xs text-muted-foreground">Failed Deliveries (7d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="email">Email Connectors</TabsTrigger>
          <TabsTrigger value="log">Delivery Log</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Webhook Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Last Fired</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((wh) => (
                    <TableRow key={wh.id}>
                      <TableCell className="font-medium text-sm">{wh.name}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{wh.event}</code>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground font-mono">{wh.target}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={webhookStatusStyles[wh.status as WebhookStatus]}>
                          {wh.status === "active" ? <Play className="mr-1 h-3 w-3" /> : wh.status === "paused" ? <Pause className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                          {wh.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{wh.successRate}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{wh.lastFired}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Email Connector Addresses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Messages Processed</TableHead>
                    <TableHead>Last Received</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailConnectors.map((ec) => (
                    <TableRow key={ec.id}>
                      <TableCell className="font-mono text-xs font-medium">{ec.address}</TableCell>
                      <TableCell className="text-sm">{ec.purpose}</TableCell>
                      <TableCell className="text-sm">{ec.messagesProcessed.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ec.lastReceived}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={webhookStatusStyles[ec.status as WebhookStatus]}>
                          {ec.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="log">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recent Delivery Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HTTP</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryLog.map((dl) => (
                    <TableRow key={dl.id}>
                      <TableCell className="text-sm font-medium">{dl.webhook}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{dl.event}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${deliveryStatusStyles[dl.status as DeliveryStatus]} gap-1`}>
                          <DeliveryIcon status={dl.status as DeliveryStatus} />
                          {dl.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{dl.statusCode}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{dl.duration}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{dl.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
