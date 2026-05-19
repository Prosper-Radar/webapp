import "server-only";

import { unstable_cache } from "next/cache";
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
    inPipeline: false,
    pipelineNote: null,
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
    // Extended fields for detail drawer
    ownerName: deal.owner_name ?? null,
    landValue: deal.land_value ?? null,
    lotSizeSqft: deal.lot_size_sqft ?? null,
    zoningCode: deal.zoning_code ?? null,
    lastSaleDate: deal.last_sale_date ?? null,
    lastSalePrice: deal.last_sale_price ?? null,
    parcelId: deal.parcel_id,
    county: deal.county,
  };
}

function mapDrizzleRow(row: RankedParcelRow): DashboardRow {
  const pillars: { label: string; value: number }[] = [
    ...(row.waterfrontScore != null ? [{ label: "Waterfront", value: row.waterfrontScore }] : []),
    ...(row.zoningScore != null ? [{ label: "Zoning", value: row.zoningScore }] : []),
    ...(row.priceScore != null ? [{ label: "Price", value: row.priceScore }] : []),
    ...(row.lotSizeScore != null ? [{ label: "Lot size", value: row.lotSizeScore }] : []),
    ...(row.populationScore != null ? [{ label: "Population", value: row.populationScore }] : []),
    ...(row.trafficScore != null ? [{ label: "Traffic", value: row.trafficScore }] : []),
    ...(row.recencyScore != null ? [{ label: "Recency", value: row.recencyScore }] : []),
  ];

  return {
    rank: row.rank,
    id: row.parcelId,
    title: row.address?.trim() || row.parcelId,
    subtitlePrimary: row.county,
    subtitleSecondary: row.parcelId,
    totalScore: row.totalScore,
    tier: row.tier,
    lat: null,
    lng: null,
    inPipeline: row.inPipeline,
    pipelineNote: row.pipelineNote,
    pillars,
    facts: [
      { label: "Zoning", value: row.zoningCode ?? "—" },
      {
        label: "Lot (sq ft)",
        value: row.lotSizeSqft != null ? Math.round(row.lotSizeSqft).toLocaleString() : "—",
      },
      { label: "Owner", value: row.ownerName?.trim() || "—" },
      { label: "Model", value: row.modelVersion },
      ...(row.pipelineNote ? [{ label: "Pipeline note", value: row.pipelineNote }] : []),
    ],
    modelLabel: row.modelVersion,
    source: "drizzle",
    parcelId: row.parcelId,
    county: row.county,
    ownerName: row.ownerName,
    landValue: row.landValue,
    lotSizeSqft: row.lotSizeSqft,
    zoningCode: row.zoningCode,
    lastSaleDate: row.lastSaleDate,
  };
}

export type DashboardPayload = {
  rows: DashboardRow[];
  source: "api" | "drizzle" | null;
  cachedAt: number; // unix ms — shown in UI
};

/** Cache TTL: 5 minutes. Revalidated by tag "dashboard" via /api/revalidate */
const CACHE_TTL_SECONDS = 300;

async function _fetchDashboard(): Promise<DashboardPayload> {
  const hasApi =
    Boolean(process.env.DEALSCOUT_API_URL?.trim()) ||
    Boolean(process.env.NEXT_PUBLIC_API_URL?.trim());

  if (hasApi) {
    try {
      const deals = await fetchDealsFromApi(200);
      if (deals.length > 0) {
        return {
          rows: deals.map((d, i) => mapApiDeal(d, i + 1)),
          source: "api",
          cachedAt: Date.now(),
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
        cachedAt: Date.now(),
      };
    }
  } catch {
    return { rows: [], source: null, cachedAt: Date.now() };
  }

  return { rows: [], source: null, cachedAt: Date.now() };
}

/**
 * Cached version — revalidates every 5 min or on-demand via tag "dashboard".
 * This prevents hammering the FastAPI + Supabase on every page load.
 */
export const getDashboardPayload = unstable_cache(
  _fetchDashboard,
  ["dashboard-payload"],
  { revalidate: CACHE_TTL_SECONDS, tags: ["dashboard"] },
);
