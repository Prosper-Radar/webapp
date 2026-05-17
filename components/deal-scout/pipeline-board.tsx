"use client";

import * as React from "react";
import {
  Activity,
  Building2,
  Check,
  ChevronRight,
  Clock,
  ExternalLink,
  GripVertical,
  KanbanSquare,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  RefreshCw,
  Send,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PipelineItem } from "@/lib/types/dashboard";
import type { PipelineStatus } from "@/drizzle/schema";
import { PIPELINE_STAGES } from "@/lib/types/dashboard";

// ─── Color helpers ────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 65) return "#38bdf8";
  if (score >= 50) return "#f59e0b";
  return "#6b7280";
}

function tierFromScore(score: number): string {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  return "C";
}

function tierBg(tier: string) {
  if (tier === "A") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  if (tier === "B") return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
  return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
}

function stageHeaderColor(color: string) {
  const map: Record<string, string> = {
    blue:   "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    yellow: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
    orange: "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    purple: "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300",
    green:  "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    red:    "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  };
  return map[color] ?? map.blue;
}

function stagePillColor(color: string) {
  const map: Record<string, string> = {
    blue:   "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20",
    yellow: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/20",
    orange: "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20",
    purple: "border-purple-500/50 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20",
    green:  "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20",
    red:    "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20",
  };
  return map[color] ?? map.blue;
}

function stageDropColor(color: string) {
  const map: Record<string, string> = {
    blue:   "border-blue-500/60 bg-blue-500/5 ring-1 ring-blue-500/30",
    yellow: "border-yellow-500/60 bg-yellow-500/5 ring-1 ring-yellow-500/30",
    orange: "border-orange-500/60 bg-orange-500/5 ring-1 ring-orange-500/30",
    purple: "border-purple-500/60 bg-purple-500/5 ring-1 ring-purple-500/30",
    green:  "border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/30",
    red:    "border-red-500/60 bg-red-500/5 ring-1 ring-red-500/30",
  };
  return map[color] ?? map.blue;
}

// ─── Mini score ring ──────────────────────────────────────────────────────────

function MiniRing({ value }: Readonly<{ value: number }>) {
  const r = 11;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value)) / 100;
  const color = scoreColor(value);
  return (
    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
      <svg width={32} height={32} className="-rotate-90">
        <circle cx={16} cy={16} r={r} fill="none" stroke="currentColor" strokeWidth={2.5} className="text-border/40" />
        <circle cx={16} cy={16} r={r} fill="none" stroke={color} strokeWidth={2.5}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[9px] font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Score ring (large, for detail panel) ─────────────────────────────────────

function ScoreRing({ value }: Readonly<{ value: number }>) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value)) / 100;
  const color = scoreColor(value);
  const tier = tierFromScore(value);
  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
      <svg width={80} height={80} className="-rotate-90">
        <circle cx={40} cy={40} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-border/30" />
        <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold tabular-nums leading-none" style={{ color }}>{value}</span>
        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wide">Tier {tier}</span>
      </div>
    </div>
  );
}

// ─── Activity entry types ─────────────────────────────────────────────────────

type ActivityEntry = {
  id: string;
  action: string;
  note: string | null;
  createdAt: string;
};

// ─── Deal detail side panel ───────────────────────────────────────────────────

function DealDetailPanel({
  item,
  onClose,
  onMove,
  onDelete,
  onItemUpdate,
}: Readonly<{
  item: PipelineItem;
  onClose: () => void;
  onMove: (id: string, status: PipelineStatus) => void;
  onDelete: (id: string) => void;
  onItemUpdate: (updated: PipelineItem) => void;
}>) {
  const [activity, setActivity] = React.useState<ActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = React.useState(false);
  const [noteText, setNoteText] = React.useState(item.notes ?? "");
  const [noteSaving, setNoteSaving] = React.useState(false);
  const [statusChanging, setStatusChanging] = React.useState(false);

  const currentStage = PIPELINE_STAGES.find((s) => s.status === item.status);

  React.useEffect(() => {
    setActivityLoading(true);
    fetch(`/api/pipeline/${item.id}`)
      .then((r) => r.json())
      .then((d: { activity?: ActivityEntry[] }) => setActivity(d.activity ?? []))
      .catch(() => { /* silently fail */ })
      .finally(() => setActivityLoading(false));
  }, [item.id]);

  // Trap focus / keyboard close
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSaveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteSaving(true);
    try {
      await fetch(`/api/pipeline/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText.trim() }),
      });
      onItemUpdate({ ...item, notes: noteText.trim() });
      const d = await fetch(`/api/pipeline/${item.id}`).then((r) => r.json()) as { activity?: ActivityEntry[] };
      setActivity(d.activity ?? []);
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleStatusChange(status: PipelineStatus) {
    if (statusChanging || status === item.status) return;
    setStatusChanging(true);
    try {
      await onMove(item.id, status);
      onItemUpdate({ ...item, status });
    } finally {
      setStatusChanging(false);
    }
  }

  const breakdown = Object.entries(item.breakdown ?? {});

  const fmt = (v: number | null | undefined, unit?: string) => {
    if (v == null) return "—";
    return `${v.toLocaleString("en-US")}${unit ?? ""}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-40 flex h-full w-full max-w-[440px] flex-col border-l border-border/60 bg-background/95 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="flex-none border-b border-border/40 bg-background/80 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/50 mb-0.5">
                Deal Detail
              </p>
              <h2 className="text-[14px] font-semibold text-foreground leading-tight">{item.address}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
                  <MapPin className="size-2.5" />{item.county}
                </span>
                {item.folio ? (
                  <span className="rounded-md border border-border/40 bg-muted/30 px-1.5 py-px text-[9px] font-mono text-muted-foreground/50">
                    {item.folio}
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border/50 p-1.5 text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 px-5 py-5">

            {/* ── Score + Tier ── */}
            <section className="flex items-center gap-5 rounded-2xl border border-border/40 bg-muted/20 px-5 py-4">
              <ScoreRing value={item.totalScore} />
              <div className="flex-1 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">Deal Score</p>
                <div className="space-y-1">
                  {breakdown.slice(0, 4).map(([key, val]) => {
                    const pct = Math.min(100, Math.max(0, Number(val)));
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="w-[90px] truncate text-[9px] text-muted-foreground/60 capitalize">{key.replaceAll("_", " ")}</span>
                        <div className="flex-1 h-1 rounded-full bg-border/30">
                          <div className="h-1 rounded-full bg-primary/60" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[9px] tabular-nums text-muted-foreground/50">{Math.round(pct)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── Pipeline status ── */}
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
                <Activity className="size-3" />
                Pipeline Stage
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PIPELINE_STAGES.map((stage) => (
                  <button
                    key={stage.status}
                    type="button"
                    disabled={statusChanging}
                    onClick={() => void handleStatusChange(stage.status)}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold transition-all duration-150",
                      item.status === stage.status
                        ? cn(stagePillColor(stage.color), "ring-2 ring-offset-1 ring-offset-background ring-current/30")
                        : cn(stagePillColor(stage.color), "opacity-40 hover:opacity-80"),
                    )}
                  >
                    {item.status === stage.status && (
                      <Check className="size-2.5" />
                    )}
                    {stage.label}
                  </button>
                ))}
              </div>
            </section>

            {/* ── Parcel facts ── */}
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
                <Building2 className="size-3" />
                Parcel Info
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  ["Acreage", item.acreage != null ? `${item.acreage.toFixed(2)} ac` : null],
                  ["Zoning", item.zoning],
                  ["Folio", item.folio],
                  ["County", item.county],
                  ["Added", new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })],
                  ["Updated", new Date(item.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })],
                ].filter(([, v]) => v != null).map(([k, v]) => (
                  <div key={String(k)} className="space-y-0.5">
                    <dt className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/40">{k}</dt>
                    <dd className="text-[11px] font-medium text-foreground/80">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* ── Score pillars (full list) ── */}
            {breakdown.length > 0 && (
              <section>
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
                  <TrendingUp className="size-3" />
                  Score Breakdown
                </p>
                <div className="space-y-1.5">
                  {breakdown.map(([key, val]) => {
                    const pct = Math.min(100, Math.max(0, Number(val)));
                    const c = scoreColor(pct);
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="w-[120px] shrink-0 truncate text-[10px] text-foreground/70 capitalize">{key.replaceAll("_", " ")}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-border/30">
                          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: c }} />
                        </div>
                        <span className="text-[10px] tabular-nums font-semibold" style={{ color: c }}>{Math.round(pct)}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Notes ── */}
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
                <MessageSquare className="size-3" />
                Notes
              </p>
              <form onSubmit={handleSaveNote} className="space-y-2">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add context, next steps, or anything relevant about this deal…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-[11px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex items-center justify-between">
                  {item.notes ? (
                    <p className="text-[9px] text-muted-foreground/40 italic">Saved note: "{item.notes.substring(0, 50)}{item.notes.length > 50 ? "…" : ""}"</p>
                  ) : (
                    <span />
                  )}
                  <button
                    type="submit"
                    disabled={!noteText.trim() || noteSaving}
                    className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[10px] font-semibold text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors"
                  >
                    {noteSaving ? <RefreshCw className="size-3 animate-spin" /> : <Send className="size-3" />}
                    Save note
                  </button>
                </div>
              </form>
            </section>

            {/* ── Activity log ── */}
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
                <Clock className="size-3" />
                Activity
              </p>
              {activityLoading ? (
                <p className="text-[10px] text-muted-foreground/40">Loading…</p>
              ) : activity.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/30 italic">No activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {activity.slice(-8).reverse().map((a) => (
                    <div key={a.id} className="flex gap-2.5 rounded-xl border border-border/30 bg-muted/10 px-3 py-2">
                      <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-medium text-foreground/70">{a.action}</p>
                        {a.note ? (
                          <p className="mt-0.5 text-[9px] italic text-muted-foreground/60">{a.note}</p>
                        ) : null}
                        <p className="mt-0.5 text-[8px] text-muted-foreground/30">
                          {new Date(a.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex-none border-t border-border/40 bg-background/80 px-5 py-3">
          <div className="flex items-center gap-2">
            <a
              href={`/?deal=${item.parcelId}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-muted/30 py-2 text-[11px] font-medium text-foreground/70 hover:bg-muted/50 transition-colors"
            >
              <ExternalLink className="size-3.5" />
              View on map
            </a>
            <button
              type="button"
              onClick={() => { onDelete(item.id); onClose(); }}
              className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="size-3.5" />
              Remove
            </button>
          </div>
          {currentStage && (
            <p className="mt-2 text-center text-[9px] text-muted-foreground/30">
              Current stage: {currentStage.label} · Press Esc to close
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({
  item,
  isDragging,
  onDragStart,
  onDragEnd,
  onOpen,
  onMove,
  onDelete,
}: Readonly<{
  item: PipelineItem;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onOpen: () => void;
  onMove: (id: string, status: PipelineStatus) => void;
  onDelete: (id: string) => void;
}>) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [didDrag, setDidDrag] = React.useState(false);
  const tier = tierFromScore(item.totalScore);

  const menuRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const currentStage = PIPELINE_STAGES.find((s) => s.status === item.status);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
        setDidDrag(true);
        onDragStart();
      }}
      onDragEnd={() => {
        onDragEnd();
        // Reset after a tick so the click handler can see the flag
        setTimeout(() => setDidDrag(false), 100);
      }}
      onClick={() => {
        if (didDrag || menuOpen) return;
        onOpen();
      }}
      className={cn(
        "group cursor-pointer rounded-xl border border-border/60 bg-card/60 p-3 shadow-sm backdrop-blur-sm transition-all duration-150 active:cursor-grabbing select-none",
        "hover:border-border hover:shadow-md hover:bg-card/80",
        isDragging && "opacity-40 scale-95 shadow-none",
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100 cursor-grab active:cursor-grabbing" />

        <MiniRing value={item.totalScore} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-foreground leading-tight">{item.address}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={cn("inline-flex shrink-0 items-center rounded-full border px-1.5 py-px text-[8px] font-bold uppercase tracking-wide", tierBg(tier))}>
              {tier}
            </span>
            <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
              <MapPin className="size-2 opacity-60" />{item.county}
            </span>
          </div>
          {item.zoning ? (
            <p className="mt-0.5 text-[9px] text-muted-foreground/50">Zoning: {item.zoning}</p>
          ) : null}
          {/* Stage indicator */}
          {currentStage && (
            <div className="mt-1.5 flex items-center gap-1">
              <div className={cn("h-1.5 w-1.5 rounded-full", {
                "bg-blue-400": currentStage.color === "blue",
                "bg-yellow-400": currentStage.color === "yellow",
                "bg-orange-400": currentStage.color === "orange",
                "bg-purple-400": currentStage.color === "purple",
                "bg-emerald-400": currentStage.color === "green",
                "bg-red-400": currentStage.color === "red",
              })} />
              <span className="text-[8px] text-muted-foreground/50">{currentStage.label}</span>
              {item.notes ? (
                <MessageSquare className="ml-auto size-2.5 text-muted-foreground/30" />
              ) : null}
            </div>
          )}
        </div>

        {/* Open detail hint + context menu */}
        <div className="flex shrink-0 items-start gap-0.5">
          <ChevronRight className="mt-0.5 size-3 text-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100" />
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="rounded p-0.5 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground hover:bg-muted/40"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-5 z-50 min-w-[160px] rounded-xl border border-border/80 bg-card shadow-xl backdrop-blur-xl py-1">
                <p className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/50">Move to</p>
                {PIPELINE_STAGES.filter((s) => s.status !== item.status).map((stage) => (
                  <button
                    key={stage.status}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onMove(item.id, stage.status); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-[10px] text-foreground/80 hover:bg-muted/40"
                  >
                    {stage.label}
                  </button>
                ))}
                <div className="my-1 border-t border-border/40" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[10px] text-red-600 dark:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="size-3" />
                  Remove
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Drop placeholder ─────────────────────────────────────────────────────────

function DropPlaceholder() {
  return (
    <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 h-14 transition-all" />
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  items,
  isDragOver,
  draggingId,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpen,
  onMove,
  onDelete,
  onCardDragStart,
  onCardDragEnd,
}: Readonly<{
  stage: typeof PIPELINE_STAGES[number];
  items: PipelineItem[];
  isDragOver: boolean;
  draggingId: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onOpen: (item: PipelineItem) => void;
  onMove: (id: string, status: PipelineStatus) => void;
  onDelete: (id: string) => void;
  onCardDragStart: (id: string) => void;
  onCardDragEnd: () => void;
}>) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex h-full min-w-[220px] flex-1 flex-col overflow-hidden rounded-2xl border transition-all duration-150",
        isDragOver
          ? stageDropColor(stage.color)
          : "border-border/50 bg-muted/20",
      )}
    >
      {/* Column header */}
      <div className={cn("flex items-center gap-2 border-b border-border/40 px-3 py-2.5", stageHeaderColor(stage.color))}>
        <span className="flex-1 text-[10px] font-bold uppercase tracking-[0.15em]">{stage.label}</span>
        {items.length > 0 ? (
          <span className="rounded-full bg-current/20 px-2 py-px text-[9px] font-bold tabular-nums opacity-70">
            {items.length}
          </span>
        ) : null}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {items.length === 0 && !isDragOver ? (
          <div className="flex h-16 items-center justify-center">
            <p className="text-[10px] text-muted-foreground/30">Drop here</p>
          </div>
        ) : null}

        {items.map((item) => (
          <DealCard
            key={item.id}
            item={item}
            isDragging={draggingId === item.id}
            onDragStart={() => onCardDragStart(item.id)}
            onDragEnd={onCardDragEnd}
            onOpen={() => onOpen(item)}
            onMove={onMove}
            onDelete={onDelete}
          />
        ))}

        {isDragOver && draggingId ? <DropPlaceholder /> : null}
      </div>
    </div>
  );
}

// ─── Pipeline board ───────────────────────────────────────────────────────────

export function PipelineBoard() {
  const [items, setItems] = React.useState<PipelineItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<PipelineItem | null>(null);

  // DnD state
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<PipelineStatus | null>(null);

  React.useEffect(() => {
    setLoading(true);
    fetch("/api/pipeline")
      .then((r) => r.json())
      .then((data: { items?: PipelineItem[] }) => setItems(data.items ?? []))
      .catch(() => setError("Failed to load pipeline"))
      .finally(() => setLoading(false));
  }, []);

  async function handleMove(id: string, status: PipelineStatus) {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, status } : item));
    if (selectedItem?.id === id) setSelectedItem((prev) => prev ? { ...prev, status } : null);
    await fetch(`/api/pipeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
    await fetch(`/api/pipeline/${id}`, { method: "DELETE" });
  }

  function handleDragOver(e: React.DragEvent, status: PipelineStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  }

  function handleDrop(e: React.DragEvent, status: PipelineStatus) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const dragged = items.find((i) => i.id === id);
    setDragOverColumn(null);
    setDraggingId(null);
    if (id && dragged && dragged.status !== status) {
      void handleMove(id, status);
    }
  }

  function handleItemUpdate(updated: PipelineItem) {
    setItems((prev) => prev.map((item) => item.id === updated.id ? updated : item));
    setSelectedItem(updated);
  }

  const itemsByStatus = React.useMemo(() => {
    const map = new Map<PipelineStatus, PipelineItem[]>();
    for (const stage of PIPELINE_STAGES) map.set(stage.status, []);
    for (const item of items) {
      const arr = map.get(item.status) ?? [];
      arr.push(item);
      map.set(item.status, arr);
    }
    return map;
  }, [items]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Top bar ── */}
      <div className="flex-none border-b border-border/60 bg-background/80 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
            <KanbanSquare className="size-4 text-primary" />
            Deal Pipeline
          </div>
          <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
            {items.length} deals
          </span>
          <div className="flex-1" />
          {draggingId ? (
            <p className="text-[10px] text-primary/70 animate-pulse">
              Drop into a column to move the deal
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground/40 hidden sm:block">
              Click a card to see details · Drag to move between stages
            </p>
          )}
        </div>
      </div>

      {/* ── Kanban board ── */}
      <div
        className="flex-1 overflow-x-auto overflow-y-hidden p-4"
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverColumn(null);
          }
        }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <TrendingUp className="mx-auto mb-2 size-8 animate-pulse text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Loading pipeline…</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Building2 className="size-12 text-muted-foreground/20" />
            <p className="text-sm font-medium text-muted-foreground">No deals in your pipeline yet</p>
            <p className="max-w-xs text-[11px] text-muted-foreground/60">
              Go back to the map, select a deal, and click a pipeline stage to add it here.
            </p>
            <a
              href="/"
              className="mt-2 flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-xs font-medium text-foreground/80 hover:bg-card transition-colors"
            >
              Browse deals
            </a>
          </div>
        ) : (
          <div className="flex h-full gap-3">
            {PIPELINE_STAGES.map((stage) => (
              <KanbanColumn
                key={stage.status}
                stage={stage}
                items={itemsByStatus.get(stage.status) ?? []}
                isDragOver={dragOverColumn === stage.status}
                draggingId={draggingId}
                onDragOver={(e) => handleDragOver(e, stage.status)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, stage.status)}
                onOpen={setSelectedItem}
                onMove={handleMove}
                onDelete={handleDelete}
                onCardDragStart={setDraggingId}
                onCardDragEnd={() => { setDraggingId(null); setDragOverColumn(null); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Deal detail panel (slide-over) ── */}
      {selectedItem ? (
        <DealDetailPanel
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onMove={handleMove}
          onDelete={handleDelete}
          onItemUpdate={handleItemUpdate}
        />
      ) : null}
    </div>
  );
}
