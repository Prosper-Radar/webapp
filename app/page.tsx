import { ParcelDashboard } from "@/components/deal-scout/parcel-dashboard";
import { getDashboardPayload } from "@/lib/data/dashboard";
import { AppWalkthrough } from "@/components/deal-scout/app-walkthrough";

// Revalidate from cache every 5 min (unstable_cache handles it)
export const dynamic = "force-static";

export default async function Home() {
  const { rows, source } = await getDashboardPayload();
  return (
    <>
      <AppWalkthrough />
      <ParcelDashboard rows={rows} source={source ?? "drizzle"} />
    </>
  );
}
