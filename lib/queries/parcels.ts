import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { dealPipeline, dealScores, parcels } from "@/drizzle/schema";

export type RankedParcelRow = {
  rank: number;
  parcelId: string;
  address: string | null;
  county: string;
  ownerName: string | null;
  landValue: number | null;
  lotSizeSqft: number | null;
  zoningCode: string | null;
  lastSaleDate: string | null;
  totalScore: number;
  tier: string | null;
  modelVersion: string;
  waterfrontScore: number | null;
  zoningScore: number | null;
  priceScore: number | null;
  lotSizeScore: number | null;
  populationScore: number | null;
  trafficScore: number | null;
  recencyScore: number | null;
  inPipeline: boolean;
  pipelineStatus: string | null;
  pipelineNote: string | null;
};

export async function getRankedParcels(): Promise<RankedParcelRow[]> {
  const db = getDb();

  const rows = await db
    .select({
      parcel: parcels,
      score: dealScores,
      pipelineId: dealPipeline.id,
      pipelineStatus: dealPipeline.status,
      pipelineNote: dealPipeline.notes,
    })
    .from(dealScores)
    .innerJoin(parcels, eq(dealScores.parcelId, parcels.id))
    .leftJoin(
      dealPipeline,
      and(eq(dealPipeline.parcelId, parcels.id), eq(dealPipeline.addedBy, "demo")),
    )
    .orderBy(desc(dealScores.totalScore));

  return rows.map((row, index) => ({
    rank: index + 1,
    parcelId: row.parcel.parcelId,
    address: row.parcel.address,
    county: row.parcel.county,
    ownerName: row.parcel.ownerName,
    landValue: row.parcel.landValue,
    lotSizeSqft: row.parcel.lotSizeSqft ? Number(row.parcel.lotSizeSqft) : null,
    zoningCode: row.parcel.zoningCode,
    lastSaleDate: row.parcel.lastSaleDate,
    totalScore: row.score.totalScore ? Number(row.score.totalScore) : 0,
    tier: row.score.tier,
    modelVersion: row.score.modelVersion,
    waterfrontScore: row.score.waterfrontScore ? Number(row.score.waterfrontScore) : null,
    zoningScore: row.score.zoningScore ? Number(row.score.zoningScore) : null,
    priceScore: row.score.priceScore ? Number(row.score.priceScore) : null,
    lotSizeScore: row.score.lotSizeScore ? Number(row.score.lotSizeScore) : null,
    populationScore: row.score.populationScore ? Number(row.score.populationScore) : null,
    trafficScore: row.score.trafficScore ? Number(row.score.trafficScore) : null,
    recencyScore: row.score.recencyScore ? Number(row.score.recencyScore) : null,
    inPipeline: Boolean(row.pipelineId),
    pipelineStatus: row.pipelineStatus ?? null,
    pipelineNote: row.pipelineNote ?? null,
  }));
}
