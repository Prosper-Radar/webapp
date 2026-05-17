import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type ContactResult = {
  found: boolean;
  reason?: string;
  owner_name_raw?: string;
  owner_name_normalized?: string;
  entity_type?: string;
  entity_status?: string;
  is_individual?: boolean;
  filing_date?: string | null;
  registered_agent?: string | null;
  principal_address?: string | null;
  officers?: { name: string; title: string; address?: string }[];
  source?: string;
  fetched_at?: string;
  contact_tip?: string;
  links?: Record<string, string>;
};

function apiBaseUrl(): string | null {
  const raw =
    process.env.DEALSCOUT_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "";
  return raw ? raw.replace(/\/+$/, "") : null;
}

/**
 * GET /api/contact?dealId=<uuid>&refresh=true
 * Proxies to FastAPI GET /api/v1/deals/{dealId}/contact
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dealId = searchParams.get("dealId");
  const refresh = searchParams.get("refresh") === "true";

  if (!dealId) {
    return NextResponse.json({ error: "dealId required" }, { status: 400 });
  }

  const base = apiBaseUrl();
  if (!base) {
    return NextResponse.json(
      { found: false, reason: "API not configured", links: {} },
      { status: 200 },
    );
  }

  try {
    const url = `${base}/api/v1/deals/${dealId}/contact${refresh ? "?refresh=true" : ""}`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000), // 20s — skip trace can be slow
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("FastAPI contact error", res.status, text);
      return NextResponse.json(
        { found: false, reason: `API error ${res.status}`, links: {} },
        { status: 200 },
      );
    }

    const data = (await res.json()) as ContactResult;
    return NextResponse.json(data);
  } catch (err) {
    console.error("Contact proxy error:", err);
    return NextResponse.json(
      { found: false, reason: "Could not reach the API", links: {} },
      { status: 200 },
    );
  }
}
