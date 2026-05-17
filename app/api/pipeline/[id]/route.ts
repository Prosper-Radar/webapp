import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { dealPipeline, pipelineActivity } from "@/drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import type { PipelineStatus } from "@/drizzle/schema";

// PATCH /api/pipeline/[id] — update status or notes (logs activity)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { status, notes, assignedTo } = await req.json() as {
      status?: PipelineStatus;
      notes?: string;
      assignedTo?: string;
    };

    const db = getDb();

    // Fetch current state to capture fromStatus for the audit log
    const [current] = await db
      .select({ status: dealPipeline.status, parcelId: dealPipeline.parcelId })
      .from(dealPipeline)
      .where(and(eq(dealPipeline.id, id), eq(dealPipeline.addedBy, "demo")));

    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [item] = await db
      .update(dealPipeline)
      .set({
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(dealPipeline.id, id), eq(dealPipeline.addedBy, "demo")))
      .returning();

    // Log activity only when status changes
    if (status && status !== current.status) {
      await db.insert(pipelineActivity).values({
        pipelineId: id,
        parcelId: current.parcelId,
        fromStatus: current.status,
        toStatus: status,
        note: notes ?? null,
        userKey: "demo",
      });
    } else if (notes !== undefined) {
      // Log note-only updates as activity with no status change
      await db.insert(pipelineActivity).values({
        pipelineId: id,
        parcelId: current.parcelId,
        fromStatus: current.status,
        toStatus: current.status,
        note: notes || null,
        userKey: "demo",
      });
    }

    return NextResponse.json({ item });
  } catch (err) {
    console.error("PATCH /api/pipeline/[id]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/pipeline/[id] — remove from pipeline
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = getDb();
    await db
      .delete(dealPipeline)
      .where(and(eq(dealPipeline.id, id), eq(dealPipeline.addedBy, "demo")));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/pipeline/[id]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

// GET /api/pipeline/[id]/activity is in its own route file
// But we can also serve the full pipeline item + activity here
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const db = getDb();
    const activity = await db
      .select()
      .from(pipelineActivity)
      .where(eq(pipelineActivity.pipelineId, id))
      .orderBy(desc(pipelineActivity.createdAt));

    return NextResponse.json({ activity });
  } catch (err) {
    console.error("GET /api/pipeline/[id]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
