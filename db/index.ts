import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";

const globalForDb = globalThis as unknown as {
  queryClient?: ReturnType<typeof postgres>;
};

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  // Transaction pool mode (Supabase pooler): prepared statements off
  return postgres(connectionString, { prepare: false });
}

export function getDb() {
  globalForDb.queryClient ??= createClient();
  return drizzle(globalForDb.queryClient, { schema });
}

export type Db = ReturnType<typeof getDb>;
