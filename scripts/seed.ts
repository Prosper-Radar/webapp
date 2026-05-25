import { config } from "dotenv";
import { resolve } from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { dealPipeline, dealScores, parcels } from "../drizzle/schema";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required to run the seed script");

const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client);

// ── Tier thresholds — mirror api/app/scoring/tiers.py ──────────────────────
const TIER_A_THRESHOLD = 70.0;
const TIER_B_THRESHOLD = 45.0;

function tierFromScore(score: number): "A" | "B" | "C" {
  if (score >= TIER_A_THRESHOLD) return "A";
  if (score >= TIER_B_THRESHOLD) return "B";
  return "C";
}

function scoreBreakdown(seed: number) {
  const base = 50 + (seed % 40);
  const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v)));
  return {
    waterfrontScore: clamp(base + ((seed * 2) % 20) - 5),
    zoningScore:     clamp(base + ((seed * 3) % 18)),
    priceScore:      clamp(base + ((seed * 7) % 22) - 8),
    lotSizeScore:    clamp(base + ((seed * 5) % 16) - 3),
    populationScore: clamp(base + ((seed * 11) % 14)),
    trafficScore:    clamp(base + ((seed * 13) % 12) - 4),
    recencyScore:    clamp(base + ((seed * 17) % 10)),
  };
}

function totalScore(b: ReturnType<typeof scoreBreakdown>): number {
  const vals = Object.values(b);
  return Math.round(vals.reduce((a, v) => a + v, 0) / vals.length);
}

// lat/lng used to build geometry — stored separately so the seed can populate PostGIS
const mockParcels = [
  { parcelId: "01-3130-019-0020", address: "1200 Brickell Ave, Miami, FL 33131",      county: "Miami-Dade", ownerName: "BRICKELL LAND LLC",       zoningCode: "T6-24-O", lotSizeSqft: "19602", landValue: 2800000, totalValue: 4200000, lat:  25.7617, lng: -80.1918 },
  { parcelId: "01-4120-011-0050", address: "2001 Biscayne Blvd, Miami, FL 33137",     county: "Miami-Dade", ownerName: "BISCAYNE PROP TRUST",     zoningCode: "T5-O",    lotSizeSqft: "27007", landValue: 1900000, totalValue: 3100000, lat:  25.7987, lng: -80.1995 },
  { parcelId: "01-3230-022-0180", address: "888 Brickell Key Dr, Miami, FL 33131",    county: "Miami-Dade", ownerName: "KEY DEVELOPMENT CORP",    zoningCode: "T6-36-O", lotSizeSqft: "16553", landValue: 3500000, totalValue: 5200000, lat:  25.7691, lng: -80.1865 },
  { parcelId: "01-3430-041-0120", address: "3400 NW 7th Ave, Miami, FL 33127",        county: "Miami-Dade", ownerName: "NORTHWEST HOLDINGS INC",  zoningCode: "IU-2",    lotSizeSqft: "52272", landValue:  980000, totalValue: 1600000, lat:  25.8078, lng: -80.2089 },
  { parcelId: "01-3130-028-0030", address: "1450 S Miami Ave, Miami, FL 33131",       county: "Miami-Dade", ownerName: "SOUTH MIAMI AVE LLC",     zoningCode: "T6-24-O", lotSizeSqft: "22216", landValue: 2100000, totalValue: 3300000, lat:  25.7554, lng: -80.1961 },
  { parcelId: "02-3230-001-0080", address: "1 Alhambra Plaza, Coral Gables, FL 33134",county: "Miami-Dade", ownerName: "GABLES REALTY PARTNERS",  zoningCode: "CBD-1",   lotSizeSqft: "31363", landValue: 2400000, totalValue: 4100000, lat:  25.7512, lng: -80.2584 },
  { parcelId: "02-3230-014-0040", address: "405 Biltmore Way, Coral Gables, FL 33134",county: "Miami-Dade", ownerName: "BILTMORE ESTATE TRUST",   zoningCode: "RES-1",   lotSizeSqft: "14375", landValue: 1200000, totalValue: 2800000, lat:  25.7468, lng: -80.2611 },
  { parcelId: "01-4130-002-0060", address: "2500 NW 2nd Ave, Miami, FL 33127",        county: "Miami-Dade", ownerName: "WYNWOOD DEV GROUP LLC",   zoningCode: "T5-L",    lotSizeSqft: "38768", landValue: 1650000, totalValue: 2700000, lat:  25.8012, lng: -80.1991 },
  { parcelId: "01-4230-018-0110", address: "2100 NW 7th Ave, Miami, FL 33127",        county: "Miami-Dade", ownerName: "LIBERTY CITY HOLDINGS",   zoningCode: "IU-1",    lotSizeSqft: "45738", landValue:  820000, totalValue: 1400000, lat:  25.7955, lng: -80.2082 },
  { parcelId: "03-5900-022-0040", address: "9700 Collins Ave, Surfside, FL 33154",    county: "Miami-Dade", ownerName: "COLLINS BEACHFRONT LLC",  zoningCode: "RM-2",    lotSizeSqft: "17860", landValue: 4800000, totalValue: 7200000, lat:  25.8796, lng: -80.1215 },
  { parcelId: "01-3130-035-0090", address: "1101 Brickell Ave, Miami, FL 33131",      county: "Miami-Dade", ownerName: "BRICKELL TOWERS CORP",    zoningCode: "T6-36-O", lotSizeSqft: "20473", landValue: 3100000, totalValue: 4900000, lat:  25.7635, lng: -80.1931 },
  { parcelId: "01-3430-055-0200", address: "225 NW 24th St, Miami, FL 33127",         county: "Miami-Dade", ownerName: "EDGEWATER LAND TRUST",    zoningCode: "T5-O",    lotSizeSqft: "23958", landValue: 1300000, totalValue: 2100000, lat:  25.7999, lng: -80.1997 },
  { parcelId: "01-4130-030-0070", address: "175 NW 20th St, Miami, FL 33127",         county: "Miami-Dade", ownerName: "OVERTOWN DEV PARTNERS",   zoningCode: "T5-L",    lotSizeSqft: "29185", landValue: 1100000, totalValue: 1900000, lat:  25.7951, lng: -80.1988 },
  { parcelId: "04-2000-010-0150", address: "7800 SW 88th St, Miami, FL 33156",        county: "Miami-Dade", ownerName: "KENDALL COMMERCIAL LLC",  zoningCode: "EU-M",    lotSizeSqft: "91476", landValue:  750000, totalValue: 1800000, lat:  25.6871, lng: -80.3214 },
  { parcelId: "01-3230-018-0140", address: "500 Brickell Ave, Miami, FL 33131",       county: "Miami-Dade", ownerName: "500 BRICKELL VENTURES",   zoningCode: "T6-24-O", lotSizeSqft: "22651", landValue: 2600000, totalValue: 4400000, lat:  25.7684, lng: -80.1912 },
  { parcelId: "02-3230-022-0030", address: "2800 Ponce de Leon Blvd, Coral Gables, FL 33134", county: "Miami-Dade", ownerName: "PONCE CORAL LLC", zoningCode: "T4-R",  lotSizeSqft: "20909", landValue: 1800000, totalValue: 3600000, lat:  25.7439, lng: -80.2556 },
  { parcelId: "01-4120-008-0120", address: "175 NE 29th St, Miami, FL 33137",         county: "Miami-Dade", ownerName: "DESIGN DISTRICT PROP",    zoningCode: "T5-O",    lotSizeSqft: "26572", landValue: 2200000, totalValue: 3500000, lat:  25.8051, lng: -80.1902 },
  { parcelId: "01-3130-041-0060", address: "1395 Brickell Ave, Miami, FL 33131",      county: "Miami-Dade", ownerName: "BRICKELL FINANCIAL LLC",  zoningCode: "T6-36-O", lotSizeSqft: "16988", landValue: 3300000, totalValue: 5600000, lat:  25.7608, lng: -80.1924 },
  { parcelId: "03-3205-004-0080", address: "16801 Collins Ave, Sunny Isles Beach, FL 33160", county: "Miami-Dade", ownerName: "SUNNY ISLES INVEST LLC", zoningCode: "RM-3", lotSizeSqft: "19166", landValue: 5100000, totalValue: 8300000, lat: 25.9324, lng: -80.1208 },
  { parcelId: "01-3430-062-0050", address: "2601 NW 5th Ave, Miami, FL 33127",        county: "Miami-Dade", ownerName: "ALLAPATTAH LAND GROUP",   zoningCode: "IU-2",    lotSizeSqft: "33977", landValue:  880000, totalValue: 1500000, lat:  25.8024, lng: -80.2006 },
] as const;

async function main() {
  // Clear everything (cascade handles deal_scores, owner_profiles, deal_pipeline)
  await db.execute(sql`truncate table parcels restart identity cascade`);
  console.log("Truncated parcels (cascade → deal_scores, deal_pipeline, owner_profiles)");

  const inserted = await db
    .insert(parcels)
    .values(
      mockParcels.map((p) => ({
        parcelId:     p.parcelId,
        county:       p.county,
        ownerName:    p.ownerName,
        address:      p.address,
        landValue:    p.landValue,
        totalValue:   p.totalValue,
        lotSizeSqft:  p.lotSizeSqft,
        zoningCode:   p.zoningCode,
      })),
    )
    .returning({ id: parcels.id, parcelId: parcels.parcelId });

  // Populate PostGIS geometry from lat/lng — tiny square polygon (±0.0005°) around centroid
  // The API uses ST_Centroid(geometry) to extract lat/lng, so this must be set.
  const delta = 0.0005;
  for (const row of inserted) {
    const mock = mockParcels.find((p) => p.parcelId === row.parcelId);
    if (!mock) continue;
    const { lat, lng } = mock;
    const wkt = `POLYGON((${lng - delta} ${lat - delta}, ${lng + delta} ${lat - delta}, ${lng + delta} ${lat + delta}, ${lng - delta} ${lat + delta}, ${lng - delta} ${lat - delta}))`;
    await db.execute(
      sql`UPDATE parcels SET geometry = ST_SetSRID(ST_GeomFromText(${wkt}), 4326) WHERE id = ${row.id}::uuid`,
    );
  }
  console.log(`✓ Populated geometry for ${inserted.length} parcels`);

  // Build scores
  const scoreRows = inserted.map((row, i) => {
    const b = scoreBreakdown(i + 1);
    const total = totalScore(b);
    return {
      parcelId:        row.id,
      totalScore:      String(total),
      tier:            tierFromScore(total),
      waterfrontScore: String(b.waterfrontScore),
      zoningScore:     String(b.zoningScore),
      priceScore:      String(b.priceScore),
      lotSizeScore:    String(b.lotSizeScore),
      populationScore: String(b.populationScore),
      trafficScore:    String(b.trafficScore),
      recencyScore:    String(b.recencyScore),
      modelVersion:    "v1-demo",
    };
  });

  await db.insert(dealScores).values(scoreRows);

  // Seed a few demo pipeline entries for top deals
  const topDeals = [...inserted]
    .map((r, i) => ({ ...r, score: Number(scoreRows[i]?.totalScore ?? 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  await db.insert(dealPipeline).values([
    { parcelId: topDeals[0].id, status: "reviewing",     addedBy: "demo", notes: "Shortlist for Prosper review" },
    { parcelId: topDeals[1].id, status: "spotted",       addedBy: "demo", notes: null },
    { parcelId: topDeals[2].id, status: "loi_submitted", addedBy: "demo", notes: "LOI sent 2026-05-15" },
  ]);

  const byTier = scoreRows.reduce((acc, s) => { acc[s.tier] = (acc[s.tier] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  console.log(`✓ Seeded ${inserted.length} parcels with scores — Tier A: ${byTier.A ?? 0}, B: ${byTier.B ?? 0}, C: ${byTier.C ?? 0}`);
  console.log("✓ Seeded 3 demo pipeline entries (reviewing / spotted / loi_submitted)");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
