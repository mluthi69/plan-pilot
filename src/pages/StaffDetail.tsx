import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil } from "lucide-react";
import { useStaffMember, staffDisplayName } from "@/hooks/useStaff";
import StaffFormDialog from "@/components/StaffFormDialog";
import StaffSkillsEditor from "@/components/StaffSkillsEditor";
import StaffAvailabilityEditor from "@/components/StaffAvailabilityEditor";

function expiryStatus(date: string | null): "ok" | "warn" | "expired" | "none" {
  if (!date) return "none";
  const d = new Date(date).getTime();
  const now = Date.now();
  if (d < now) return "expired";
  if (d - now < 30 * 24 * 60 * 60 * 1000) return "warn";
  return "ok";
}

function ExpiryRow({ label, date }: { label: string; date: string | null }) {
  const status = expiryStatus(date);
  const tone =
    status === "expired" ? "destructive" : status === "warn" ? "secondary" : "outline";
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span>{date ?? "—"}</span>
        {status !== "none" && status !== "ok" && (
          <Badge variant={tone as "destructive" | "secondary"}>{status === "expired" ? "Expired" : "Soon"}</Badge>
        )}
      </div>
    </div>
  );
}

export default function StaffDetail() {
  const { id } = useParams();
  const { data: staff, isLoading } = useStaffMember(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!staff)
    return (
      <div className="space-y-2">
        <Link to="/staff" className="text-sm text-primary hover:underline">← Back to Staff</Link>
        <p>Staff member not found.</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <Link to="/staff" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Staff
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{staffDisplayName(staff)}</h1>
          <p className="mt-1 text-sm text-muted-foreground capitalize">
            {staff.employment_type.replace("_", " ")} ·{" "}
            <Badge variant={staff.bookable ? "default" : "secondary"}>{staff.bookable ? "Bookable" : "Not bookable"}</Badge>{" "}
            <Badge variant="outline" className="capitalize">{staff.status.replace("_", " ")}</Badge>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-1.5 h-4 w-4" /> Edit profile
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Email </span>{staff.email ?? "—"}</div>
              <div><span className="text-muted-foreground">Phone </span>{staff.phone ?? "—"}</div>
              <div><span className="text-muted-foreground">Mobile </span>{staff.mobile ?? "—"}</div>
              <div><span className="text-muted-foreground">DOB </span>{staff.date_of_birth ?? "—"}</div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Address </span>
                {[staff.address, staff.suburb, staff.state, staff.postcode].filter(Boolean).join(", ") || "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Compliance</CardTitle></CardHeader>
            <CardContent>
              <ExpiryRow label="NDIS worker screening" date={staff.screening_expiry} />
              <ExpiryRow label="Working with children check" date={staff.wwc_expiry} />
              <ExpiryRow label="First aid" date={staff.first_aid_expiry} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <StaffSkillsEditor staffId={staff.id} />
        </TabsContent>

        <TabsContent value="availability">
          <StaffAvailabilityEditor staffId={staff.id} />
        </TabsContent>
      </Tabs>

      <StaffFormDialog open={editOpen} onOpenChange={setEditOpen} staff={staff} />
    </div>
  );
}