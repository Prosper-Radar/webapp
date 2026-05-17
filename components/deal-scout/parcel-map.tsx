"use client";

import * as React from "react";
import mapboxgl from "mapbox-gl";
import { useTheme } from "next-themes";
import { Box, Compass, Maximize2, Minimize2, X } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

import { cn } from "@/lib/utils";
import type { DashboardRow } from "@/lib/types/dashboard";

export type MapPoint = Pick<DashboardRow, "id" | "lat" | "lng" | "title" | "totalScore" | "tier">;

/** Mapbox Standard — bâtiments 3D + éclairage (cf. Mapbox Studio) */
const STYLE_STANDARD = "mapbox://styles/mapbox/standard";

type MapWithConfig = mapboxgl.Map & {
  setConfigProperty?: (importId: string, configName: string, value: unknown) => void;
};

function applyStandardLook(map: mapboxgl.Map) {
  const m = map as MapWithConfig;
  try {
    m.setConfigProperty?.("basemap", "lightPreset", "dusk");
    m.setConfigProperty?.("basemap", "showPointOfInterestLabels", true);
    m.setConfigProperty?.("basemap", "showTransitLabels", true);
  } catch {
    /* setConfigProperty selon version GL */
  }
  map.easeTo({ pitch: 58, bearing: -30, duration: 1600 });
}

function buildMarkerEl(
  point: MapPoint,
  selected: boolean,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.title = point.title;
  btn.className = cn(
    "flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full border px-2 text-xs font-semibold tabular-nums shadow-lg transition-transform outline-none select-none",
    "bg-white/95 text-neutral-900 backdrop-blur-sm dark:bg-zinc-900/95 dark:text-zinc-50",
    selected
      ? "z-10 scale-110 border-blue-500 ring-2 ring-blue-500/35 dark:border-sky-400 dark:ring-sky-400/40"
      : "border-neutral-300/90 hover:scale-105 hover:border-blue-400/60 dark:border-zinc-600/90 dark:hover:border-sky-500/50",
    point.totalScore >= 80 &&
      "border-emerald-500/50 text-emerald-800 dark:border-emerald-400/50 dark:text-emerald-100",
    point.totalScore >= 65 &&
      point.totalScore < 80 &&
      "border-blue-500/40 text-blue-800 dark:border-sky-400/40 dark:text-sky-100",
  );
  btn.textContent = String(point.totalScore);
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
}

export function ParcelMap({
  points,
  focusedId,
  onMarkerSelect,
}: Readonly<{
  points: MapPoint[];
  focusedId: string | null;
  onMarkerSelect: (id: string) => void;
}>) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();
  const { resolvedTheme } = useTheme();
  const mapTheme = resolvedTheme === "light" ? "light" : "dark";
  const [view3d, setView3d] = React.useState(true);
  const [fullscreen, setFullscreen] = React.useState(false);

  const styleUrl = React.useMemo(
    () => (view3d ? STYLE_STANDARD : `mapbox://styles/mapbox/${mapTheme}-v11`),
    [view3d, mapTheme],
  );

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const markersRef = React.useRef<mapboxgl.Marker[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const lastBoundsKey = React.useRef("");

  const plotPoints = React.useMemo(
    () =>
      points.filter(
        (p): p is MapPoint & { lat: number; lng: number } =>
          typeof p.lat === "number" &&
          typeof p.lng === "number" &&
          Number.isFinite(p.lat) &&
          Number.isFinite(p.lng),
      ),
    [points],
  );

  const boundsKey = React.useMemo(
    () => plotPoints.map((p) => `${p.id}|${p.lat}|${p.lng}`).join(";"),
    [plotPoints],
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  React.useEffect(() => {
    if (!mounted || !token || !containerRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [-80.19, 25.76],
      zoom: 10,
      pitch: 0,
      bearing: 0,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
    mapRef.current = map;

    map.once("load", () => {
      setMapLoaded(true);
      if (styleUrl.includes("standard")) {
        applyStandardLook(map);
      } else {
        map.easeTo({ pitch: 0, bearing: 0, duration: 400 });
      }
    });

    return () => {
      setMapLoaded(false);
      lastBoundsKey.current = "";
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [mounted, token, styleUrl]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    requestAnimationFrame(() => {
      map.resize();
    });
  }, [fullscreen, mapLoaded]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (plotPoints.length === 0) return;

    for (const p of plotPoints) {
      const el = buildMarkerEl(p, focusedId === p.id, () => onMarkerSelect(p.id));
      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }

    if (boundsKey !== lastBoundsKey.current) {
      lastBoundsKey.current = boundsKey;
      const targetZoom = view3d ? 15.6 : 13;
      if (plotPoints.length === 1) {
        map.jumpTo({ center: [plotPoints[0].lng, plotPoints[0].lat], zoom: targetZoom });
      } else {
        const b = new mapboxgl.LngLatBounds();
        for (const p of plotPoints) {
          b.extend([p.lng, p.lat]);
        }
        map.fitBounds(b, { padding: fullscreen ? 48 : 72, maxZoom: view3d ? 17.2 : 13, duration: 0 });
      }
    }
  }, [mapLoaded, boundsKey, focusedId, plotPoints, onMarkerSelect, view3d, fullscreen]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || plotPoints.length === 0) return;
    const t = plotPoints.find((p) => p.id === focusedId);
    if (!t) return;
    const zoomTarget = view3d ? Math.max(map.getZoom(), 15.4) : Math.max(map.getZoom(), 13);
    map.easeTo({
      center: [t.lng, t.lat],
      zoom: zoomTarget,
      duration: 550,
    });
  }, [focusedId, mapLoaded, plotPoints, view3d]);

  const mapHeightClass = fullscreen ? "h-[100dvh] min-h-[100dvh]" : "h-[min(44vh,440px)]";
  const shellHeightClass = fullscreen ? "min-h-[100dvh]" : "";

  if (!mounted) {
    return (
      <div
        className="h-[min(44vh,440px)] w-full animate-pulse rounded-2xl border border-border/80 bg-muted/20"
        aria-hidden
      />
    );
  }

  if (!token) {
    return (
      <div className="flex h-[min(44vh,440px)] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/80 bg-muted/15 px-6 text-center">
        <p className="text-sm font-medium text-foreground">Mapbox</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Ajoute <span className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</span> dans{" "}
          <span className="font-mono">.env.local</span> pour afficher la carte.
        </p>
      </div>
    );
  }

  if (plotPoints.length === 0) {
    return (
      <div className="flex h-[min(44vh,440px)] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-border/80 bg-muted/10 px-6 text-center">
        <p className="text-sm font-medium text-foreground">Pas de coordonnées</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Les parcelles n’ont pas de lat/lng (API sans géométrie, ou données incomplètes).
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-border/80 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.55)]",
        fullscreen && "fixed inset-0 z-[300] rounded-none border-0 shadow-none",
        !fullscreen && "rounded-2xl",
        shellHeightClass,
      )}
    >
      {fullscreen ? (
        <button
          type="button"
          onClick={() => setFullscreen(false)}
          className="pointer-events-auto absolute right-3 top-3 z-[320] inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg backdrop-blur-md hover:bg-black/65"
        >
          <X className="size-3.5" aria-hidden />
          Fermer
          <span className="hidden opacity-70 sm:inline">(Échap)</span>
        </button>
      ) : null}

      <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white/85 px-2.5 py-1.5 text-[11px] font-medium text-neutral-800 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-zinc-900/80 dark:text-zinc-100"
        >
          {fullscreen ? (
            <>
              <Minimize2 className="size-3.5 opacity-80" aria-hidden />
              Réduire
            </>
          ) : (
            <>
              <Maximize2 className="size-3.5 opacity-80" aria-hidden />
              Plein écran
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => setView3d((v) => !v)}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white/85 px-2.5 py-1.5 text-[11px] font-medium text-neutral-800 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-zinc-900/80 dark:text-zinc-100"
        >
          <Box className="size-3.5 opacity-80" aria-hidden />
          {view3d ? "Vue 2D" : "Vue 3D"}
        </button>
        <button
          type="button"
          onClick={() => {
            const map = mapRef.current;
            if (!map) return;
            map.easeTo({ bearing: 0, duration: 500 });
          }}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white/85 px-2.5 py-1.5 text-[11px] font-medium text-neutral-800 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-zinc-900/80 dark:text-zinc-100"
        >
          <Compass className="size-3.5 opacity-80" aria-hidden />
          Nord
        </button>
      </div>

      <div ref={containerRef} className={cn("w-full", mapHeightClass)} />

      <p
        className={cn(
          "pointer-events-none absolute text-[10px] text-muted-foreground/80",
          fullscreen ? "bottom-4 left-4" : "bottom-2 left-3",
        )}
      >
        {plotPoints.length} repères ·{" "}
        {view3d ? "Mapbox Standard · crépuscule" : `Carte ${mapTheme} · plat`} ·{" "}
        {fullscreen ? "plein écran" : "vue intégrée"}
      </p>
    </div>
  );
}
