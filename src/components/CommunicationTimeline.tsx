import { useState } from "react";
import { MessageSquare, Mail, FileText, Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParticipantMessages, type MessageChannel } from "@/hooks/useMessages";
import SendMessageDialog from "./SendMessageDialog";

const channelMeta: Record<MessageChannel, { icon: any; label: string; tone: string }> = {
  sms: { icon: MessageSquare, label: "SMS", tone: "text-info" },
  email: { icon: Mail, label: "Email", tone: "text-accent" },
  note: { icon: FileText, label: "Note", tone: "text-muted-foreground" },
};

interface Props {
  participantId: string;
  participantName: string;
  participantPhone?: string | null;
  participantEmail?: string | null;
}

export default function CommunicationTimeline({
  participantId,
  participantName,
  participantPhone,
  participantEmail,
}: Props) {
  const [open, setOpen] = useState(false);
  const { data: messages = [], isLoading } = useParticipantMessages(participantId);

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Communications</h2>
          <p className="text-[11px] text-muted-foreground">SMS, email, and notes for this participant.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" /> New message
        </Button>
      </div>

      {isLoading ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <Send className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm font-medium">No messages yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Send a reminder, log a phone call, or email an agreement.
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-border">
          {messages.map((m) => {
            const meta = channelMeta[m.channel];
            const Icon = meta.icon;
            return (
              <li key={m.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.tone}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2 text-xs">
                      <span className="font-medium uppercase">{meta.label}</span>
                      {m.recipient && <span className="text-muted-foreground">→ {m.recipient}</span>}
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">
                        {new Date(m.created_at).toLocaleString("en-AU", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="ml-auto rounded-full bg-secondary px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground">
                        {m.status}
                      </span>
                    </div>
                    {m.subject && <p className="mt-1 text-sm font-medium">{m.subject}</p>}
                    <p className="mt-1 whitespace-pre-line text-sm text-foreground">{m.body}</p>
                    {m.sent_by_name && (
                      <p className="mt-1 text-[11px] text-muted-foreground">— {m.sent_by_name}</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <SendMessageDialog
        open={open}
        onOpenChange={setOpen}
        participantId={participantId}
        participantName={participantName}
        participantPhone={participantPhone}
        participantEmail={participantEmail}
      />
    </div>
  );
}