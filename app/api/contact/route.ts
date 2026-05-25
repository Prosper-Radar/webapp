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
  top_contact?: {
    name: string;
    role: string;
    confidence: number;
    reasoning: string;
    source: string;
  } | null;
  source?: string;
  fetched_at?: string;
  contact_tip?: string;
  links: Record<string, string>;
};

// ── Detect individual vs entity ───────────────────────────────────────────────

const ENTITY_WORDS = /\b(LLC|L\.L\.C|INC|CORP|LTD|LP|LLP|LLLP|PA|PL|PLLC|TRUST|ESTATE|GROUP|FUND|HOLDING|PROPERTIES|REALTY|INVESTMENTS?|VENTURES?)\b/i;

function detectEntityType(name: string): "INDIVIDUAL" | "ENTITY" {
  return ENTITY_WORDS.test(name) ? "ENTITY" : "INDIVIDUAL";
}

// ── Generate targeted search links ───────────────────────────────────────────

function buildLinks(name: string, isIndividual: boolean): Record<string, string> {
  const enc = encodeURIComponent(name);
  const encQ = encodeURIComponent(`"${name}"`);

  const sunbiz = `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?inquiryType=EntityName&inquiryDirectionType=BEGINS&searchTerm=${enc}`;

  if (isIndividual) {
    return {
      sunbiz,
      linkedin:    `https://www.linkedin.com/search/results/people/?keywords=${enc}`,
      whitepages:  `https://www.whitepages.com/name/${name.toLowerCase().replaceAll(" ", "-")}`,
      google:      `https://www.google.com/search?q=${encQ}+email+OR+phone+Miami+Florida+real+estate`,
      fastpeoplesearch: `https://www.fastpeoplesearch.com/name/${enc.replace(/%20/g, "-")}`,
    };
  }

  return {
    sunbiz,
    opencorporates: `https://opencorporates.com/companies/us_fl?q=${enc}`,
    linkedin:       `https://www.linkedin.com/search/results/companies/?keywords=${enc}`,
    google:         `https://www.google.com/search?q=${encQ}+Miami+Florida+contact+OR+email+OR+phone`,
    bizapedia:      `https://www.bizapedia.com/fl/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`,
  };
}

// ── Try to enrich via FastAPI (best-effort, non-blocking) ────────────────────

async function tryFastApiSkipTrace(
  dealId: string,
  refresh: boolean,
): Promise<Partial<ContactResult> | null> {
  const base = (
    process.env.DEALSCOUT_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    ""
  ).replace(/\/+$/, "");

  if (!base) return null;

  try {
    const url = `${base}/api/v1/deals/${dealId}/contact${refresh ? "?refresh=true" : ""}`;
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as Partial<ContactResult>;
  } catch {
    return null; // silently fall back to link-only mode
  }
}

/**
 * GET /api/contact?dealId=<uuid>&ownerName=<name>&refresh=true
 *
 * Always returns useful search links (no FastAPI required).
 * Enriches with Sunbiz officer data if FastAPI is reachable.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dealId   = searchParams.get("dealId") ?? "";
  const ownerName = decodeURIComponent(searchParams.get("ownerName") ?? "").trim();
  const refresh  = searchParams.get("refresh") === "true";

  if (!ownerName) {
    return NextResponse.json({
      found: false,
      reason: "No owner name available for this parcel.",
      links: {},
    } satisfies ContactResult);
  }

  const isIndividual = detectEntityType(ownerName) === "INDIVIDUAL";
  const links = buildLinks(ownerName, isIndividual);

  const tip = isIndividual
    ? "Individual owner — LinkedIn People and Whitepages often have direct contact info."
    : "Entity owner — check the officers list from Sunbiz, or search LinkedIn for the company.";

  // Try to enrich via FastAPI (silently skip if unreachable)
  if (dealId) {
    const enriched = await tryFastApiSkipTrace(dealId, refresh);
    if (enriched?.found) {
      return NextResponse.json({
        ...enriched,
        is_individual: isIndividual,
        links: { ...links, ...enriched.links },
        contact_tip: tip,
      } satisfies ContactResult);
    }
  }

  // Fallback: links only (always works)
  return NextResponse.json({
    found: false,
    reason: isIndividual
      ? "No public entity record found — this appears to be an individual owner."
      : "Entity not found in FL Sunbiz — may be registered out-of-state.",
    owner_name_raw: ownerName,
    is_individual: isIndividual,
    entity_type: isIndividual ? "INDIVIDUAL" : "ENTITY",
    contact_tip: tip,
    links,
  } satisfies ContactResult);
}
