import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AppLocation, LocationInput, LocationType,
  useCreateLocation, useUpdateLocation,
} from "@/hooks/useLocations";
import { useGeocode } from "@/hooks/useGeocode";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  location?: AppLocation | null;
}

const TYPES: { value: LocationType; label: string }[] = [
  { value: "office", label: "Office" },
  { value: "clinic", label: "Clinic" },
  { value: "community", label: "Community venue" },
  { value: "school", label: "School" },
  { value: "shc", label: "Supported Independent Living" },
  { value: "sda", label: "Specialist Disability Accommodation" },
  { value: "other", label: "Other" },
];

const empty: LocationInput = {
  name: "", address: "", suburb: null, state: null, postcode: null,
  lat: null, lng: null, location_type: "community", active: true, notes: null,
};

export default function LocationFormDialog({ open, onOpenChange, location }: Props) {
  const [form, setForm] = useState<LocationInput>(empty);
  const [geocoded, setGeocoded] = useState(false);
  const create = useCreateLocation();
  const update = useUpdateLocation();
  const geocode = useGeocode();
  const isEdit = !!location;

  useEffect(() => {
    if (open) {
      setGeocoded(!!(location?.lat && location?.lng));
      setForm(location
        ? {
            name: location.name, address: location.address,
            suburb: location.suburb, state: location.state, postcode: location.postcode,
            lat: location.lat, lng: location.lng,
            location_type: location.location_type, active: location.active, notes: location.notes,
          }
        : empty);
    }
  }, [open, location]);

  const handleGeocode = async () => {
    if (!form.address.trim()) return;
    try {
      const r = await geocode.mutateAsync(form.address);
      setForm((f) => ({ ...f, address: r.formatted_address, lat: r.lat, lng: r.lng }));
      setGeocoded(true);
    } catch (e) { /* toast handled upstream */ }
  };

  const submit = async () => {
    if (!form.name.trim() || !form.address.trim()) return;
    let payload = form;
    if (!geocoded) {
      try {
        const r = await geocode.mutateAsync(form.address);
        payload = { ...form, address: r.formatted_address, lat: r.lat, lng: r.lng };
      } catch { /* still allow save without coords */ }
    }
    if (isEdit && location) {
      await update.mutateAsync({ id: location.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const saving = create.isPending || update.isPending || geocode.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit location" : "Add location"}</DialogTitle>
          <DialogDescription>
            Saved venues for booking pickups, deliveries, and group activities.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={form.location_type} onValueChange={(v: LocationType) => setForm({ ...form, location_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Active</Label>
              <div className="h-9 flex items-center">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Address</Label>
              <div className="flex gap-2">
                <Input
                  value={form.address}
                  onChange={(e) => { setForm({ ...form, address: e.target.value, lat: null, lng: null }); setGeocoded(false); }}
                  placeholder="123 Smith St, Sydney NSW 2000"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleGeocode} disabled={!form.address.trim() || saving}>
                  {geocode.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                </Button>
              </div>
              {geocoded && form.lat && form.lng ? (
                <p className="text-[11px] text-success">Geocoded · {form.lat.toFixed(5)}, {form.lng.toFixed(5)}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">Will geocode on save.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Suburb</Label>
              <Input value={form.suburb ?? ""} onChange={(e) => setForm({ ...form, suburb: e.target.value || null })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">State</Label>
                <Input value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value || null })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Postcode</Label>
                <Input value={form.postcode ?? ""} onChange={(e) => setForm({ ...form, postcode: e.target.value || null })} />
              </div>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value || null })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !form.name.trim() || !form.address.trim()}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}{isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
