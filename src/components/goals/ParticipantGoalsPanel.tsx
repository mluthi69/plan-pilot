import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Target, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useParticipantGoals,
  useUpsertGoal,
  useDeleteGoal,
  NDIS_OUTCOME_DOMAINS,
  type ParticipantGoal,
} from "@/hooks/useGoals";
import { useFundingAgreements } from "@/hooks/useFundingAgreements";
import { useAgreementGoalLinks } from "@/hooks/useAgreementCategoryGoals";

interface Props {
  participantId: string;
}

const STATUS_TONE: Record<string, string> = {
  active: "bg-info/10 text-info border-info/30",
  achieved: "bg-success/10 text-success border-success/30",
  discontinued: "bg-muted text-muted-foreground border-border",
};

export default function ParticipantGoalsPanel({ participantId }: Props) {
  const { data: goals = [], isLoading } = useParticipantGoals(participantId);
  const upsert = useUpsertGoal();
  const remove = useDeleteGoal();
  const [editing, setEditing] = useState<Partial<ParticipantGoal> | null>(null);

  // Resolve "this goal is linked to <NDIS code(s)>" via active agreements.
  const { data: agreements = [] } = useFundingAgreements(participantId);
  const agreementCategoryIds = useMemo(
    () =>
      agreements
        .filter((a) => a.status === "active")
        .flatMap((a) => a.categories.map((c) => c.id)),
    [agreements],
  );
  const catCodeById = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of agreements) for (const c of a.categories) m.set(c.id, c.support_category_code);
    return m;
  }, [agreements]);
  const { data: links = [] } = useAgreementGoalLinks(agreementCategoryIds);
  const codesByGoal = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of links) {
      const code = catCodeById.get(l.agreement_category_id);
      if (!code) continue;
      if (!m.has(l.goal_id)) m.set(l.goal_id, new Set());
      m.get(l.goal_id)!.add(code);
    }
    return m;
  }, [links, catCodeById]);

  function openNew() {
    setEditing({ participant_id: participantId, title: "", status: "active" });
  }

  async function save() {
    if (!editing?.title?.trim()) return;
    await upsert.mutateAsync({
      ...editing,
      participant_id: participantId,
      title: editing.title!,
    } as any);
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">NDIS goals</h2>
          <p className="text-xs text-muted-foreground">
            Goals appear in visit notes so staff can record contributions to each one.
          </p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New goal
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Target className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No goals captured yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Add the participant's NDIS plan goals so each visit can be linked back to outcomes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {goals.map((g) => (
            <Card key={g.id}>
              <CardContent className="flex items-start justify-between gap-3 py-3">
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{g.title}</p>
                    <Badge variant="outline" className={`text-[10px] capitalize ${STATUS_TONE[g.status] ?? ""}`}>
                      {g.status}
                    </Badge>
                    {g.ndis_outcome_domain && (
                      <Badge variant="outline" className="text-[10px]">{g.ndis_outcome_domain}</Badge>
                    )}
                    {[...(codesByGoal.get(g.id) ?? [])].map((code) => (
                      <Badge key={code} variant="outline" className="gap-1 text-[10px] bg-primary/5 text-primary border-primary/30">
                        <Link2 className="h-2.5 w-2.5" /> {code}
                      </Badge>
                    ))}
                  </div>
                  {g.description && (
                    <p className="whitespace-pre-wrap text-xs text-muted-foreground">{g.description}</p>
                  )}
                  {g.target_date && (
                    <p className="text-[11px] text-muted-foreground">Target: {new Date(g.target_date).toLocaleDateString("en-AU")}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(g)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(g.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit goal" : "New goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={editing?.title ?? ""}
                onChange={(e) => setEditing((p) => ({ ...(p ?? {}), title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={editing?.description ?? ""}
                onChange={(e) => setEditing((p) => ({ ...(p ?? {}), description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>NDIS outcome domain</Label>
                <Select
                  value={editing?.ndis_outcome_domain ?? ""}
                  onValueChange={(v) => setEditing((p) => ({ ...(p ?? {}), ndis_outcome_domain: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {NDIS_OUTCOME_DOMAINS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={editing?.status ?? "active"}
                  onValueChange={(v) => setEditing((p) => ({ ...(p ?? {}), status: v as any }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="achieved">Achieved</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Target date</Label>
              <Input
                type="date"
                value={editing?.target_date ?? ""}
                onChange={(e) => setEditing((p) => ({ ...(p ?? {}), target_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending || !editing?.title?.trim()}>
              {upsert.isPending ? "Saving…" : "Save goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}