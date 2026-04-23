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
  AddressLabel, ParticipantAddress, ParticipantAddressInput,
  useCreateParticipantAddress, useUpdateParticipantAddress,
} from "@/hooks/useParticipantAddresses";
import { useGeocode } from "@/hooks/useGeocode";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  participantId: string;
  address?: ParticipantAddress | null;
}

const LABELS: { value: AddressLabel; label: string }[] = [
  { value: "home", label: "Home" }, { value: "work", label: "Work" },
  { value: "respite", label: "Respite" }, { value: "school", label: "School" },
  { value: "family", label: "Family" }, { value: "other", label: "Other" },
];

export default function ParticipantAddressDialog({ open, onOpenChange, participantId, address }: Props) {
  const isEdit = !!address;
  const [form, setForm] = useState<ParticipantAddressInput>({
    participant_id: participantId, label: "home", address: "",
    suburb: null, state: null, postcode: null, lat: null, lng: null,
    is_primary: false, notes: null,
  });
  const [geocoded, setGeocoded] = useState(false);
  const create = useCreateParticipantAddress();
  const update = useUpdateParticipantAddress();
  const geocode = useGeocode();

  useEffect(() => {
    if (open) {
      setGeocoded(!!(address?.lat && address?.lng));
      setForm(address
        ? {
            participant_id: address.participant_id, label: address.label, address: address.address,
            suburb: address.suburb, state: address.state, postcode: address.postcode,
            lat: address.lat, lng: address.lng, is_primary: address.is_primary, notes: address.notes,
          }
        : { participant_id: participantId, label: "home", address: "",
            suburb: null, state: null, postcode: null, lat: null, lng: null,
            is_primary: false, notes: null });
    }
  }, [open, address, participantId]);

  const handleGeocode = async () => {
    if (!form.address.trim()) return;
    try {
      const r = await geocode.mutateAsync(form.address);
      setForm((f) => ({ ...f, address: r.formatted_address, lat: r.lat, lng: r.lng }));
      setGeocoded(true);
    } catch { /* */ }
  };

  const submit = async () => {
    if (!form.address.trim()) return;
    let payload = form;
    if (!geocoded) {
      try {
        const r = await geocode.mutateAsync(form.address);
        payload = { ...form, address: r.formatted_address, lat: r.lat, lng: r.lng };
      } catch { /* allow save */ }
    }
    if (isEdit && address) {
      await update.mutateAsync({ id: address.id, participant_id: address.participant_id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const saving = create.isPending || update.isPending || geocode.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit address" : "Add address"}</DialogTitle>
          <DialogDescription>Saved addresses appear in the booking location picker.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Label</Label>
              <Select value={form.label} onValueChange={(v: AddressLabel) => setForm({ ...form, label: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LABELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Primary</Label>
              <div className="h-9 flex items-center">
                <Switch checked={form.is_primary} onCheckedChange={(v) => setForm({ ...form, is_primary: v })} />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
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
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Suburb</Label>
              <Input value={form.suburb ?? ""} onChange={(e) => setForm({ ...form, suburb: e.target.value || null })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">State</Label>
              <Input value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value || null })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Postcode</Label>
              <Input value={form.postcode ?? ""} onChange={(e) => setForm({ ...form, postcode: e.target.value || null })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value || null })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !form.address.trim()}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}{isEdit ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
