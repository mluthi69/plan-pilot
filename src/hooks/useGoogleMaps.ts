import { useEffect, useState } from "react";
import { useMapsConfig } from "./useGeocode";

/**
 * Loads the Google Maps JS SDK once per page using the public browser key
 * served by the `maps-config` edge function. Returns `{ ready, error }`.
 *
 * Restrict the key by HTTP referrer in Google Cloud Console — the key shipped
 * to the browser is intentionally narrow-scope.
 */
let loaderPromise: Promise<void> | null = null;

function loadScript(key: string): Promise<void> {
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if ((window as any).google?.maps) return resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=marker&v=weekly`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Maps SDK"));
    document.head.appendChild(s);
  });
  return loaderPromise;
}

export function useGoogleMaps() {
  const { data: cfg } = useMapsConfig();
  const [ready, setReady] = useState<boolean>(!!(typeof window !== "undefined" && (window as any).google?.maps));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cfg?.key || ready) return;
    loadScript(cfg.key)
      .then(() => setReady(true))
      .catch((e) => setError(e.message ?? "Maps load failed"));
  }, [cfg?.key, ready]);

  return { ready, error };
}
