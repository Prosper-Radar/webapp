import "server-only";

import { fetchDealsFromApi, type ApiDeal } from "@/lib/api/deals";
import { getRankedParcels, type RankedParcelRow } from "@/lib/queries/parcels";
import type { DashboardRow } from "@/lib/types/dashboard";

function roundScore(n: number | null | undefined): number {
  if (n === null || n === undefined || !Number.isFinite(n)) return 0;
  return Math.round(Math.min(100, Math.max(0, n)));
}

function mapApiDeal(deal: ApiDeal, rank: number): DashboardRow {
  const s = deal.scores;
  const lat =
    typeof deal.lat === "number" && Number.isFinite(deal.lat) ? deal.lat : null;
  const lng =
    typeof deal.lng === "number" && Number.isFinite(deal.lng) ? deal.lng : null;

  // Only include pillars that have real data (null = metric was skipped by engine)
  const pillars: { label: string; value: number }[] = [
    ...(s.waterfront != null ? [{ label: "Waterfront", value: roundScore(s.waterfront) }] : []),
    { label: "Zoning",     value: roundScore(s.zoning) },
    { label: "Price",      value: roundScore(s.price_range) },
    { label: "Lot size",   value: roundScore(s.lot_size) },
    ...(s.population_growth != null ? [{ label: "Population", value: roundScore(s.population_growth) }] : []),
    ...(s.traffic != null ? [{ label: "Traffic", value: roundScore(s.traffic) }] : []),
    { label: "Recency",    value: roundScore(s.recency) },
  ];

  return {
    rank,
    id: deal.id,
    title: deal.address?.trim() || deal.parcel_id,
    subtitlePrimary: deal.county,
    subtitleSecondary: deal.parcel_id,
    totalScore: roundScore(s.total),
    tier: deal.tier ?? null,
    lat,
    lng,
    onWatchlist: false,
    watchlistNote: null,
    pillars,
    facts: [
      { label: "County", value: deal.county },
      { label: "Parcel ID", value: deal.parcel_id },
      { label: "Owner", value: deal.owner_name?.trim() || "—" },
      {
        label: "Lot (sq ft)",
        value: Number.isFinite(deal.lot_size_sqft)
          ? Math.round(deal.lot_size_sqft).toLocaleString()
          : "—",
      },
      { label: "Zoning", value: deal.zoning_code?.trim() || "—" },
      {
        label: "Land value",
        value:
          typeof deal.land_value === "number"
            ? `$${deal.land_value.toLocaleString()}`
            : "—",
      },
    ],
    modelLabel: "Python API (FastAPI)",
    source: "api",
  };
}

function mapDrizzleRow(row: RankedParcelRow): DashboardRow {
  return {
    rank: row.rank,
    id: row.parcelId,
    title: row.addressLine,
    subtitlePrimary: `${row.city}, FL ${row.zip}`,
    subtitleSecondary: row.folio,
    totalScore: row.totalScore,
    tier: null,
    lat: row.lat,
    lng: row.lng,
    onWatchlist: row.onWatchlist,
    watchlistNote: row.watchlistNote,
    pillars: [
      { label: "Momentum", value: row.breakdown.momentum },
      { label: "Location", value: row.breakdown.location },
      { label: "Value", value: row.breakdown.value },
      { label: "Liquidity", value: row.breakdown.liquidity },
    ],
    facts: [
      { label: "Zoning", value: row.zoning ?? "—" },
      {
        label: "Acreage",
        value: row.acreage === null ? "—" : row.acreage.toFixed(4),
      },
      {
        label: "Coordinates",
        value: `${row.lat.toFixed(4)}, ${row.lng.toFixed(4)}`,
      },
      { label: "Model", value: row.modelVersion },
      ...(row.watchlistNote
        ? [{ label: "Watchlist note", value: row.watchlistNote }]
        : []),
    ],
    modelLabel: row.modelVersion,
    source: "drizzle",
  };
}

export type DashboardPayload = {
  rows: DashboardRow[];
  source: "api" | "drizzle" | null;
};

/**
 * Prefers the Python FastAPI `/api/v1/deals` when `DEALSCOUT_API_URL` or
 * `NEXT_PUBLIC_API_URL` is set; otherwise reads from Postgres via Drizzle.
 * If the API is configured but fails or returns no rows, falls back to Drizzle.
 */
export async function getDashboardPayload(): Promise<DashboardPayload> {
  const hasApi =
    Boolean(process.env.DEALSCOUT_API_URL?.trim()) ||
    Boolean(process.env.NEXT_PUBLIC_API_URL?.trim());

  if (hasApi) {
    try {
      const deals = await fetchDealsFromApi(50);
      if (deals.length > 0) {
        return {
          rows: deals.map((d, i) => mapApiDeal(d, i + 1)),
          source: "api",
        };
      }
    } catch {
      // fall through to Drizzle
    }
  }

  try {
    const drizzleRows = await getRankedParcels();
    if (drizzleRows.length > 0) {
      return {
        rows: drizzleRows.map(mapDrizzleRow),
        source: "drizzle",
      };
    }
  } catch {
    return { rows: [], source: null };
  }

  return { rows: [], source: null };
}
