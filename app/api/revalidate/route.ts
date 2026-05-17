import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

/**
 * POST /api/revalidate
 * Clears the "dashboard" cache tag → next page load re-fetches fresh data.
 * Optionally protect with a secret: ?secret=xxx
 */
export async function POST() {
  revalidateTag("dashboard");
  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}

export async function GET() {
  revalidateTag("dashboard");
  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
