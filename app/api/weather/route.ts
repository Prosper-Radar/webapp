import { NextRequest, NextResponse } from "next/server";

const OPEN_METEO = "https://api.open-meteo.com/v1/forecast";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat") ?? "25.76";
  const lon = req.nextUrl.searchParams.get("lon") ?? "-80.19";

  const url = new URL(OPEN_METEO);
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("timezone", "America/New_York");

  const res = await fetch(url.toString(), { next: { revalidate: 900 } });
  if (!res.ok) {
    return NextResponse.json({ error: "open-meteo failed" }, { status: 502 });
  }
  const data = await res.json();
  return NextResponse.json(data);
}
