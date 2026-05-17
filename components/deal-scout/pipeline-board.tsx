"use client";

import * as React from "react";
import {
  Building2,
  GripVertical,
  KanbanSquare,
  MapPin,
  MoreHorizontal,
  Trash2,
  TrendingUp,
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

// ─── Deal card ────────────────────────────────────────────────────────────────

function DealCard({
  item,
  isDragging,
  onDragStart,
  onDragEnd,
  onMove,
  onDelete,
}: Readonly<{
  item: PipelineItem;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (id: string, status: PipelineStatus) => void;
  onDelete: (id: string) => void;
}>) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const tier = tierFromScore(item.totalScore);

  // Close menu on outside click
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

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab rounded-xl border border-border/60 bg-card/60 p-3 shadow-sm backdrop-blur-sm transition-all duration-150 active:cursor-grabbing",
        "hover:border-border hover:shadow-md",
        isDragging && "opacity-40 scale-95 shadow-none",
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100" />

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
        </div>

        {/* Context menu */}
        <div ref={menuRef} className="relative shrink-0">
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
                  onClick={() => { onMove(item.id, stage.status); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[10px] text-foreground/80 hover:bg-muted/40"
                >
                  {stage.label}
                </button>
              ))}
              <div className="my-1 border-t border-border/40" />
              <button
                type="button"
                onClick={() => { onDelete(item.id); setMenuOpen(false); }}
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
            onMove={onMove}
            onDelete={onDelete}
          />
        ))}

        {/* Drop target placeholder */}
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
    // Optimistic update
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, status } : item));
    await fetch(`/api/pipeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
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
              Drag cards between columns · Click ⋯ for more options
            </p>
          )}
        </div>
      </div>

      {/* ── Kanban board ── */}
      <div
        className="flex-1 overflow-x-auto overflow-y-hidden p-4"
        onDragLeave={(e) => {
          // Only clear if leaving the board entirely (not entering a child)
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
                onMove={handleMove}
                onDelete={handleDelete}
                onCardDragStart={setDraggingId}
                onCardDragEnd={() => { setDraggingId(null); setDragOverColumn(null); }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
