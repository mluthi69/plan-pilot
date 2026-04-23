import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  REMINDER_TEMPLATES,
  useSendMessage,
  type MessageChannel,
} from "@/hooks/useMessages";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  participantId: string;
  participantName: string;
  participantPhone?: string | null;
  participantEmail?: string | null;
  bookingId?: string | null;
  visitId?: string | null;
  defaultWhenLabel?: string;
  defaultWorkerName?: string | null;
}

export default function SendMessageDialog({
  open,
  onOpenChange,
  participantId,
  participantName,
  participantPhone,
  participantEmail,
  bookingId,
  visitId,
  defaultWhenLabel = "tomorrow",
  defaultWorkerName,
}: Props) {
  const send = useSendMessage();
  const [channel, setChannel] = useState<MessageChannel>("sms");
  const [templateKey, setTemplateKey] = useState<string>("custom");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipient, setRecipient] = useState(participantPhone ?? "");

  const channelTemplates = useMemo(
    () => REMINDER_TEMPLATES.filter((t) => t.channel === channel),
    [channel]
  );

  const applyTemplate = (key: string) => {
    setTemplateKey(key);
    if (key === "custom") return;
    const tpl = REMINDER_TEMPLATES.find((t) => t.key === key);
    if (!tpl) return;
    const built = tpl.build({
      participantName,
      whenLabel: defaultWhenLabel,
      workerName: defaultWorkerName,
    });
    setSubject(built.subject ?? "");
    setBody(built.body);
  };

  const onChannelChange = (c: MessageChannel) => {
    setChannel(c);
    setRecipient(c === "email" ? (participantEmail ?? "") : c === "sms" ? (participantPhone ?? "") : "");
    setTemplateKey("custom");
  };

  const submit = () => {
    send.mutate(
      {
        participant_id: participantId,
        booking_id: bookingId,
        visit_id: visitId,
        channel,
        template_key: templateKey === "custom" ? null : templateKey,
        subject: channel === "email" ? subject || null : null,
        body,
        recipient: recipient || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setBody("");
          setSubject("");
          setTemplateKey("custom");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send message</DialogTitle>
          <DialogDescription>To {participantName}. Logged on the participant timeline.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Channel</Label>
              <Select value={channel} onValueChange={(v) => onChannelChange(v as MessageChannel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="note">Internal note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Template</Label>
              <Select value={templateKey} onValueChange={applyTemplate}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom message</SelectItem>
                  {channelTemplates.map((t) => (
                    <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {channel !== "note" && (
            <div>
              <Label htmlFor="recipient">{channel === "sms" ? "Mobile number" : "Email"}</Label>
              <Input
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={channel === "sms" ? "+61 4..." : "name@example.com"}
              />
            </div>
          )}

          {channel === "email" && (
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
          )}

          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a short message…"
            />
            {channel === "sms" && (
              <p className="mt-1 text-[11px] text-muted-foreground">{body.length} chars · 1 SMS = ~160 chars</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!body.trim() || send.isPending}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {channel === "note" ? "Log" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}