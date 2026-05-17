"use client";

import * as React from "react";
import { ChevronDown, MapPin, Sparkles } from "lucide-react";

import { ParcelMap } from "@/components/deal-scout/parcel-map";
import { cn } from "@/lib/utils";
import type { DashboardRow } from "@/lib/types/dashboard";

function scoreBadgeClass(total: number): string {
  if (total >= 80) {
    return "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  }
  if (total >= 65) {
    return "border-blue-500/35 bg-blue-500/10 text-blue-900 dark:border-primary/35 dark:bg-primary/10 dark:text-primary-foreground";
  }
  return "border-border bg-background/50 text-foreground";
}

function ScoreMeter({
  label,
  value,
}: Readonly<{
  label: string;
  value: number;
}>) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums text-foreground/80">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
        <div
          className="h-full rounded-full bg-linear-to-r from-primary/80 to-primary"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function ParcelBoard({
  rows,
  source,
}: Readonly<{
  rows: DashboardRow[];
  source: "api" | "drizzle";
}>) {
  const [expandedId, setExpandedId] = React.useState<string | null>(rows[0]?.id ?? null);

  const mapPoints = React.useMemo(
    () =>
      rows.map((r) => ({
        id: r.id,
        lat: r.lat,
        lng: r.lng,
        title: r.title,
        totalScore: r.totalScore,
        tier: r.tier,
      })),
    [rows],
  );

  const onMarkerSelect = React.useCallback((id: string) => {
    setExpandedId(id);
  }, []);

  const toggleRow = React.useCallback((id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
  }, []);

  const region = rows[0]?.subtitlePrimary ?? "Florida";
  const modelChip =
    source === "api" ? "Python API" : rows[0]?.modelLabel ?? "Drizzle seed";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-card/40 px-2 py-0.5">
            <Sparkles className="size-3 text-primary" aria-hidden />
            DealScout
          </span>
          <span className="text-border">/</span>
          <span className="capitalize">{region}</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Parcel intelligence
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Ranked opportunities with transparent scoring — tuned for Prosper Group underwriting.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-md border border-border/70 bg-card/30 px-2 py-1 tabular-nums">
              {rows.length} parcels
            </span>
            <span className="rounded-md border border-border/70 bg-card/30 px-2 py-1">{modelChip}</span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:items-start">
        <ParcelMap points={mapPoints} focusedId={expandedId} onMarkerSelect={onMarkerSelect} />

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/20 shadow-sm backdrop-blur-md dark:shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border/60 px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid-cols-[48px_minmax(0,1fr)_120px_100px_40px] sm:px-5">
          <span className="hidden sm:inline">#</span>
          <span>Parcel</span>
          <span className="hidden sm:inline text-right">Score</span>
          <span className="hidden sm:inline text-center">Watch</span>
          <span className="sr-only sm:not-sr-only sm:text-right"> </span>
        </div>

        <ul className="divide-y divide-border/50">
          {rows.map((row) => {
            const open = expandedId === row.id;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => toggleRow(row.id)}
                  className={cn(
                    "group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors sm:grid sm:grid-cols-[48px_minmax(0,1fr)_120px_100px_40px] sm:items-center sm:gap-0 sm:px-5",
                    open ? "bg-muted/25" : "hover:bg-muted/15",
                  )}
                >
                  <span className="hidden pt-0.5 text-xs tabular-nums text-muted-foreground sm:block">
                    {String(row.rank).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{row.title}</span>
                      {row.tier ? (
                        <span className="inline-flex items-center rounded-full border border-border/80 bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Tier {row.tier}
                        </span>
                      ) : null}
                      {row.onWatchlist ? (
                        <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                          Watchlist
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3 opacity-70" aria-hidden />
                        {row.subtitlePrimary}
                      </span>
                      {row.subtitleSecondary ? (
                        <>
                          <span className="text-border">·</span>
                          <span className="font-mono text-[11px] text-muted-foreground/90">
                            {row.subtitleSecondary}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 sm:block sm:text-right">
                    <span
                      className={cn(
                        "inline-flex min-w-12 justify-center rounded-md border px-2 py-0.5 text-sm font-semibold tabular-nums sm:ml-auto",
                        scoreBadgeClass(row.totalScore),
                      )}
                    >
                      {row.totalScore}
                    </span>
                    <span className="text-[10px] text-muted-foreground sm:hidden">score</span>
                  </div>
                  <div className="hidden text-center text-xs text-muted-foreground sm:block">
                    {row.onWatchlist ? "●" : "—"}
                  </div>
                  <div className="flex items-center justify-end pt-1 sm:pt-0">
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground transition-transform duration-200",
                        open ? "rotate-180" : "rotate-0",
                      )}
                      aria-hidden
                    />
                  </div>
                </button>

                {open ? (
                  <div className="border-t border-border/50 bg-background/40 px-4 py-4 sm:px-5">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                      <div className="space-y-4">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Score breakdown
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {row.pillars.map((p) => (
                            <ScoreMeter key={p.label} label={p.label} value={p.value} />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3 rounded-lg border border-border/60 bg-card/30 p-4 text-sm">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Parcel facts
                        </p>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                          {row.facts.map((f) => (
                            <div key={f.label} className={f.label === "Watchlist note" ? "col-span-2" : ""}>
                              <dt className="text-muted-foreground">{f.label}</dt>
                              <dd
                                className={cn(
                                  "font-medium",
                                  f.label === "Coordinates" || f.label === "Model" || f.label === "Parcel ID"
                                    ? "font-mono text-[11px] text-muted-foreground/90"
                                    : "",
                                )}
                              >
                                {f.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        {source === "api"
          ? "Data from DealScout Python API — Drizzle seed used only as fallback."
          : "Data from Supabase via Drizzle — set DEALSCOUT_API_URL or NEXT_PUBLIC_API_URL to use the Python API."}
      </p>
    </div>
  );
}

export function ParcelBoardEmpty() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full border border-border/80 bg-card/40 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        DealScout
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">No deals to show</h1>
      <p className="text-sm text-muted-foreground">
        Start the FastAPI server and set <span className="font-mono text-xs">DEALSCOUT_API_URL</span>, or seed the
        Drizzle demo tables.
      </p>
      <div className="flex flex-col gap-2 pt-2 font-mono text-[11px] text-muted-foreground">
        <span className="rounded-md border border-border/80 bg-card/40 px-2.5 py-1.5">uvicorn (api) + DATABASE_URL</span>
        <span className="rounded-md border border-border/80 bg-card/40 px-2.5 py-1.5">npm run db:migrate && npm run db:seed</span>
      </div>
    </div>
  );
}
