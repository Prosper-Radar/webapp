import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { dealScores, parcels, watchlist } from "@/drizzle/schema";

export type RankedParcelRow = {
  rank: number;
  parcelId: string;
  folio: string;
  addressLine: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  acreage: number | null;
  zoning: string | null;
  totalScore: number;
  breakdown: {
    momentum: number;
    location: number;
    value: number;
    liquidity: number;
  };
  modelVersion: string;
  onWatchlist: boolean;
  watchlistNote: string | null;
};

export async function getRankedParcels(): Promise<RankedParcelRow[]> {
  const db = getDb();

  const rows = await db
    .select({
      parcel: parcels,
      score: dealScores,
      watchId: watchlist.id,
      watchNote: watchlist.note,
    })
    .from(dealScores)
    .innerJoin(parcels, eq(dealScores.parcelId, parcels.id))
    .leftJoin(
      watchlist,
      and(eq(watchlist.parcelId, parcels.id), eq(watchlist.userKey, "demo")),
    )
    .orderBy(desc(dealScores.totalScore));

  return rows.map((row, index) => ({
    rank: index + 1,
    parcelId: row.parcel.id,
    folio: row.parcel.folio,
    addressLine: row.parcel.addressLine,
    city: row.parcel.city,
    zip: row.parcel.zip,
    lat: row.parcel.lat,
    lng: row.parcel.lng,
    acreage: row.parcel.acreage,
    zoning: row.parcel.zoning,
    totalScore: row.score.totalScore,
    breakdown: row.score.breakdown,
    modelVersion: row.score.modelVersion,
    onWatchlist: Boolean(row.watchId),
    watchlistNote: row.watchNote,
  }));
}
