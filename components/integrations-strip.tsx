"use client";

import * as React from "react";
import { Plug } from "lucide-react";

import { INTEGRATION_ROWS } from "@/lib/integrations/registry";
import { cn } from "@/lib/utils";

export function IntegrationsStrip() {
  return (
    <div className="hidden items-center gap-1.5 text-[10px] text-muted-foreground lg:flex">
      <Plug className="size-3 shrink-0 opacity-60" aria-hidden />
      {INTEGRATION_ROWS.map((row) => {
        const ok =
          row.envPublicKey === null
            ? true
            : Boolean(process.env[row.envPublicKey]?.trim());
        return (
          <span
            key={row.id}
            title={row.description}
            className={cn(
              "max-w-24 truncate rounded-md border px-1.5 py-0.5",
              ok
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-border/80 bg-muted/30",
            )}
          >
            {row.label}
          </span>
        );
      })}
    </div>
  );
}
