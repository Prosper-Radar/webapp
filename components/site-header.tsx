"use client";

import Link from "next/link";

import { IntegrationsStrip } from "@/components/integrations-strip";
import { MiamiWeather } from "@/components/miami-weather";
import { ThemeToggle } from "@/components/theme-toggle";

function TrafficLights() {
  return (
    <div className="flex gap-1.5 pr-2" aria-hidden>
      <span className="size-2.5 rounded-full bg-[#ff5f57] shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)]" />
      <span className="size-2.5 rounded-full bg-[#febc2e] shadow-[inset_0_-1px_0_rgba(0,0,0,0.12)]" />
      <span className="size-2.5 rounded-full bg-[#28c840] shadow-[inset_0_-1px_0_rgba(0,0,0,0.12)]" />
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-background/75 backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-background/55">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <TrafficLights />
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground/90 transition-opacity hover:opacity-80"
        >
          DealScout
        </Link>
        <span className="hidden text-[11px] text-muted-foreground sm:inline">
          Prosper Group ·{" "}
          <a
            href="https://www.raycast.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-border underline-offset-2 hover:text-foreground"
          >
            Raycast
          </a>{" "}
          vibes
        </span>
        <div className="flex-1" />
        <IntegrationsStrip />
        <MiamiWeather />
        <ThemeToggle />
      </div>
    </header>
  );
}
