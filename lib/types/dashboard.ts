/** Unified row for the dashboard (FastAPI deals or Drizzle demo). */

import type { PipelineStatus } from "@/drizzle/schema";

export type DashboardScorePillar = {
  label: string;
  value: number;
};

export type DashboardFact = {
  label: string;
  value: string;
};

export type DashboardRow = {
  rank: number;
  id: string;
  title: string;
  subtitlePrimary: string;
  subtitleSecondary: string | null;
  totalScore: number;
  tier: string | null;
  /** WGS84 — map markers when both set */
  lat: number | null;
  lng: number | null;
  onWatchlist: boolean;
  watchlistNote: string | null;
  pillars: DashboardScorePillar[];
  facts: DashboardFact[];
  modelLabel: string;
  source: "api" | "drizzle";
  // Pipeline state (loaded client-side)
  pipelineStatus?: PipelineStatus | null;
  pipelineId?: string | null;
  // Extended financial data
  ownerName?: string | null;
  ownerAddress?: string | null;
  landValue?: number | null;
  buildingValue?: number | null;
  totalValue?: number | null;
  lotSizeSqft?: number | null;
  acreage?: number | null;
  zoningCode?: string | null;
  lastSaleDate?: string | null;
  lastSalePrice?: number | null;
  parcelId?: string | null;
  county?: string | null;
};

export type PipelineItem = {
  id: string;
  parcelId: string;
  status: PipelineStatus;
  notes: string | null;
  assignedTo: string | null;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
  // denormalized from join
  address: string;
  folio: string;
  county: string;
  lat: number | null;
  lng: number | null;
  zoning: string | null;
  acreage: number | null;
  totalScore: number;
  breakdown: Record<string, number>;
  modelVersion: string;
};

export const PIPELINE_STAGES: { status: PipelineStatus; label: string; color: string }[] = [
  { status: "spotted",        label: "Spotted",        color: "blue" },
  { status: "reviewing",      label: "Reviewing",      color: "yellow" },
  { status: "loi_submitted",  label: "LOI Submitted",  color: "orange" },
  { status: "under_contract", label: "Under Contract", color: "purple" },
  { status: "closed",         label: "Closed",         color: "green" },
  { status: "dead",           label: "Dead",           color: "red" },
];
