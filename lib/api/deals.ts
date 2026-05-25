import "server-only";

export type ApiDealScores = {
  waterfront: number | null;       // null when no NHD water data yet
  zoning: number;
  price_range: number;
  lot_size: number;
  population_growth: number | null; // null when no Census API key
  traffic: number | null;           // null when FDOT returned nothing
  recency: number;
  total: number;
};

export type ApiDeal = {
  id: string;
  parcel_id: string;
  county: string;
  address: string;
  owner_name: string | null;
  land_value: number | null;
  lot_size_sqft: number;
  zoning_code: string | null;
  last_sale_date: string | null;
  last_sale_price: number | null;
  /** From PostGIS parcel centroid when geometry exists */
  lat?: number | null;
  lng?: number | null;
  scores: ApiDealScores;
  tier: string;
};

type DealsListResponse = {
  deals: ApiDeal[];
  meta: { offset: number; limit: number };
};

function apiBaseUrl(): string | null {
  const raw =
    process.env.DEALSCOUT_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "";
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export function isApiConfigured(): boolean {
  return Boolean(apiBaseUrl());
}

export async function fetchDealsFromApi(limit = 50): Promise<ApiDeal[]> {
  const base = apiBaseUrl();
  if (!base) {
    return [];
  }
  const url = `${base}/api/v1/deals?limit=${limit}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`DealScout API ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as DealsListResponse;
  return data.deals ?? [];
}
