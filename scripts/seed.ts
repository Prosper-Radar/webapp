import { config } from "dotenv";
import { resolve } from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import { dealScores, parcels, watchlist, type ScoreBreakdown } from "../drizzle/schema";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required to run the seed script");
}

const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client);

function breakdown(seed: number): ScoreBreakdown {
  const base = 55 + (seed % 35);
  return {
    momentum: Math.min(100, base + ((seed * 3) % 18)),
    location: Math.min(100, base - 5 + ((seed * 5) % 22)),
    value: Math.min(100, base + ((seed * 7) % 20)),
    liquidity: Math.min(100, base - 8 + ((seed * 11) % 25)),
  };
}

function totalFromBreakdown(b: ScoreBreakdown): number {
  const t = (b.momentum + b.location + b.value + b.liquidity) / 4;
  return Math.round(Math.min(100, Math.max(0, t)));
}

const mockParcels = [
  { folio: "01-3130-019-0020", addressLine: "1200 Brickell Ave", city: "Miami", zip: "33131", lat: 25.7617, lng: -80.1918, acreage: "0.4500", zoning: "T6-24-O" },
  { folio: "01-4120-011-0050", addressLine: "2001 Biscayne Blvd", city: "Miami", zip: "33137", lat: 25.7987, lng: -80.1995, acreage: "0.6200", zoning: "T5-O" },
  { folio: "01-3230-022-0180", addressLine: "888 Brickell Key Dr", city: "Miami", zip: "33131", lat: 25.7691, lng: -80.1865, acreage: "0.3800", zoning: "T6-36-O" },
  { folio: "01-3430-041-0120", addressLine: "3400 NW 7th Ave", city: "Miami", zip: "33127", lat: 25.8078, lng: -80.2089, acreage: "1.2000", zoning: "IU-2" },
  { folio: "01-3130-028-0030", addressLine: "1450 S Miami Ave", city: "Miami", zip: "33131", lat: 25.7554, lng: -80.1961, acreage: "0.5100", zoning: "T6-24-O" },
  { folio: "02-3230-001-0080", addressLine: "1 Alhambra Plaza", city: "Coral Gables", zip: "33134", lat: 25.7512, lng: -80.2584, acreage: "0.7200", zoning: "CBD-1" },
  { folio: "02-3230-014-0040", addressLine: "405 Biltmore Way", city: "Coral Gables", zip: "33134", lat: 25.7468, lng: -80.2611, acreage: "0.3300", zoning: "RES-1" },
  { folio: "01-4130-002-0060", addressLine: "2500 NW 2nd Ave", city: "Miami", zip: "33127", lat: 25.8012, lng: -80.1991, acreage: "0.8900", zoning: "T5-L" },
  { folio: "01-4230-018-0110", addressLine: "2100 NW 7th Ave", city: "Miami", zip: "33127", lat: 25.7955, lng: -80.2082, acreage: "1.0500", zoning: "IU-1" },
  { folio: "03-5900-022-0040", addressLine: "9700 Collins Ave", city: "Surfside", zip: "33154", lat: 25.8796, lng: -80.1215, acreage: "0.4100", zoning: "RM-2" },
  { folio: "01-3130-035-0090", addressLine: "1101 Brickell Ave", city: "Miami", zip: "33131", lat: 25.7635, lng: -80.1931, acreage: "0.4700", zoning: "T6-36-O" },
  { folio: "01-3430-055-0200", addressLine: "225 NW 24th St", city: "Miami", zip: "33127", lat: 25.7999, lng: -80.1997, acreage: "0.5500", zoning: "T5-O" },
  { folio: "01-4130-030-0070", addressLine: "175 NW 20th St", city: "Miami", zip: "33127", lat: 25.7951, lng: -80.1988, acreage: "0.6700", zoning: "T5-L" },
  { folio: "04-2000-010-0150", addressLine: "7800 SW 88th St", city: "Miami", zip: "33156", lat: 25.6871, lng: -80.3214, acreage: "2.1000", zoning: "EU-M" },
  { folio: "01-3230-018-0140", addressLine: "500 Brickell Ave", city: "Miami", zip: "33131", lat: 25.7684, lng: -80.1912, acreage: "0.5200", zoning: "T6-24-O" },
  { folio: "02-3230-022-0030", addressLine: "2800 Ponce de Leon Blvd", city: "Coral Gables", zip: "33134", lat: 25.7439, lng: -80.2556, acreage: "0.4800", zoning: "T4-R" },
  { folio: "01-4120-008-0120", addressLine: "175 NE 29th St", city: "Miami", zip: "33137", lat: 25.8051, lng: -80.1902, acreage: "0.6100", zoning: "T5-O" },
  { folio: "01-3130-041-0060", addressLine: "1395 Brickell Ave", city: "Miami", zip: "33131", lat: 25.7608, lng: -80.1924, acreage: "0.3900", zoning: "T6-36-O" },
  { folio: "03-3205-004-0080", addressLine: "16801 Collins Ave", city: "Sunny Isles Beach", zip: "33160", lat: 25.9324, lng: -80.1208, acreage: "0.4400", zoning: "RM-3" },
  { folio: "01-3430-062-0050", addressLine: "2601 NW 5th Ave", city: "Miami", zip: "33127", lat: 25.8024, lng: -80.2006, acreage: "0.7800", zoning: "IU-2" },
] as const;

async function main() {
  await db.execute(sql`truncate table parcels restart identity cascade`);

  const inserted = await db
    .insert(parcels)
    .values(
      mockParcels.map((p) => ({
        folio: p.folio,
        addressLine: p.addressLine,
        city: p.city,
        zip: p.zip,
        lat: p.lat,
        lng: p.lng,
        acreage: Number.parseFloat(p.acreage),
        zoning: p.zoning,
      })),
    )
    .returning({ id: parcels.id });

  const scoreRows = inserted.map((row, i) => {
    const b = breakdown(i + 1);
    return {
      parcelId: row.id,
      totalScore: totalFromBreakdown(b),
      breakdown: b,
      modelVersion: "v0-demo",
    };
  });

  await db.insert(dealScores).values(scoreRows);

  const topIds = [...inserted]
    .sort((a, b) => {
      const sa = scoreRows.find((s) => s.parcelId === a.id)?.totalScore ?? 0;
      const sb = scoreRows.find((s) => s.parcelId === b.id)?.totalScore ?? 0;
      return sb - sa;
    })
    .slice(0, 4)
    .map((r) => r.id);

  await db.insert(watchlist).values(
    topIds.map((parcelId, i) => ({
      userKey: "demo",
      parcelId,
      note: i === 0 ? "Shortlist for Prosper review" : null,
    })),
  );

  console.log(`Seeded ${inserted.length} parcels, scores, and ${topIds.length} watchlist rows.`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
