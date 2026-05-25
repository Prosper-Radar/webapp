"use client";

import * as React from "react";
import { Cloud } from "lucide-react";

type WeatherPayload = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
};

export function MiamiWeather() {
  const [data, setData] = React.useState<WeatherPayload | null>(null);
  const [err, setErr] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/weather?lat=25.76&lon=-80.19", { cache: "no-store" });
        if (!res.ok) throw new Error("weather");
        const json = (await res.json()) as WeatherPayload;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setErr(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err || !data?.current?.temperature_2m) {
    return null;
  }

  const t = Math.round(data.current.temperature_2m);
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background/50 px-2.5 py-1 text-[11px] tabular-nums text-muted-foreground backdrop-blur-md"
      title="Miami (Open-Meteo)"
    >
      <Cloud className="size-3.5 shrink-0 text-sky-500/90" aria-hidden />
      <span className="text-foreground/90">{t}°C</span>
      <span className="hidden sm:inline">Miami</span>
    </div>
  );
}
