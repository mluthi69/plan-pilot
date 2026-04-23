import { useEffect, useMemo, useRef } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { useBookings } from "@/hooks/useBookings";
import { Card } from "@/components/ui/card";
import { MapPin, AlertCircle } from "lucide-react";

interface Props {
  /** The date being viewed in the Scheduler. The map shows that calendar day. */
  date: Date;
  /** Optional staff filter — when set, only show that staff member's stops + a polyline route. */
  staffId?: string | null;
}

/**
 * Compact route map for the day shown in Schedule. Plots every booking with
 * resolved coordinates as numbered markers in time order. When `staffId` is
 * set, draws a polyline connecting that staff member's consecutive stops.
 *
 * Lazy-loads the Google Maps JS SDK once via `useGoogleMaps()` so the rest
 * of the app pays no cost when this view isn't open.
 */
export default function ScheduleDayMap({ date, staffId }: Props) {
  const { ready, error } = useGoogleMaps();
  const { data: bookings = [] } = useBookings();
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const overlaysRef = useRef<Array<google.maps.Marker | google.maps.Polyline>>([]);

  // Filter to bookings on the selected day with resolved coords.
  const stops = useMemo(() => {
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    return bookings
      .filter((b) => {
        const t = new Date(b.starts_at).getTime();
        if (t < dayStart.getTime() || t > dayEnd.getTime()) return false;
        if (b.end_lat == null || b.end_lng == null) return false;
        if (staffId && !b.staff.some((s) => s.staff_id === staffId)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [bookings, date, staffId]);

  // Initialise the map once the SDK and container are ready.
  useEffect(() => {
    if (!ready || !mapEl.current || mapRef.current) return;
    mapRef.current = new google.maps.Map(mapEl.current, {
      center: { lat: -33.8688, lng: 151.2093 }, // Sydney fallback
      zoom: 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: "greedy",
    });
  }, [ready]);

  // Re-render markers/polyline when stops change.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    if (stops.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    stops.forEach((b, i) => {
      const pos = { lat: b.end_lat as number, lng: b.end_lng as number };
      bounds.extend(pos);
      const marker = new google.maps.Marker({
        position: pos,
        map: mapRef.current!,
        label: { text: String(i + 1), color: "white", fontWeight: "600" },
        title: `${b.participant?.name ?? ""} — ${new Date(b.starts_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}`,
      });
      overlaysRef.current.push(marker);
    });

    if (staffId && stops.length > 1) {
      const line = new google.maps.Polyline({
        path: stops.map((b) => ({ lat: b.end_lat as number, lng: b.end_lng as number })),
        strokeColor: "hsl(173 80% 36%)",
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: mapRef.current!,
      });
      overlaysRef.current.push(line);
    }

    mapRef.current.fitBounds(bounds, 48);
  }, [ready, stops, staffId]);

  if (error) {
    return (
      <Card className="flex items-center gap-2 p-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" /> {error}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> Day map
        </span>
        <span className="text-muted-foreground">
          {stops.length} stop{stops.length === 1 ? "" : "s"}
          {staffId ? " · routed" : ""}
        </span>
      </div>
      <div ref={mapEl} className="h-[280px] w-full bg-muted" />
      {!ready && (
        <div className="border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground">
          Loading map…
        </div>
      )}
    </Card>
  );
}
