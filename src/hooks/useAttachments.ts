import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "./useOrg";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";

export interface Attachment {
  id: string;
  org_id: string;
  participant_id: string | null;
  visit_id: string | null;
  note_id: string | null;
  storage_path: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
  signed_url?: string;
}

const BUCKET = "visit-attachments";

export function useVisitAttachments(visitId: string | undefined) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: ["attachments", orgId, visitId],
    enabled: !!orgId && !!visitId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("attachments")
        .select("*")
        .eq("org_id", orgId)
        .eq("visit_id", visitId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as Attachment[];
      // Sign URLs in parallel for preview
      const signed = await Promise.all(
        rows.map(async (r) => {
          const { data: s } = await (supabase as any).storage
            .from(BUCKET)
            .createSignedUrl(r.storage_path, 60 * 60);
          return { ...r, signed_url: s?.signedUrl };
        })
      );
      return signed;
    },
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  const orgId = useOrgId();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (input: {
      file: File;
      visitId?: string | null;
      participantId?: string | null;
      noteId?: string | null;
    }) => {
      if (!orgId) throw new Error("No organization");
      const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${orgId}/${input.visitId ?? "misc"}/${Date.now()}-${safeName}`;
      const { error: upErr } = await (supabase as any).storage
        .from(BUCKET)
        .upload(path, input.file, {
          contentType: input.file.type,
          upsert: false,
        });
      if (upErr) throw upErr;

      const { error: insErr } = await (supabase as any).from("attachments").insert({
        org_id: orgId,
        participant_id: input.participantId ?? null,
        visit_id: input.visitId ?? null,
        note_id: input.noteId ?? null,
        storage_path: path,
        filename: input.file.name,
        mime_type: input.file.type || null,
        size_bytes: input.file.size,
        uploaded_by: user?.id ?? null,
      });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attachments"] });
      toast.success("File uploaded");
    },
    onError: (e: any) => toast.error(e.message ?? "Upload failed"),
  });
}