import { config } from "dotenv";
import { resolve } from "node:path";
import postgres from "postgres";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL required");

const client = postgres(url, { prepare: false, max: 1 });

async function main() {
  await client`
    CREATE TABLE IF NOT EXISTS pipeline_activity (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      pipeline_id UUID        NOT NULL REFERENCES deal_pipeline(id) ON DELETE CASCADE,
      parcel_id   UUID        NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status   TEXT        NOT NULL,
      note        TEXT,
      user_key    TEXT        NOT NULL DEFAULT 'demo',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  console.log("✓ pipeline_activity table ready");
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
