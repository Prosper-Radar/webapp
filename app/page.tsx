import { ParcelDashboard } from "@/components/deal-scout/parcel-dashboard";
import { getDashboardPayload } from "@/lib/data/dashboard";

// Revalidate from cache every 5 min (unstable_cache handles it)
export const dynamic = "force-static";

export default async function Home() {
  const { rows, source } = await getDashboardPayload();
  return <ParcelDashboard rows={rows} source={source ?? "drizzle"} />;
}
