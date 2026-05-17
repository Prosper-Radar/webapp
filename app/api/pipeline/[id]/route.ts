import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { dealPipeline } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import type { PipelineStatus } from "@/drizzle/schema";

// PATCH /api/pipeline/[id] — update status or notes
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
    const [item] = await db
      .update(dealPipeline)
      .set({ ...(status ? { status } : {}), notes, assignedTo, updatedAt: new Date() })
      .where(and(eq(dealPipeline.id, id), eq(dealPipeline.addedBy, "demo")))
      .returning();

    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
