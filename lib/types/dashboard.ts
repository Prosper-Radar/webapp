/** Unified row for the dashboard (FastAPI deals or Drizzle demo). */

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
};
