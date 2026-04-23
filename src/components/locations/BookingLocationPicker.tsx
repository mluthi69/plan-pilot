import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLocations } from "@/hooks/useLocations";
import { useParticipantAddresses } from "@/hooks/useParticipantAddresses";
import { useGeocode } from "@/hooks/useGeocode";

export type LocationKind = "participant_address" | "global_location" | "override";

export interface ResolvedLocation {
  location_kind: LocationKind;
  participant_address_id: string | null;
  location_id: string | null;
  location_address: string | null;
  end_lat: number | null;
  end_lng: number | null;
}

interface Props {
  participantId: string | undefined;
  value: ResolvedLocation;
  onChange: (next: ResolvedLocation) => void;
}

export default function BookingLocationPicker({ participantId, value, onChange }: Props) {
  const { data: addresses = [] } = useParticipantAddresses(participantId);
  const { data: locations = [] } = useLocations({ activeOnly: true });
  const geocode = useGeocode();
  const [overrideText, setOverrideText] = useState(value.location_address ?? "");
  const [geocoded, setGeocoded] = useState(value.location_kind === "override" && !!value.end_lat);

  // When participant changes, default to their primary address if any & nothing set.
  useEffect(() => {
    if (
      value.location_kind === "participant_address" &&
      !value.participant_address_id &&
      addresses.length
    ) {
      const primary = addresses.find((a) => a.is_primary) ?? addresses[0];
      onChange({
        location_kind: "participant_address",
        participant_address_id: primary.id,
        location_id: null,
        location_address: primary.address,
        end_lat: primary.lat,
        end_lng: primary.lng,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantId, addresses.length]);

  const setKind = (kind: LocationKind) => {
    if (kind === "participant_address") {
      const primary = addresses.find((a) => a.is_primary) ?? addresses[0];
      onChange({
        location_kind: "participant_address",
        participant_address_id: primary?.id ?? null,
        location_id: null,
        location_address: primary?.address ?? null,
        end_lat: primary?.lat ?? null,
        end_lng: primary?.lng ?? null,
      });
    } else if (kind === "global_location") {
      onChange({
        location_kind: "global_location",
        participant_address_id: null,
        location_id: null,
        location_address: null,
        end_lat: null,
        end_lng: null,
      });
    } else {
      onChange({
        location_kind: "override",
        participant_address_id: null,
        location_id: null,
        location_address: overrideText || null,
        end_lat: null,
        end_lng: null,
      });
      setGeocoded(false);
    }
  };

  const pickAddress = (id: string) => {
    const a = addresses.find((x) => x.id === id);
    if (!a) return;
    onChange({
      location_kind: "participant_address",
      participant_address_id: a.id,
      location_id: null,
      location_address: a.address,
      end_lat: a.lat,
      end_lng: a.lng,
    });
  };

  const pickLocation = (id: string) => {
    const l = locations.find((x) => x.id === id);
    if (!l) return;
    onChange({
      location_kind: "global_location",
      participant_address_id: null,
      location_id: l.id,
      location_address: l.address,
      end_lat: l.lat,
      end_lng: l.lng,
    });
  };

  const handleGeocode = async () => {
    if (!overrideText.trim()) return;
    try {
      const r = await geocode.mutateAsync(overrideText);
      setOverrideText(r.formatted_address);
      setGeocoded(true);
      onChange({
        location_kind: "override",
        participant_address_id: null,
        location_id: null,
        location_address: r.formatted_address,
        end_lat: r.lat,
        end_lng: r.lng,
      });
    } catch { /* */ }
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <Label className="text-xs">Location</Label>
      <RadioGroup
        value={value.location_kind}
        onValueChange={(v) => setKind(v as LocationKind)}
        className="grid grid-cols-3 gap-2"
      >
        <Label className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs cursor-pointer ${value.location_kind === "participant_address" ? "border-primary bg-primary/5" : ""}`}>
          <RadioGroupItem value="participant_address" /> Participant
        </Label>
        <Label className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs cursor-pointer ${value.location_kind === "global_location" ? "border-primary bg-primary/5" : ""}`}>
          <RadioGroupItem value="global_location" /> Saved venue
        </Label>
        <Label className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs cursor-pointer ${value.location_kind === "override" ? "border-primary bg-primary/5" : ""}`}>
          <RadioGroupItem value="override" /> Custom
        </Label>
      </RadioGroup>

      {value.location_kind === "participant_address" && (
        addresses.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No saved addresses. Add one from the participant's profile.
          </p>
        ) : (
          <Select
            value={value.participant_address_id ?? ""}
            onValueChange={pickAddress}
          >
            <SelectTrigger><SelectValue placeholder="Select address…" /></SelectTrigger>
            <SelectContent>
              {addresses.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label.charAt(0).toUpperCase() + a.label.slice(1)} — {a.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      )}

      {value.location_kind === "global_location" && (
        locations.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No saved venues. Add one from Settings → Locations.
          </p>
        ) : (
          <Select
            value={value.location_id ?? ""}
            onValueChange={pickLocation}
          >
            <SelectTrigger><SelectValue placeholder="Select venue…" /></SelectTrigger>
            <SelectContent>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name} — {l.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      )}

      {value.location_kind === "override" && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <Input
              value={overrideText}
              onChange={(e) => {
                setOverrideText(e.target.value);
                setGeocoded(false);
                onChange({
                  ...value,
                  location_address: e.target.value || null,
                  end_lat: null,
                  end_lng: null,
                });
              }}
              placeholder="123 Smith St, Sydney NSW 2000"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleGeocode} disabled={!overrideText.trim() || geocode.isPending}>
              {geocode.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            </Button>
          </div>
          {geocoded && value.end_lat && value.end_lng ? (
            <p className="text-[11px] text-success">Geocoded · {value.end_lat.toFixed(5)}, {value.end_lng.toFixed(5)}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">Click <MapPin className="inline h-3 w-3" /> to geocode (enables travel calc).</p>
          )}
        </div>
      )}
    </div>
  );
}
