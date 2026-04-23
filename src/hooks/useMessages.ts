import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

export type MessageChannel = "sms" | "email" | "note";
export type MessageDirection = "outbound" | "inbound" | "log";
export type MessageStatus = "sent" | "delivered" | "failed" | "queued" | "logged";

export interface Message {
  id: string;
  org_id: string;
  participant_id: string;
  /** Embedded participant (only populated by useRecentMessages). */
  participant?: { id: string; name: string } | null;
  booking_id: string | null;
  visit_id: string | null;
  channel: MessageChannel;
  direction: MessageDirection;
  template_key: string | null;
  subject: string | null;
  body: string;
  recipient: string | null;
  status: MessageStatus;
  sent_by: string | null;
  sent_by_name: string | null;
  created_at: string;
}

export function useParticipantMessages(participantId: string | undefined) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["messages", orgId, participantId],
    enabled: !!orgId && !!participantId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("org_id", orgId)
        .eq("participant_id", participantId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });
}

export function useRecentMessages(limit = 20) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["messages-recent", orgId, limit],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("messages")
        .select("*, participants(name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((m: any) => ({ ...m, participant_name: m.participants?.name })) as (Message & { participant_name?: string })[];
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (input: {
      participant_id: string;
      booking_id?: string | null;
      visit_id?: string | null;
      channel: MessageChannel;
      template_key?: string | null;
      subject?: string | null;
      body: string;
      recipient?: string | null;
    }) => {
      if (!orgId) throw new Error("No organization");
      const { error } = await (supabase as any).from("messages").insert({
        org_id: orgId,
        participant_id: input.participant_id,
        booking_id: input.booking_id ?? null,
        visit_id: input.visit_id ?? null,
        channel: input.channel,
        direction: "outbound",
        template_key: input.template_key ?? null,
        subject: input.subject ?? null,
        body: input.body,
        recipient: input.recipient ?? null,
        status: input.channel === "note" ? "logged" : "sent",
        sent_by: user?.id ?? null,
        sent_by_name: user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      qc.invalidateQueries({ queryKey: ["messages-recent"] });
      toast.success(vars.channel === "note" ? "Logged" : "Message sent");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to send"),
  });
}

/* Reminder templates */

export interface ReminderTemplate {
  key: string;
  label: string;
  channel: MessageChannel;
  build: (ctx: { participantName: string; whenLabel: string; workerName?: string | null }) => { subject?: string; body: string };
}

export const REMINDER_TEMPLATES: ReminderTemplate[] = [
  {
    key: "visit_reminder_24h",
    label: "Visit reminder (24h)",
    channel: "sms",
    build: ({ participantName, whenLabel, workerName }) => ({
      body: "Hi " + participantName.split(" ")[0] + ", this is a reminder of your support visit " + whenLabel + (workerName ? " with " + workerName : "") + ". Reply STOP to opt out.",
    }),
  },
  {
    key: "visit_reminder_2h",
    label: "Visit reminder (2h)",
    channel: "sms",
    build: ({ participantName, whenLabel, workerName }) => ({
      body: "Hi " + participantName.split(" ")[0] + ", " + (workerName ?? "your support worker") + " is on their way for your visit " + whenLabel + ".",
    }),
  },
  {
    key: "visit_cancelled",
    label: "Visit cancelled",
    channel: "sms",
    build: ({ participantName, whenLabel }) => ({
      body: "Hi " + participantName.split(" ")[0] + ", your support visit " + whenLabel + " has been cancelled. We will be in touch to reschedule.",
    }),
  },
  {
    key: "agreement_for_signature",
    label: "Service agreement ready",
    channel: "email",
    build: ({ participantName }) => ({
      subject: "Your service agreement is ready to review",
      body: "Hi " + participantName.split(" ")[0] + ",\n\nYour service agreement is ready for review and signature. Please reply once you have had a chance to look it over.\n\nThanks",
    }),
  },
];
