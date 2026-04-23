import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNdisCategories } from "@/hooks/useNdisCategories";
import {
  useStaffSkills,
  useUpsertStaffSkill,
  useRemoveStaffSkill,
  type Proficiency,
} from "@/hooks/useStaffSkills";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface Props {
  staffId: string;
}

export default function StaffSkillsEditor({ staffId }: Props) {
  const { data: categories = [] } = useNdisCategories();
  const { data: skills = [] } = useStaffSkills(staffId);
  const upsert = useUpsertStaffSkill();
  const remove = useRemoveStaffSkill();
  const [pickCat, setPickCat] = useState("");
  const [pickProf, setPickProf] = useState<Proficiency>("competent");

  const haveCodes = new Set(skills.map((s) => s.support_category));
  const available = categories.filter((c) => !haveCodes.has(c.code));

  return (
    <Card>
      <CardHeader>
        <CardTitle>NDIS skills</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {skills.length === 0 && (
            <p className="text-sm text-muted-foreground">No skills assigned yet.</p>
          )}
          {skills.map((s) => {
            const cat = categories.find((c) => c.code === s.support_category);
            return (
              <Badge key={s.id} variant="secondary" className="gap-2 pr-1">
                <span>
                  {cat?.name ?? s.support_category}{" "}
                  <span className="text-xs text-muted-foreground">({s.proficiency})</span>
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  onClick={() => remove.mutate({ id: s.id, staff_id: staffId })}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>

        <div className="flex flex-wrap items-end gap-2 border-t pt-4">
          <div className="flex-1 min-w-[240px] space-y-1.5">
            <label className="text-sm font-medium">Add category</label>
            <Select value={pickCat} onValueChange={setPickCat}>
              <SelectTrigger><SelectValue placeholder="Select PACE category…" /></SelectTrigger>
              <SelectContent>
                {available.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name} <span className="text-muted-foreground">· {c.budget_bucket}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Proficiency</label>
            <Select value={pickProf} onValueChange={(v) => setPickProf(v as Proficiency)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="trainee">Trainee</SelectItem>
                <SelectItem value="competent">Competent</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={!pickCat || upsert.isPending}
            onClick={() => {
              upsert.mutate(
                { staff_id: staffId, support_category: pickCat, proficiency: pickProf },
                { onSuccess: () => setPickCat("") }
              );
            }}
          >
            Add skill
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}