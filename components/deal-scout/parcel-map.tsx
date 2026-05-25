"use client";

import * as React from "react";
import mapboxgl from "mapbox-gl";
import { useTheme } from "next-themes";
import { Box, Compass, Maximize2, Minimize2, X } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

import { cn } from "@/lib/utils";
import type { DashboardRow } from "@/lib/types/dashboard";

export type MapPoint = Pick<DashboardRow, "id" | "lat" | "lng" | "title" | "totalScore" | "tier">;

const STYLE_STANDARD = "mapbox://styles/mapbox/standard";

type MapWithConfig = mapboxgl.Map & {
  setConfigProperty?: (importId: string, configName: string, value: unknown) => void;
};

function applyStandardLook(map: mapboxgl.Map) {
  const m = map as MapWithConfig;
  try {
    m.setConfigProperty?.("basemap", "lightPreset", "dusk");
    m.setConfigProperty?.("basemap", "showPointOfInterestLabels", true);
  } catch { /* version compat */ }
  map.easeTo({ pitch: 58, bearing: -30, duration: 1600 });
}

function tierColor(tier: string | null): string {
  if (tier === "A") return "#10b981";
  if (tier === "B") return "#38bdf8";
  return "#6b7280";
}

function buildMarkerEl(point: MapPoint, selected: boolean, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.title = point.title;
  const color = tierColor(point.tier);
  btn.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 36px;
    padding: 0 8px;
    border-radius: 999px;
    border: 2px solid ${selected ? color : "rgba(255,255,255,0.3)"};
    background: ${selected ? color + "22" : "rgba(0,0,0,0.65)"};
    color: ${selected ? color : "#fff"};
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 12px rgba(0,0,0,0.4)${selected ? ", 0 0 0 3px " + color + "44" : ""};
    transform: scale(${selected ? "1.15" : "1"});
    transition: all 0.15s;
    outline: none;
    white-space: nowrap;
  `;
  btn.textContent = String(point.totalScore);
  btn.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
  return btn;
}

export function ParcelMap({
  points,
  focusedId,
  onMarkerSelect,
  fillContainer = false,
  resizeKey,
}: Readonly<{
  points: MapPoint[];
  focusedId: string | null;
  onMarkerSelect: (id: string) => void;
  fillContainer?: boolean;
  resizeKey?: string;
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

  React.useEffect(() => { setMounted(true); }, []);

  React.useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
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
      if (styleUrl.includes("standard")) applyStandardLook(map);
      else map.easeTo({ pitch: 0, bearing: 0, duration: 400 });
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

  // Resize on fullscreen toggle
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    requestAnimationFrame(() => map.resize());
  }, [fullscreen, mapLoaded]);

  // Resize when the containing panel opens/closes (after CSS transition)
  React.useEffect(() => {
    if (!resizeKey) return;
    const timer = setTimeout(() => {
      mapRef.current?.resize();
    }, 310); // slightly after the 300ms panel CSS transition
    return () => clearTimeout(timer);
  }, [resizeKey]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (plotPoints.length === 0) return;
    for (const p of plotPoints) {
      const el = buildMarkerEl(p, focusedId === p.id, () => onMarkerSelect(p.id));
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      markersRef.current.push(marker);
    }
    if (boundsKey !== lastBoundsKey.current) {
      lastBoundsKey.current = boundsKey;
      if (plotPoints.length === 1) {
        map.jumpTo({ center: [plotPoints[0].lng, plotPoints[0].lat], zoom: view3d ? 15.6 : 13 });
      } else {
        const b = new mapboxgl.LngLatBounds();
        for (const p of plotPoints) b.extend([p.lng, p.lat]);
        map.fitBounds(b, { padding: fullscreen ? 48 : 60, maxZoom: view3d ? 16 : 13, duration: 0 });
      }
    }
  }, [mapLoaded, boundsKey, focusedId, plotPoints, onMarkerSelect, view3d, fullscreen]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || plotPoints.length === 0) return;
    const t = plotPoints.find((p) => p.id === focusedId);
    if (!t) return;
    map.easeTo({
      center: [t.lng, t.lat],
      zoom: view3d ? Math.max(map.getZoom(), 15.4) : Math.max(map.getZoom(), 13),
      duration: 550,
    });
  }, [focusedId, mapLoaded, plotPoints, view3d]);

  const fallbackH = fillContainer ? "h-full" : "h-[min(44vh,440px)]";

  if (!mounted) return <div className={cn(fallbackH, "w-full animate-pulse bg-muted/20")} aria-hidden />;

  if (!token) {
    return (
      <div className={cn(fallbackH, "flex w-full flex-col items-center justify-center gap-2 bg-muted/15 px-6 text-center")}>
        <p className="text-sm font-medium">Mapbox token manquant</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Ajoute <code className="font-mono text-[11px]">NEXT_PUBLIC_MAPBOX_TOKEN</code> dans <code>.env</code>.
        </p>
      </div>
    );
  }

  if (plotPoints.length === 0) {
    return (
      <div className={cn(fallbackH, "flex w-full flex-col items-center justify-center gap-2 bg-muted/10 px-6 text-center")}>
        <p className="text-sm font-medium">Aucune coordonnee</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Les parcelles n&apos;ont pas encore de lat/lng.
        </p>
      </div>
    );
  }

  const mapHeightClass = fullscreen
    ? "h-[100dvh] min-h-[100dvh]"
    : fillContainer
    ? "h-full"
    : "h-[min(44vh,440px)]";
  const shellHeightClass = fullscreen ? "min-h-[100dvh]" : fillContainer ? "h-full" : "";

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fullscreen && "fixed inset-0 z-[300]",
        !fullscreen && !fillContainer && "rounded-2xl border border-border/80",
        shellHeightClass,
      )}
    >
      {/* Fullscreen close */}
      {fullscreen && (
        <button
          type="button"
          onClick={() => setFullscreen(false)}
          className="pointer-events-auto absolute right-3 top-3 z-[320] inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white shadow-lg backdrop-blur-md hover:bg-black/65"
        >
          <X className="size-3.5" aria-hidden />
          Fermer
          <span className="hidden opacity-70 sm:inline">(Echap)</span>
        </button>
      )}

      {/* Map controls */}
      <div className="pointer-events-none absolute left-2 top-16 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white/85 px-2.5 py-1.5 text-[11px] font-medium text-neutral-800 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-zinc-900/80 dark:text-zinc-100"
        >
          {fullscreen ? <Minimize2 className="size-3.5 opacity-80" /> : <Maximize2 className="size-3.5 opacity-80" />}
          {fullscreen ? "Reduire" : "Plein ecran"}
        </button>
        <button
          type="button"
          onClick={() => setView3d((v) => !v)}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white/85 px-2.5 py-1.5 text-[11px] font-medium text-neutral-800 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-zinc-900/80 dark:text-zinc-100"
        >
          <Box className="size-3.5 opacity-80" />
          {view3d ? "Vue 2D" : "Vue 3D"}
        </button>
        <button
          type="button"
          onClick={() => mapRef.current?.easeTo({ bearing: 0, duration: 500 })}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-xl border border-black/10 bg-white/85 px-2.5 py-1.5 text-[11px] font-medium text-neutral-800 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-zinc-900/80 dark:text-zinc-100"
        >
          <Compass className="size-3.5 opacity-80" />
          Nord
        </button>
      </div>

      <div ref={containerRef} className={cn("w-full", mapHeightClass)} />

      {/* Score legend */}
      <div className={cn(
        "pointer-events-none absolute rounded-xl border border-border/40 bg-background/90 px-3 py-2 backdrop-blur-sm",
        fullscreen ? "bottom-8 left-4" : "bottom-8 left-3",
      )}>
        <p className="mb-1 text-[10px] font-semibold text-foreground/70">Deal Score (0–100)</p>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[10px] text-foreground/60">
            <span className="inline-block size-2.5 shrink-0 rounded-full bg-emerald-500" />
            <span>Tier A — ≥ 70</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-foreground/60">
            <span className="inline-block size-2.5 shrink-0 rounded-full bg-sky-500" />
            <span>Tier B — 45–69</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-foreground/60">
            <span className="inline-block size-2.5 shrink-0 rounded-full bg-zinc-400" />
            <span>Tier C — &lt; 45</span>
          </div>
        </div>
      </div>

      <p className={cn(
        "pointer-events-none absolute text-[10px] text-white/60",
        fullscreen ? "bottom-4 left-4" : "bottom-2 left-3",
      )}>
        {plotPoints.length} markers {view3d ? "· 3D Standard" : `· ${mapTheme} flat`}
      </p>
    </div>
  );
}
