import { ParcelDashboard } from "@/components/deal-scout/parcel-dashboard";
import { getDashboardPayload } from "@/lib/data/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { rows, source } = await getDashboardPayload();
  return <ParcelDashboard rows={rows} source={source ?? "drizzle"} />;
}
