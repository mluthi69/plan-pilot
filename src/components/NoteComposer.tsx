import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateNote, NOTE_TEMPLATES, type NoteType } from "@/hooks/useNotes";
import { useUploadAttachment, useVisitAttachments } from "@/hooks/useAttachments";
import { Paperclip, X, FileText } from "lucide-react";

interface Props {
  participantId: string;
  visitId?: string;
  onSaved?: () => void;
  defaultType?: NoteType;
}

export default function NoteComposer({ participantId, visitId, onSaved, defaultType = "progress" }: Props) {
  const create = useCreateNote();
  const upload = useUploadAttachment();
  const { data: attachments = [] } = useVisitAttachments(visitId);
  const [type, setType] = useState<NoteType>(defaultType);
  const [templateKey, setTemplateKey] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  function applyTemplate(key: string) {
    setTemplateKey(key);
    const t = NOTE_TEMPLATES.find((x) => x.key === key);
    if (t) setBody(t.body);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await create.mutateAsync({
      participant_id: participantId,
      visit_id: visitId,
      note_type: type,
      template_key: templateKey || null,
      title: title || null,
      body,
    });
    // upload any pending photos/files now linked to this visit
    for (const f of pendingFiles) {
      await upload.mutateAsync({
        file: f,
        visitId: visitId ?? null,
        participantId,
      });
    }
    setTitle("");
    setBody("");
    setTemplateKey("");
    setPendingFiles([]);
    onSaved?.();
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    setPendingFiles((p) => [...p, ...Array.from(files)]);
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as NoteType)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="progress">Progress note</option>
            <option value="case_note">Case note</option>
            <option value="contact_log">Contact log</option>
            <option value="incident">Incident</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Template</Label>
          <select
            value={templateKey}
            onChange={(e) => applyTemplate(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">No template</option>
            {NOTE_TEMPLATES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Title (optional)</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Note</Label>
        <textarea
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-sans"
          placeholder="Describe what happened during the visit…"
        />
      </div>

      {/* Attachments */}
      {visitId && (
        <div className="space-y-2">
          <Label>Photos / files</Label>
          {attachments.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {attachments.map((a) =>
                a.mime_type?.startsWith("image/") ? (
                  <a key={a.id} href={a.signed_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-border">
                    <img src={a.signed_url} alt={a.filename} className="h-20 w-full object-cover" />
                  </a>
                ) : (
                  <a key={a.id} href={a.signed_url} target="_blank" rel="noreferrer" className="flex h-20 flex-col items-center justify-center gap-1 rounded-md border border-border bg-muted/30 p-2 text-center text-[10px] text-muted-foreground">
                    <FileText className="h-5 w-5" />
                    <span className="line-clamp-2 break-all">{a.filename}</span>
                  </a>
                )
              )}
            </div>
          )}
          {pendingFiles.length > 0 && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {pendingFiles.map((f, i) => (
                <li key={i} className="flex items-center gap-2 rounded border border-border px-2 py-1">
                  <Paperclip className="h-3 w-3" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <button type="button" onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50">
            <Paperclip className="h-3.5 w-3.5" />
            Add photo or file
            <input
              type="file"
              multiple
              accept="image/*,application/pdf"
              capture="environment"
              className="sr-only"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={create.isPending || upload.isPending}>
          {create.isPending || upload.isPending ? "Saving…" : "Save note"}
        </Button>
      </div>
    </form>
  );
}