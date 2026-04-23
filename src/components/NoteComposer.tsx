import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateNote, NOTE_TEMPLATES, type NoteType } from "@/hooks/useNotes";

interface Props {
  participantId: string;
  visitId?: string;
  onSaved?: () => void;
  defaultType?: NoteType;
}

export default function NoteComposer({ participantId, visitId, onSaved, defaultType = "progress" }: Props) {
  const create = useCreateNote();
  const [type, setType] = useState<NoteType>(defaultType);
  const [templateKey, setTemplateKey] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

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
    setTitle("");
    setBody("");
    setTemplateKey("");
    onSaved?.();
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
      <div className="flex justify-end">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? "Saving…" : "Save note"}
        </Button>
      </div>
    </form>
  );
}