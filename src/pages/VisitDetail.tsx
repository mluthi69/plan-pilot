import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Play, CheckCircle2, PenLine, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVisit, useStartVisit, useEndVisit, useSignVisit } from "@/hooks/useVisits";
import { useNotes } from "@/hooks/useNotes";
import NoteComposer from "@/components/NoteComposer";

const statusBadge: Record<string, string> = {
  scheduled: "bg-info/10 text-info border-info/30",
  in_progress: "bg-warning/15 text-warning-foreground border-warning/40",
  completed: "bg-success/10 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  no_show: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function VisitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: visit, isLoading } = useVisit(id);
  const { data: notes = [] } = useNotes({ visitId: id });
  const start = useStartVisit();
  const end = useEndVisit();
  const sign = useSignVisit();
  const [signName, setSignName] = useState("");
  const [showNote, setShowNote] = useState(false);

  if (isLoading || !visit) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  const fmt = (s: string | null) =>
    s ? new Date(s).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{visit.participant_name ?? "Participant"}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {fmt(visit.scheduled_start)} – {fmt(visit.scheduled_end)}
          </p>
          {(visit as any).participants?.address && (
            <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {(visit as any).participants.address}
            </p>
          )}
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs capitalize ${statusBadge[visit.status] ?? ""}`}>
          {visit.status.replace("_", " ")}
        </span>
      </header>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">
        {visit.status === "scheduled" && (
          <Button onClick={() => start.mutate(visit.id)} disabled={start.isPending}>
            <Play className="mr-1.5 h-4 w-4" /> Start visit
          </Button>
        )}
        {visit.status === "in_progress" && (
          <Button onClick={() => end.mutate(visit.id)} disabled={end.isPending}>
            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Complete visit
          </Button>
        )}
        <Button variant="outline" onClick={() => setShowNote((s) => !s)}>
          <PenLine className="mr-1.5 h-4 w-4" />
          {showNote ? "Hide note" : "Add note"}
        </Button>
      </div>

      {/* Timing */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Scheduled</p>
          <p className="mt-1 text-sm">{fmt(visit.scheduled_start)} – {fmt(visit.scheduled_end)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Actual</p>
          <p className="mt-1 text-sm">{fmt(visit.actual_start)} – {fmt(visit.actual_end)}</p>
        </div>
      </div>

      {/* Note composer */}
      {showNote && (
        <NoteComposer
          participantId={visit.participant_id}
          visitId={visit.id}
          onSaved={() => setShowNote(false)}
        />
      )}

      {/* Existing notes */}
      <section>
        <h2 className="mb-2 text-sm font-semibold">Notes ({notes.length})</h2>
        {notes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No notes captured yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg border border-border bg-card p-3">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{n.note_type.replace("_", " ")}</span>
                  <span>{new Date(n.created_at).toLocaleString("en-AU")}</span>
                </div>
                {n.title && <p className="text-sm font-medium">{n.title}</p>}
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">— {n.author_name ?? "Unknown"}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Acknowledgement */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Participant acknowledgement</h2>
        {visit.participant_signed ? (
          <p className="mt-2 text-sm text-success">
            Signed by <span className="font-medium">{visit.participant_signature_name}</span> on{" "}
            {fmt(visit.participant_signed_at)}
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!signName.trim()) return;
              sign.mutate({ id: visit.id, name: signName });
            }}
            className="mt-2 flex items-end gap-2"
          >
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Type participant's name as signature</label>
              <Input value={signName} onChange={(e) => setSignName(e.target.value)} placeholder="e.g. Sarah Mitchell" />
            </div>
            <Button type="submit" disabled={sign.isPending || !signName.trim()}>Capture</Button>
          </form>
        )}
      </section>
    </div>
  );
}