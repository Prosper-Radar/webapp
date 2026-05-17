import { ParcelBoard, ParcelBoardEmpty } from "@/components/deal-scout/parcel-board";
import { getDashboardPayload } from "@/lib/data/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { rows, source } = await getDashboardPayload();

  if (rows.length === 0) {
    return (
      <div className="min-h-screen">
        <ParcelBoardEmpty />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ParcelBoard rows={rows} source={source ?? "drizzle"} />
    </div>
  );
}
