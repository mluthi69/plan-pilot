import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Star, FileText, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Pack {
  line: any;
  visit: any;
  geo_fixes: any[];
  goal_contributions: any[];
  notes: any[];
  attachments: any[];
}

export default function EvidencePack() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Pack | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/evidence-pack?token=${token}`;
    fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "" } })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Failed to load");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) return <div className="mx-auto max-w-2xl p-8 text-sm text-destructive">{error}</div>;
  if (!data) return <div className="mx-auto max-w-2xl p-8 text-sm text-muted-foreground">Loading evidence pack…</div>;

  const fmt = (s?: string | null) => (s ? new Date(s).toLocaleString("en-AU") : "—");

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Evidence pack</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Invoice {data.line.invoice?.invoice_number} · line for {data.visit?.participant_name ?? "participant"}.
        </p>
      </header>

      <Card>
        <CardContent className="space-y-2 py-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Service</p>
              <p>{data.line.description ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p>${Number(data.line.amount).toFixed(2)} ({Number(data.line.quantity)} {data.line.unit} × ${Number(data.line.unit_price).toFixed(2)})</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
              <p>{fmt(data.visit?.scheduled_start)} – {fmt(data.visit?.scheduled_end)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Actual</p>
              <p>{fmt(data.visit?.actual_start)} – {fmt(data.visit?.actual_end)}</p>
            </div>
          </div>
          {data.visit?.participant_signed && (
            <Badge variant="outline" className="bg-success/10 text-success">
              Signed by {data.visit.participant_signature_name}
            </Badge>
          )}
        </CardContent>
      </Card>

      {data.geo_fixes.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Location proof</h2>
          <ul className="space-y-1 text-sm">
            {data.geo_fixes.map((f, i) => (
              <li key={i} className="flex items-center gap-2 rounded border border-border bg-card p-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{f.kind.replace("_", " ")}</span>
                <span className="text-muted-foreground">· {fmt(f.captured_at)}</span>
                <a
                  className="ml-auto text-xs text-primary underline"
                  href={`https://maps.google.com/?q=${f.lat},${f.lng}`}
                  target="_blank" rel="noreferrer"
                >
                  View on map
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.goal_contributions.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Goal contributions</h2>
          <div className="space-y-2">
            {data.goal_contributions.map((c, i) => (
              <Card key={i}>
                <CardContent className="space-y-1 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{c.goal?.title ?? "Goal"}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3.5 w-3.5 ${(c.progress_rating ?? 0) >= n ? "text-warning fill-current" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {c.contribution_note && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{c.contribution_note}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {data.notes.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Visit notes</h2>
          <div className="space-y-2">
            {data.notes.map((n, i) => (
              <Card key={i}>
                <CardContent className="space-y-1 py-3 text-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="capitalize">{n.note_type.replace("_", " ")}</span>
                    <span>· {fmt(n.created_at)}</span>
                  </div>
                  {n.title && <p className="font-medium">{n.title}</p>}
                  <p className="whitespace-pre-wrap">{n.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {data.attachments.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">Photos & files</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {data.attachments.map((a, i) =>
              a.mime_type?.startsWith("image/") && a.signed_url ? (
                <a key={i} href={a.signed_url} target="_blank" rel="noreferrer" className="overflow-hidden rounded border border-border">
                  <img src={a.signed_url} alt={a.filename} className="h-24 w-full object-cover" />
                </a>
              ) : (
                <a key={i} href={a.signed_url ?? "#"} target="_blank" rel="noreferrer" className="flex h-24 flex-col items-center justify-center rounded border border-border bg-muted/30 text-center text-[10px] text-muted-foreground">
                  <FileText className="h-5 w-5" />
                  <span className="line-clamp-2 break-all px-1">{a.filename}</span>
                </a>
              ),
            )}
          </div>
        </section>
      )}
    </div>
  );
}