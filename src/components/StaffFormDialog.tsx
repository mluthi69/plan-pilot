import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateStaff, useUpdateStaff, type Staff, type StaffInput } from "@/hooks/useStaff";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  staff?: Staff | null;
}

const empty: StaffInput = {
  first_name: "",
  last_name: "",
  preferred_name: null,
  email: null,
  phone: null,
  mobile: null,
  address: null,
  suburb: null,
  state: null,
  postcode: null,
  date_of_birth: null,
  gender: null,
  employment_type: "casual",
  contracted_hours_per_week: null,
  start_date: null,
  end_date: null,
  tfn_last4: null,
  super_fund: null,
  bank_bsb_last3: null,
  bank_acct_last3: null,
  ndis_worker_screening_no: null,
  screening_expiry: null,
  working_with_children_no: null,
  wwc_expiry: null,
  first_aid_expiry: null,
  drivers_licence_no: null,
  vehicle_available: false,
  bookable: true,
  status: "active",
  notes: null,
};

export default function StaffFormDialog({ open, onOpenChange, staff }: Props) {
  const create = useCreateStaff();
  const update = useUpdateStaff();
  const [form, setForm] = useState<StaffInput>(empty);

  useEffect(() => {
    if (staff) {
      const { id: _id, org_id: _o, created_at: _c, updated_at: _u, ...rest } = staff;
      setForm(rest);
    } else {
      setForm(empty);
    }
  }, [staff, open]);

  function set<K extends keyof StaffInput>(k: K, v: StaffInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (staff) {
      await update.mutateAsync({ id: staff.id, patch: form });
    } else {
      await create.mutateAsync(form);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{staff ? "Edit staff member" : "Add staff member"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First name *</Label>
              <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Last name *</Label>
              <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Preferred name</Label>
              <Input value={form.preferred_name ?? ""} onChange={(e) => set("preferred_name", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input value={form.mobile ?? ""} onChange={(e) => set("mobile", e.target.value || null)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Address</Label>
              <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Suburb</Label>
              <Input value={form.suburb ?? ""} onChange={(e) => set("suburb", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Select value={form.state ?? ""} onValueChange={(v) => set("state", v || null)}>
                <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Postcode</Label>
              <Input value={form.postcode ?? ""} onChange={(e) => set("postcode", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date of birth</Label>
              <Input type="date" value={form.date_of_birth ?? ""} onChange={(e) => set("date_of_birth", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Employment type</Label>
              <Select value={form.employment_type} onValueChange={(v) => set("employment_type", v as StaffInput["employment_type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full time</SelectItem>
                  <SelectItem value="part_time">Part time</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contracted hrs/week</Label>
              <Input type="number" step="0.5" value={form.contracted_hours_per_week ?? ""} onChange={(e) => set("contracted_hours_per_week", e.target.value ? Number(e.target.value) : null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v as StaffInput["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={form.start_date ?? ""} onChange={(e) => set("start_date", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>End date</Label>
              <Input type="date" value={form.end_date ?? ""} onChange={(e) => set("end_date", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>NDIS worker screening #</Label>
              <Input value={form.ndis_worker_screening_no ?? ""} onChange={(e) => set("ndis_worker_screening_no", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Screening expiry</Label>
              <Input type="date" value={form.screening_expiry ?? ""} onChange={(e) => set("screening_expiry", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Working with children #</Label>
              <Input value={form.working_with_children_no ?? ""} onChange={(e) => set("working_with_children_no", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>WWC expiry</Label>
              <Input type="date" value={form.wwc_expiry ?? ""} onChange={(e) => set("wwc_expiry", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>First aid expiry</Label>
              <Input type="date" value={form.first_aid_expiry ?? ""} onChange={(e) => set("first_aid_expiry", e.target.value || null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Driver's licence #</Label>
              <Input value={form.drivers_licence_no ?? ""} onChange={(e) => set("drivers_licence_no", e.target.value || null)} />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={form.bookable} onCheckedChange={(v) => set("bookable", v)} id="bookable" />
              <Label htmlFor="bookable">Bookable</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.vehicle_available} onCheckedChange={(v) => set("vehicle_available", v)} id="vehicle" />
              <Label htmlFor="vehicle">Vehicle available</Label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? "Saving…" : staff ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}