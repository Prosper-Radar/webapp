import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { dealPipeline, parcels, dealScores } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import type { PipelineStatus } from "@/drizzle/schema";

export const dynamic = "force-dynamic";

// GET /api/pipeline — list all pipeline items for demo user
export async function GET() {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: dealPipeline.id,
        parcelId: dealPipeline.parcelId,
        status: dealPipeline.status,
        notes: dealPipeline.notes,
        assignedTo: dealPipeline.assignedTo,
        addedBy: dealPipeline.addedBy,
        createdAt: dealPipeline.createdAt,
        updatedAt: dealPipeline.updatedAt,
        address: parcels.addressLine,
        folio: parcels.folio,
        county: parcels.county,
        lat: parcels.lat,
        lng: parcels.lng,
        zoning: parcels.zoning,
        acreage: parcels.acreage,
        totalScore: dealScores.totalScore,
        breakdown: dealScores.breakdown,
        modelVersion: dealScores.modelVersion,
      })
      .from(dealPipeline)
      .innerJoin(parcels, eq(dealPipeline.parcelId, parcels.id))
      .innerJoin(dealScores, eq(dealScores.parcelId, parcels.id))
      .where(eq(dealPipeline.addedBy, "demo"))
      .orderBy(desc(dealPipeline.updatedAt));

    return NextResponse.json({ items: rows });
  } catch (err) {
    console.error("GET /api/pipeline", err);
    return NextResponse.json({ error: "Failed to fetch pipeline" }, { status: 500 });
  }
}

// POST /api/pipeline — add deal to pipeline
export async function POST(req: Request) {
  try {
    const { parcelId, status = "spotted", notes, assignedTo } = await req.json() as {
      parcelId: string;
      status?: PipelineStatus;
      notes?: string;
      assignedTo?: string;
    };

    if (!parcelId) {
      return NextResponse.json({ error: "parcelId required" }, { status: 400 });
    }

    const db = getDb();
    const [item] = await db
      .insert(dealPipeline)
      .values({ parcelId, status, notes, assignedTo, addedBy: "demo" })
      .onConflictDoUpdate({
        target: [dealPipeline.parcelId, dealPipeline.addedBy],
        set: { status, notes, assignedTo, updatedAt: new Date() },
      })
      .returning();

    return NextResponse.json({ item });
  } catch (err) {
    console.error("POST /api/pipeline", err);
    return NextResponse.json({ error: "Failed to add to pipeline" }, { status: 500 });
  }
}
