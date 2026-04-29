import { useState } from "react";
import { MapPin, LogIn, LogOut, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useVisitGeoFixes, useCaptureGeoFix } from "@/hooks/useVisitGeoFixes";
import {
  useParticipantGoals,
  useVisitGoalContributions,
  useUpsertVisitGoalContribution,
} from "@/hooks/useGoals";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  visitId: string;
  participantId: string;
  serviceType?: string | null;
  /** Called when AI note is generated, with the suggested body. */
  onAiNote?: (body: string) => void;
}

export default function VisitEvidencePanel({ visitId, participantId, serviceType, onAiNote }: Props) {
  const { data: fixes = [] } = useVisitGeoFixes(visitId);
  const capture = useCaptureGeoFix();
  const { data: goals = [] } = useParticipantGoals(participantId);
  const { data: contributions = [] } = useVisitGoalContributions(visitId);
  const upsertContribution = useUpsertVisitGoalContribution();
  const [aiLoading, setAiLoading] = useState(false);

  const checkIn = fixes.find((f) => f.kind === "check_in");
  const checkOut = fixes.find((f) => f.kind === "check_out");

  const contributionByGoal = new Map(contributions.map((c) => [c.goal_id, c]));

  async function generateAi() {
    setAiLoading(true);
    try {
      const { data, error } = await (supabase as any).functions.invoke("ai-visit-note", {
        body: { visit_id: visitId, participant_id: participantId, service_type: serviceType ?? null },
      });
      if (error) throw error;
      if (data?.note) {
        onAiNote?.(data.note);
        toast.success("AI draft note ready");
      } else {
        toast.error("AI did not return a note");
      }
    } catch (e: any) {
      toast.error(e.message ?? "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Geo check-in / out */}
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Proof of presence</p>
            <span className="text-[11px] text-muted-foreground">{fixes.length} location(s) captured</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={checkIn ? "outline" : "default"}
              size="sm"
              disabled={!!checkIn || capture.isPending}
              onClick={() => capture.mutate({ visitId, kind: "check_in" })}
            >
              <LogIn className="mr-1.5 h-4 w-4" />
              {checkIn ? "Checked in" : "Check in"}
            </Button>
            <Button
              variant={checkOut ? "outline" : "default"}
              size="sm"
              disabled={!checkIn || !!checkOut || capture.isPending}
              onClick={() => capture.mutate({ visitId, kind: "check_out" })}
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              {checkOut ? "Checked out" : "Check out"}
            </Button>
          </div>
          {fixes.length > 0 && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {fixes.map((f) => (
                <li key={f.id} className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  <span className="capitalize">{f.kind.replace("_", " ")}</span>
                  <span>· {new Date(f.captured_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span>· {f.lat.toFixed(5)}, {f.lng.toFixed(5)}</span>
                  {f.accuracy_m && <span>· ±{Math.round(Number(f.accuracy_m))}m</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Goal contributions */}
      <Card>
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Goal contributions</p>
            {goals.length > 0 && (
              <Badge variant="outline" className="text-[10px]">{goals.length} goal(s)</Badge>
            )}
          </div>
          {goals.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No active goals. Add goals to the participant's profile first.
            </p>
          ) : (
            <div className="space-y-3">
              {goals.filter((g) => g.status === "active").map((g) => {
                const c = contributionByGoal.get(g.id);
                return (
                  <div key={g.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{g.title}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const active = (c?.progress_rating ?? 0) >= n;
                          return (
                            <button
                              type="button"
                              key={n}
                              onClick={() =>
                                upsertContribution.mutate({
                                  visit_id: visitId,
                                  goal_id: g.id,
                                  progress_rating: n,
                                  contribution_note: c?.contribution_note ?? null,
                                })
                              }
                              className={active ? "text-warning" : "text-muted-foreground"}
                              aria-label={`Rate ${n}`}
                            >
                              <Star className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <Textarea
                      rows={2}
                      placeholder="How did this visit contribute?"
                      defaultValue={c?.contribution_note ?? ""}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v === (c?.contribution_note ?? "")) return;
                        upsertContribution.mutate({
                          visit_id: visitId,
                          goal_id: g.id,
                          progress_rating: c?.progress_rating ?? null,
                          contribution_note: v || null,
                        });
                      }}
                      className="mt-2 text-xs"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI note assist */}
      <Card>
        <CardContent className="flex items-center justify-between gap-3 py-4">
          <div>
            <p className="text-sm font-semibold">AI-assisted note</p>
            <p className="text-xs text-muted-foreground">
              Drafts a progress note using prior visit notes, the goal contributions captured above, and the service type.
            </p>
          </div>
          <Button onClick={generateAi} disabled={aiLoading} size="sm">
            <Sparkles className="mr-1.5 h-4 w-4" />
            {aiLoading ? "Drafting…" : "Draft with AI"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}