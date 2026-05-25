"use client";

import * as React from "react";
import {
  Building2,
  ChevronRight,
  MapPin,
  Search,
  X,
  TrendingUp,
  Layers,
  AlertCircle,
  KanbanSquare,
  Plus,
  DollarSign,
  Ruler,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  FileText,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  ArrowRight,
  Phone,
  Globe,
  BadgeCheck,
  Loader2,
} from "lucide-react";
import type { ContactResult } from "@/app/api/contact/route";
import { ParcelMap } from "@/components/deal-scout/parcel-map";
import { cn } from "@/lib/utils";
import type { DashboardRow } from "@/lib/types/dashboard";
import type { PipelineStatus } from "@/drizzle/schema";
import { PIPELINE_STAGES } from "@/lib/types/dashboard";

// ─── Color helpers ────────────────────────────────────────────────────────────

function tierColor(tier: string | null) {
  if (tier === "A") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  if (tier === "B") return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
  return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
}

function scoreColor(score: number) {
  if (score >= 70) return "#10b981";
  if (score >= 45) return "#38bdf8";
  return "#6b7280";
}

function pipelineStatusColor(status: PipelineStatus) {
  const stage = PIPELINE_STAGES.find((s) => s.status === status);
  const colors: Record<string, string> = {
    blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    yellow: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
    orange: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    purple: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    red: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  };
  return colors[stage?.color ?? "blue"];
}

function fmt$(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `$${n.toLocaleString()}`;
}

function fmtSqft(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${Math.round(n).toLocaleString()} sq ft`;
}

function fmtDate(s: string | null | undefined) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return s;
  }
}

// ─── Score ring SVG ───────────────────────────────────────────────────────────

function ScoreRing({ value, size = 56 }: Readonly<{ value: number; size?: number }>) {
  const r = size === 56 ? 18 : 14;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value)) / 100;
  const color = scoreColor(value);
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={3} className="text-border/40" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={3}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute font-bold tabular-nums" style={{ color, fontSize: size > 40 ? 13 : 10 }}>
        {value}
      </span>
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums font-medium text-foreground/70">{value}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-border/50">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: scoreColor(value) }}
        />
      </div>
    </div>
  );
}

// ─── Pipeline status badge ─────────────────────────────────────────────────────

function PipelineBadge({ status }: Readonly<{ status: PipelineStatus }>) {
  const stage = PIPELINE_STAGES.find((s) => s.status === status);
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
      pipelineStatusColor(status),
    )}>
      <CheckCircle2 className="size-2.5" />
      {stage?.label ?? status}
    </span>
  );
}

// ─── Deal Detail Panel ────────────────────────────────────────────────────────
// Expanded view shown when a card is selected

// ─── Contact / Skip Trace section ─────────────────────────────────────────────

const LINK_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  sunbiz:          { label: "Sunbiz FL",         icon: <BadgeCheck className="size-3" />,  color: "text-blue-600 dark:text-blue-400" },
  opencorporates:  { label: "OpenCorporates",    icon: <Globe className="size-3" />,        color: "text-orange-600 dark:text-orange-400" },
  linkedin:        { label: "LinkedIn People",   icon: <Globe className="size-3" />,        color: "text-sky-600 dark:text-sky-400" },
  linkedin_company:{ label: "LinkedIn Company",  icon: <Globe className="size-3" />,        color: "text-sky-600 dark:text-sky-400" },
  google_email:    { label: "Google (email)",    icon: <Globe className="size-3" />,        color: "text-foreground/70" },
  google_contact:  { label: "Google",            icon: <Globe className="size-3" />,        color: "text-foreground/70" },
  whitepages:      { label: "Whitepages",        icon: <Phone className="size-3" />,        color: "text-muted-foreground" },
  bizapedia:       { label: "Bizapedia FL",      icon: <FileText className="size-3" />,     color: "text-muted-foreground" },
};

function ContactSection({ dealId, ownerName }: Readonly<{ dealId: string; ownerName?: string | null }>) {
  const [contact, setContact] = React.useState<ContactResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [ran, setRan] = React.useState(false);

  async function runSkipTrace(refresh = false) {
    setLoading(true);
    setRan(true);
    try {
      const params = new URLSearchParams({ dealId });
      if (ownerName) params.set("ownerName", ownerName);
      if (refresh) params.set("refresh", "true");
      const res = await fetch(`/api/contact?${params.toString()}`);
      const data = await res.json() as ContactResult;
      setContact(data);
    } catch {
      setContact({ found: false, reason: "Network error", links: {} });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
          <Phone className="size-3" />
          Owner Contact
        </p>
        {ran && !loading ? (
          <button
            type="button"
            onClick={() => runSkipTrace(true)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <RefreshCw className="size-2.5" /> Refresh
          </button>
        ) : null}
      </div>

      {!ran ? (
        /* Pre-run state */
        <div className="rounded-xl border border-dashed border-border/60 p-3 text-center">
          {ownerName ? (
            <p className="mb-2 truncate text-xs font-medium text-foreground/70">{ownerName}</p>
          ) : null}
          <p className="mb-3 text-xs text-muted-foreground/50">
            Search public records & Sunbiz for owner info
          </p>
          <button
            type="button"
            onClick={() => runSkipTrace()}
            className="mx-auto flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Globe className="size-3" />
            Run Skip Trace
          </button>
        </div>
      ) : loading ? (
        /* Loading */
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Searching Sunbiz & public records…
        </div>
      ) : contact ? (
        /* Results */
        <div className="space-y-2.5">
          {/* Entity summary */}
          {contact.found ? (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 space-y-1.5">
              {contact.entity_type ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground/60">Type</span>
                  <span className="font-medium text-foreground/80">{contact.entity_type}</span>
                </div>
              ) : null}
              {contact.entity_status ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground/60">Status</span>
                  <span className={cn("font-semibold",
                    contact.entity_status === "ACTIVE" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                  )}>
                    {contact.entity_status}
                  </span>
                </div>
              ) : null}
              {contact.filing_date ? (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground/60">Filed</span>
                  <span className="font-medium text-foreground/80">{contact.filing_date}</span>
                </div>
              ) : null}
              {contact.registered_agent ? (
                <div className="text-xs">
                  <span className="text-muted-foreground/60">Registered agent: </span>
                  <span className="font-medium text-foreground/80">{contact.registered_agent}</span>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="rounded-lg bg-muted/30 px-2.5 py-2 text-xs text-muted-foreground/60">
              {contact.reason ?? "No entity data found in public records."}
            </p>
          )}

          {/* Officers */}
          {contact.officers && contact.officers.length > 0 ? (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/50">Officers / Contacts</p>
              <div className="space-y-1.5">
                {contact.officers.map((o) => (
                  <div key={`${o.name}-${o.title}`} className="flex items-start gap-2 rounded-lg border border-border/40 bg-card/40 px-2.5 py-2">
                    <User className="mt-0.5 size-3 shrink-0 text-muted-foreground/40" />
                    <div className="min-w-0 text-xs">
                      <p className="font-medium text-foreground/80 truncate">{o.name}</p>
                      {o.title ? <p className="text-muted-foreground/60">{o.title}</p> : null}
                      {o.address ? <p className="text-muted-foreground/50 text-[11px] truncate">{o.address}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Contact tip */}
          {contact.contact_tip ? (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-300">
              💡 {contact.contact_tip}
            </p>
          ) : null}

          {/* Search links */}
          {contact.links && Object.keys(contact.links).length > 0 ? (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/50">
                {contact.is_individual ? "Find individual" : "Find company contact"}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(contact.links).map(([key, url]) => {
                  const meta = LINK_META[key];
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/40 px-2 py-1.5 text-xs font-medium hover:bg-card/70 transition-colors",
                        meta?.color ?? "text-foreground/70",
                      )}
                    >
                      {meta?.icon}
                      <span className="truncate">{meta?.label ?? key}</span>
                      <ExternalLink className="ml-auto size-2.5 shrink-0 opacity-40" />
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}

          <p className="text-center text-[11px] text-muted-foreground/30">
            Source: {contact.source ?? "public records"} · {contact.fetched_at ? new Date(contact.fetched_at).toLocaleDateString() : "just now"}
          </p>
        </div>
      ) : null}
    </section>
  );
}

// ─── Pipeline state ────────────────────────────────────────────────────────────

type PipelineState = Record<string, { id: string; status: PipelineStatus; notes: string | null }>;

type ActivityEntry = {
  id: string;
  fromStatus: PipelineStatus | null;
  toStatus: PipelineStatus;
  note: string | null;
  userKey: string;
  createdAt: string;
};

function formatRelativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DealDetailPanel({
  row,
  pipeline,
  onAddToPipeline,
  onUpdateStatus,
  onClose,
}: Readonly<{
  row: DashboardRow;
  pipeline: PipelineState;
  onAddToPipeline: (parcelId: string, status: PipelineStatus) => Promise<void>;
  onUpdateStatus: (pipelineId: string, status: PipelineStatus) => Promise<void>;
  onClose: () => void;
}>) {
  const pipelineEntry = pipeline[row.id];
  const [statusChanging, setStatusChanging] = React.useState(false);
  const [activity, setActivity] = React.useState<ActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = React.useState(false);

  // Load activity when a pipeline entry exists
  React.useEffect(() => {
    if (!pipelineEntry) { setActivity([]); return; }
    setActivityLoading(true);
    fetch(`/api/pipeline/${pipelineEntry.id}`)
      .then((r) => r.json())
      .then((d: { activity?: ActivityEntry[] }) => setActivity(d.activity ?? []))
      .catch(() => null)
      .finally(() => setActivityLoading(false));
  }, [pipelineEntry?.id]);

  async function handleStatusChange(status: PipelineStatus) {
    setStatusChanging(true);
    if (pipelineEntry) {
      await onUpdateStatus(pipelineEntry.id, status);
    } else {
      await onAddToPipeline(row.id, status);
    }
    // Refresh activity log
    if (pipelineEntry) {
      const d = await fetch(`/api/pipeline/${pipelineEntry.id}`).then((r) => r.json()) as { activity?: ActivityEntry[] };
      setActivity(d.activity ?? []);
    }
    setStatusChanging(false);
  }


  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none border-b border-border/60 px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <ScoreRing value={row.totalScore} size={48} />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold leading-tight text-foreground line-clamp-2">
                {row.title}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {row.tier ? (
                  <span className={cn("inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide", tierColor(row.tier))}>
                    Tier {row.tier}
                  </span>
                ) : null}
                {pipelineEntry ? (
                  <PipelineBadge status={pipelineEntry.status} />
                ) : null}
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-2.5 shrink-0" />
                {row.county ?? row.subtitlePrimary}
                {row.parcelId ? <span className="font-mono text-[11px] opacity-60 ml-1">{row.parcelId}</span> : null}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-muted-foreground/50 hover:bg-muted/40 hover:text-foreground transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">

          {/* ── Pipeline CTA ── */}
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
              <KanbanSquare className="size-3" />
              Pipeline Status
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE_STAGES.map((stage) => {
                const isActive = pipelineEntry?.status === stage.status;
                return (
                  <button
                    key={stage.status}
                    type="button"
                    disabled={statusChanging}
                    onClick={() => handleStatusChange(stage.status)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all",
                      isActive
                        ? pipelineStatusColor(stage.status)
                        : "border-border/50 bg-transparent text-muted-foreground hover:bg-muted/30",
                      statusChanging && "opacity-50 cursor-wait",
                    )}
                  >
                    {isActive ? <CheckCircle2 className="mr-1 inline size-2.5" /> : <Plus className="mr-1 inline size-2.5" />}
                    {stage.label}
                  </button>
                );
              })}
            </div>
            {pipelineEntry ? (
              <p className="mt-1.5 text-xs text-muted-foreground/50 flex items-center gap-1">
                <Clock className="size-2.5" />
                In pipeline · click a status to change it
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground/50">
                Click a stage to add this deal to your pipeline
              </p>
            )}
          </section>

          {/* ── Score breakdown ── */}
          {row.pillars.length > 0 ? (
            <section>
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                <TrendingUp className="size-3" />
                Score Breakdown
              </p>
              <div className="space-y-2">
                {row.pillars.map((p) => (
                  <ScoreBar key={p.label} label={p.label} value={p.value} />
                ))}
              </div>
            </section>
          ) : null}

          {/* ── Financial data ── */}
          <section>
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
              <DollarSign className="size-3" />
              Financials
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              <FactItem icon={<DollarSign className="size-2.5" />} label="Land Value" value={fmt$(row.landValue)} />
              <FactItem icon={<DollarSign className="size-2.5" />} label="Building Value" value={fmt$(row.buildingValue)} />
              <FactItem icon={<DollarSign className="size-2.5" />} label="Total Value" value={fmt$(row.totalValue ?? (row.landValue != null ? (row.landValue + (row.buildingValue ?? 0)) : null))} />
              <FactItem icon={<Ruler className="size-2.5" />} label="Lot Size" value={fmtSqft(row.lotSizeSqft)} />
            </dl>
          </section>

          {/* ── Sale history ── */}
          {(row.lastSaleDate || row.lastSalePrice) ? (
            <section>
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                <Calendar className="size-3" />
                Last Transaction
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                <FactItem icon={<Calendar className="size-2.5" />} label="Sale Date" value={fmtDate(row.lastSaleDate)} />
                <FactItem icon={<DollarSign className="size-2.5" />} label="Sale Price" value={fmt$(row.lastSalePrice)} />
              </dl>
            </section>
          ) : null}

          {/* ── Owner info ── */}
          {row.ownerName ? (
            <section>
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                <User className="size-3" />
                Owner Info
              </p>
              <dl className="space-y-2 text-xs">
                <FactItem icon={<User className="size-2.5" />} label="Owner" value={row.ownerName} wide />
                {row.ownerAddress ? (
                  <FactItem icon={<MapPin className="size-2.5" />} label="Mailing Address" value={row.ownerAddress} wide />
                ) : null}
              </dl>
            </section>
          ) : null}

          {/* ── Parcel details ── */}
          <section>
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
              <FileText className="size-3" />
              Parcel Details
            </p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
              <FactItem icon={<FileText className="size-2.5" />} label="Zoning" value={row.zoningCode ?? "—"} />
              <FactItem icon={<MapPin className="size-2.5" />} label="County" value={row.county ?? row.subtitlePrimary} />
              {row.lat != null && row.lng != null ? (
                <FactItem icon={<MapPin className="size-2.5" />} label="Coordinates" value={`${row.lat.toFixed(4)}, ${row.lng.toFixed(4)}`} mono />
              ) : null}
              {row.parcelId ? (
                <FactItem icon={<FileText className="size-2.5" />} label="Parcel ID" value={row.parcelId} mono />
              ) : null}
            </dl>
          </section>


          {/* ── Activity log ── */}
          {pipelineEntry ? (
            <section>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                <Clock className="size-3" />
                Activity
              </p>
              {activityLoading ? (
                <p className="text-xs text-muted-foreground/40">Loading…</p>
              ) : activity.length === 0 ? (
                <p className="text-xs text-muted-foreground/40">No activity yet.</p>
              ) : (
                <ol className="space-y-2">
                  {activity.map((entry) => (
                    <li key={entry.id} className="flex gap-2 text-xs">
                      <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted/50">
                        {entry.fromStatus !== entry.toStatus ? (
                          <ArrowRight className="size-2.5 text-muted-foreground/60" />
                        ) : (
                          <MessageSquare className="size-2.5 text-muted-foreground/60" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {entry.fromStatus !== entry.toStatus ? (
                          <p className="text-foreground/70">
                            {entry.fromStatus ? (
                              <><span className="font-medium">{PIPELINE_STAGES.find(s => s.status === entry.fromStatus)?.label ?? entry.fromStatus}</span>
                              {" → "}
                              <span className="font-medium">{PIPELINE_STAGES.find(s => s.status === entry.toStatus)?.label ?? entry.toStatus}</span></>
                            ) : (
                              <span>Added as <span className="font-medium">{PIPELINE_STAGES.find(s => s.status === entry.toStatus)?.label ?? entry.toStatus}</span></span>
                            )}
                          </p>
                        ) : null}
                        {entry.note ? (
                          <p className="text-foreground/60 italic">&ldquo;{entry.note}&rdquo;</p>
                        ) : null}
                        <p className="text-muted-foreground/40">{formatRelativeTime(entry.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ) : null}

          {/* ── Contact / Skip Trace ── */}
          <ContactSection dealId={row.id} ownerName={row.ownerName} />

          {/* ── Quick actions ── */}
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
              Quick Actions
            </p>
            <div className="flex flex-col gap-2">
              {row.lat != null && row.lng != null ? (
                <a
                  href={`https://maps.google.com/?q=${row.lat},${row.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-[11px] font-medium text-foreground/80 hover:bg-card/70 transition-colors"
                >
                  <MapPin className="size-3.5 text-muted-foreground" />
                  Open in Google Maps
                  <ExternalLink className="ml-auto size-3 text-muted-foreground/40" />
                </a>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FactItem({ icon, label, value, wide, mono }: Readonly<{ icon: React.ReactNode; label: string; value: string; wide?: boolean; mono?: boolean }>) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="flex items-center gap-1 text-muted-foreground/60 mb-0.5">
        {icon}
        {label}
      </dt>
      <dd className={cn("font-medium text-foreground/80", mono && "font-mono text-[11px] text-muted-foreground/80")}>
        {value}
      </dd>
    </div>
  );
}

// ─── Parcel card (list item) ───────────────────────────────────────────────────

function ParcelCard({
  row,
  selected,
  onSelect,
  pipelineEntry,
}: Readonly<{
  row: DashboardRow;
  selected: boolean;
  onSelect: () => void;
  pipelineEntry?: { status: PipelineStatus } | null;
}>) {
  const cardRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (selected && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selected]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "rounded-xl border transition-all duration-150",
        selected
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-border/60 bg-card/30",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-3 px-3.5 py-3 text-left",
          !selected && "hover:bg-card/40 transition-colors rounded-xl",
        )}
      >
        <ScoreRing value={row.totalScore} size={52} />

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-xs font-medium text-foreground leading-tight max-w-[150px]">
              {row.title}
            </span>
            {row.tier ? (
              <span className={cn("inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide", tierColor(row.tier))}>
                {row.tier}
              </span>
            ) : null}
            {pipelineEntry ? (
              <PipelineBadge status={pipelineEntry.status} />
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-2.5 shrink-0 opacity-60" />
            <span className="truncate">{row.subtitlePrimary}</span>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-0 text-xs text-muted-foreground/70">
            {row.ownerName ? (
              <span>
                <span className="opacity-60">Owner: </span>
                <span className="font-medium">{row.ownerName.length > 20 ? row.ownerName.slice(0, 20) + "…" : row.ownerName}</span>
              </span>
            ) : null}
            {row.landValue != null ? (
              <span>
                <span className="opacity-60">Land: </span>
                <span className="font-medium">{fmt$(row.landValue)}</span>
              </span>
            ) : null}
          </div>
        </div>

        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200",
            selected && "rotate-90 text-primary/70",
          )}
        />
      </button>
    </div>
  );
}

// ─── Refresh button (invalidates Next.js cache then reloads) ──────────────────

function RefreshButton() {
  const [loading, setLoading] = React.useState(false);
  const [lastRefresh, setLastRefresh] = React.useState<string | null>(null);

  async function handleRefresh() {
    setLoading(true);
    try {
      await fetch("/api/revalidate", { method: "POST" });
      setLastRefresh(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
      // Reload the page to fetch fresh server-rendered data
      globalThis.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={loading}
      title={lastRefresh ? `Last refresh: ${lastRefresh}` : "Refresh data from API"}
      className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/50 px-2 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm hover:bg-card hover:text-foreground transition-colors disabled:opacity-50"
    >
      <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
      <span className="hidden sm:inline">Refresh</span>
    </button>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function ParcelDashboard({
  rows,
  source,
}: Readonly<{
  rows: DashboardRow[];
  source: "api" | "drizzle";
}>) {
  const [selectedId, setSelectedIdState] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  // Sync selectedId with ?deal= URL param for back/forward navigation
  React.useEffect(() => {
    const sp = new URLSearchParams(globalThis.location.search);
    const id = sp.get("deal");
    if (id) setSelectedIdState(id);
  }, []);

  function setSelectedId(id: string | null) {
    setSelectedIdState(id);
    const url = new URL(globalThis.location.href);
    if (id) {
      url.searchParams.set("deal", id);
    } else {
      url.searchParams.delete("deal");
    }
    globalThis.history.replaceState(null, "", url.pathname + url.search);
  }

  const [tierFilter, setTierFilter] = React.useState<"all" | "A" | "B" | "C">("all");
  const [panelOpen, setPanelOpen] = React.useState(true);
  // detail = showing full detail view instead of list
  const [detailOpen, setDetailOpen] = React.useState(false);
  // pipeline state (parcelId → { id, status })
  const [pipeline, setPipeline] = React.useState<PipelineState>({});
  const [pipelineLoading, setPipelineLoading] = React.useState(false);

  // Load pipeline items on mount
  React.useEffect(() => {
    setPipelineLoading(true);
    fetch("/api/pipeline")
      .then((r) => r.json())
      .then((data: { items?: { id: string; parcelId: string; status: PipelineStatus; notes: string | null }[] }) => {
        if (data.items) {
          const map: PipelineState = {};
          for (const item of data.items) {
            map[item.parcelId] = { id: item.id, status: item.status, notes: item.notes };
          }
          setPipeline(map);
        }
      })
      .catch(() => null)
      .finally(() => setPipelineLoading(false));
  }, []);

  async function handleAddToPipeline(parcelId: string, status: PipelineStatus) {
    const res = await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parcelId, status }),
    });
    const data = await res.json() as { item?: { id: string; status: PipelineStatus; notes: string | null } };
    if (data.item) {
      setPipeline((prev) => ({ ...prev, [parcelId]: { id: data.item!.id, status: data.item!.status, notes: data.item!.notes } }));
    }
  }

  async function handleUpdateStatus(pipelineId: string, status: PipelineStatus) {
    const res = await fetch(`/api/pipeline/${pipelineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json() as { item?: { id: string; parcelId?: string; status: PipelineStatus; notes: string | null } };
    if (data.item) {
      // find by pipelineId and update
      setPipeline((prev) => {
        const next = { ...prev };
        for (const [parcelId, entry] of Object.entries(next)) {
          if (entry.id === pipelineId) {
            next[parcelId] = { ...entry, status };
          }
        }
        return next;
      });
    }
  }

  const filtered = React.useMemo(() => {
    let r = rows;
    if (tierFilter !== "all") r = r.filter((row) => row.tier === tierFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (row) =>
          row.title.toLowerCase().includes(q) ||
          row.subtitlePrimary.toLowerCase().includes(q) ||
          (row.subtitleSecondary ?? "").toLowerCase().includes(q) ||
          (row.ownerName ?? "").toLowerCase().includes(q),
      );
    }
    return r;
  }, [rows, tierFilter, search]);

  const mapPoints = React.useMemo(
    () => rows.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, title: r.title, totalScore: r.totalScore, tier: r.tier })),
    [rows],
  );

  const tierCounts = React.useMemo(() => ({
    A: rows.filter((r) => r.tier === "A").length,
    B: rows.filter((r) => r.tier === "B").length,
    C: rows.filter((r) => r.tier === "C").length,
  }), [rows]);

  const pipelineCount = Object.keys(pipeline).length;

  const selectedRow = React.useMemo(
    () => (selectedId ? rows.find((r) => r.id === selectedId) ?? null : null),
    [selectedId, rows],
  );

  const onMarkerSelect = React.useCallback((id: string) => {
    setSelectedId(id);
    setPanelOpen(true);
    setDetailOpen(true);
  }, []);

  const mapResizeKey = panelOpen ? "panel-open" : "panel-closed";

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">

      {/* ── Map area ── */}
      <div className="relative flex-1 overflow-hidden">

        {/* Floating header */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-3">
          <div className="pointer-events-auto mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-white/20 bg-background/70 px-3 py-2 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-black/60">
            {/* Source badge + count */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className={cn(
                "flex items-center gap-1 rounded-md border px-1.5 py-0.5",
                source === "api"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
              )}>
                {source !== "api" && <AlertCircle className="size-2.5" />}
                {source === "api" ? "Live API" : "Seed data"}
              </span>
              <span className="rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 tabular-nums text-muted-foreground">
                {rows.length} parcels
              </span>
              {!pipelineLoading && pipelineCount > 0 ? (
                <span className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-primary">
                  <KanbanSquare className="size-2.5" />
                  {pipelineCount} in pipeline
                </span>
              ) : null}
            </div>

            <div className="flex-1" />

            {/* Refresh cache */}
            <RefreshButton />

            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/50 px-2 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur-sm hover:bg-card hover:text-foreground transition-colors"
            >
              <Layers className="size-3.5" />
              <span className="hidden sm:inline">{panelOpen ? "Hide deals" : "Show deals"}</span>
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="h-full w-full">
          <ParcelMap
            points={mapPoints}
            focusedId={selectedId}
            onMarkerSelect={onMarkerSelect}
            fillContainer
            resizeKey={mapResizeKey}
          />
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        className={cn(
          "flex h-full flex-col border-l border-border/60 bg-background/90 backdrop-blur-2xl transition-[width] duration-300 ease-in-out",
          panelOpen ? "w-80 xl:w-96" : "w-0 overflow-hidden border-0",
        )}
      >
        <div className={cn("flex h-full flex-col", !panelOpen && "invisible")}>

          {/* ── Detail view (when a deal is selected) ── */}
          {detailOpen && selectedRow ? (
            <DealDetailPanel
              row={selectedRow}
              pipeline={pipeline}
              onAddToPipeline={handleAddToPipeline}
              onUpdateStatus={handleUpdateStatus}
              onClose={() => { setDetailOpen(false); setSelectedId(null); }}
            />
          ) : (
            <>
              {/* Panel header */}
              <div className="flex-none border-b border-border/60 px-4 pb-3 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    <TrendingUp className="size-3" />
                    Ranked Deals
                  </p>
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="rounded-md p-1 text-muted-foreground/50 hover:bg-muted/40 hover:text-foreground transition-colors"
                    aria-label="Close panel"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
                  <input
                    type="text"
                    placeholder="Address, owner, parcel ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-muted/30 py-1.5 pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  ) : null}
                </div>

                {/* Tier filters */}
                <div className="flex gap-1">
                  {(["all", "A", "B", "C"] as const).map((t) => {
                    const isActive = tierFilter === t;
                    const activeClass =
                      t === "A" ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : t === "B" ? "border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300"
                      : t === "C" ? "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300"
                      : "border-primary/30 bg-primary/10 text-primary";
                    const label = t === "all" ? `All (${rows.length})` : `${t} (${tierCounts[t]})`;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTierFilter(t)}
                        className={cn(
                          "flex-1 rounded-md border py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
                          isActive ? activeClass : "border-border/50 bg-transparent text-muted-foreground hover:bg-muted/30",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto scroll-smooth">
                {filtered.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center gap-2 text-center px-6">
                    <Building2 className="size-8 text-muted-foreground/25" />
                    <p className="text-xs text-muted-foreground">
                      {search ? "No parcels match your search." : "No parcels for this tier."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 p-3">
                    {filtered.map((row) => (
                      <ParcelCard
                        key={row.id}
                        row={row}
                        selected={selectedId === row.id}
                        onSelect={() => {
                          const isAlreadySelected = selectedId === row.id;
                          if (isAlreadySelected) {
                            setDetailOpen(true);
                          } else {
                            setSelectedId(row.id);
                            setDetailOpen(true);
                          }
                        }}
                        pipelineEntry={pipeline[row.id] ?? null}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-none border-t border-border/40 px-4 py-2.5">
                {source !== "api" ? (
                  <p className="text-center text-xs text-amber-600/80 dark:text-amber-400/70">
                    Seed data — start the API + score parcels for live data
                  </p>
                ) : (
                  <p className="text-center text-xs text-muted-foreground/50">
                    Live · FastAPI + Supabase PostGIS
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
