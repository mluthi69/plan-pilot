import { useState } from "react";
import { Bell, CheckCheck, AlertTriangle, FileText, DollarSign, Users, Shield, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type NotificationType = "approval" | "alert" | "info" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  source?: string;
}

const notifications: Notification[] = [
  { id: "n-001", type: "approval", title: "Invoice #INV-2024-0892 requires approval", description: "Provider: Allied Health Partners · $2,480.00 · Participant: Sarah Chen. Amount exceeds auto-approval threshold ($2,000).", timestamp: "5 min ago", read: false, actionLabel: "Review", source: "Invoice Engine" },
  { id: "n-002", type: "alert", title: "Budget threshold breached — Core supports", description: "Participant James Wilson's Core budget utilisation has reached 92%. Funding period ends 30 Apr 2026.", timestamp: "18 min ago", read: false, source: "Budget Monitor" },
  { id: "n-003", type: "approval", title: "Payment run #PR-0047 awaiting release", description: "12 invoices totalling $18,420.50 ready for payment. Requires Finance Admin approval.", timestamp: "1 hr ago", read: false, actionLabel: "Approve Run", source: "Payments" },
  { id: "n-004", type: "info", title: "Price Guide updated — PAPL v2026.1", description: "NDIS Pricing Arrangements and Price Limits effective 1 Mar 2026 have been imported. 14 line items changed.", timestamp: "2 hr ago", read: true, source: "Price Guide Engine" },
  { id: "n-005", type: "alert", title: "Webhook delivery failure — n8n endpoint", description: "ParticipantConsentChanged event failed delivery to n8n endpoint. 3 retries exhausted. Manual intervention required.", timestamp: "6 hr ago", read: true, actionLabel: "View Log", source: "Automations" },
  { id: "n-006", type: "system", title: "Scheduled maintenance — 28 Feb 02:00 AEDT", description: "Platform maintenance window for database optimisation. Expected downtime: 15 minutes.", timestamp: "1 day ago", read: true, source: "Platform" },
  { id: "n-007", type: "info", title: "New provider registered — Therapy Plus Pty Ltd", description: "ABN 98 765 432 101 verified. Provider added to directory and available for invoice matching.", timestamp: "1 day ago", read: true, source: "Providers" },
  { id: "n-008", type: "approval", title: "Consent update requires review", description: "Participant Maria Garcia has updated data sharing consent. New permissions need tenant admin acknowledgement.", timestamp: "2 days ago", read: true, actionLabel: "Review Consent", source: "Participant Portal" },
];

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  approval: { icon: FileText, color: "text-warning", bg: "bg-warning/10" },
  alert: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  info: { icon: Bell, color: "text-info", bg: "bg-info/10" },
  system: { icon: Shield, color: "text-muted-foreground", bg: "bg-muted" },
};

export default function Notifications() {
  const [tab, setTab] = useState("all");
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(notifications.filter((n) => n.read).map((n) => n.id))
  );

  const markAllRead = () => setReadIds(new Set(notifications.map((n) => n.id)));
  const markRead = (id: string) => setReadIds((prev) => new Set([...prev, id]));

  const filtered = tab === "all"
    ? notifications
    : tab === "unread"
      ? notifications.filter((n) => !readIds.has(n.id))
      : notifications.filter((n) => n.type === tab);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
          Mark all read
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge className="ml-1.5 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approval">Approvals</TabsTrigger>
          <TabsTrigger value="alert">Alerts</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="space-y-2">
            {filtered.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No notifications to show</p>
                </CardContent>
              </Card>
            )}
            {filtered.map((n) => {
              const config = typeConfig[n.type];
              const Icon = config.icon;
              const isRead = readIds.has(n.id);

              return (
                <Card
                  key={n.id}
                  className={`transition-colors cursor-pointer hover:bg-muted/30 ${!isRead ? "border-l-2 border-l-accent" : ""}`}
                  onClick={() => markRead(n.id)}
                >
                  <CardContent className="flex items-start gap-3 py-3 px-4">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!isRead ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                        <span className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {n.timestamp}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{n.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {n.source && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">
                            {n.source}
                          </Badge>
                        )}
                        {n.actionLabel && (
                          <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                            {n.actionLabel}
                          </Button>
                        )}
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground ml-auto"
                            onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
