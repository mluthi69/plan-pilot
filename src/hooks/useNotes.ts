import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

export type NoteType = "progress" | "case_note" | "contact_log" | "incident";

export interface Note {
  id: string;
  org_id: string;
  participant_id: string;
  participant: { id: string; name: string } | null;
  visit_id: string | null;
  author_id: string | null;
  author_name: string | null;
  note_type: NoteType;
  template_key: string | null;
  title: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  participant_id: string;
  visit_id?: string | null;
  note_type?: NoteType;
  template_key?: string | null;
  title?: string | null;
  body: string;
}

export function useNotes(opts?: { participantId?: string; visitId?: string }) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["notes", orgId, opts?.participantId, opts?.visitId],
    enabled: !!orgId,
    queryFn: async () => {
      let q = (supabase as any)
        .from("notes")
        .select("*, participants(name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (opts?.participantId) q = q.eq("participant_id", opts.participantId);
      if (opts?.visitId) q = q.eq("visit_id", opts.visitId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((n: any) => ({
        ...n,
        participant: n.participants ? { id: n.participant_id, name: n.participants.name } : null,
      })) as Note[];
    },
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  const { user } = useUser();
  return useMutation({
    mutationFn: async (input: NoteInput) => {
      if (!orgId) throw new Error("No organization");
      const { data, error } = await (supabase as any)
        .from("notes")
        .insert({
          ...input,
          org_id: orgId,
          author_id: user?.id ?? null,
          author_name:
            user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      // If linked to a visit, mark notes_submitted = true
      if (input.visit_id) {
        await (supabase as any)
          .from("visits")
          .update({ notes_submitted: true })
          .eq("id", input.visit_id);
      }
      return data as Note;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
      toast.success("Note saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save note"),
  });
}

export const NOTE_TEMPLATES: { key: string; label: string; body: string }[] = [
  {
    key: "progress_standard",
    label: "Standard progress note",
    body:
      "Goal worked on:\n\nActivities completed:\n\nParticipant response:\n\nOutcomes / next steps:\n",
  },
  {
    key: "incident",
    label: "Incident report",
    body:
      "What happened:\n\nWho was involved:\n\nImmediate actions taken:\n\nFollow-up required:\n",
  },
  {
    key: "contact_log",
    label: "Contact log",
    body: "Contacted:\n\nMethod:\n\nPurpose:\n\nOutcome:\n",
  },
];