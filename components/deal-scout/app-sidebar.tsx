"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  KanbanSquare,
  Map,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/",          icon: Map,          label: "Deals Map"  },
  { href: "/pipeline",  icon: KanbanSquare, label: "Pipeline"   },
];

function ThemeBtn() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="size-9" />;
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-12 flex-col items-center gap-1 border-r border-border/50 bg-background/95 backdrop-blur-xl py-3 shrink-0">
      {/* Logo */}
      <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-primary/10">
        <Sparkles className="size-4 text-primary" />
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <a
              key={href}
              href={href}
              title={label}
              className={cn(
                "group relative flex size-9 items-center justify-center rounded-xl transition-all",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {/* Tooltip */}
              <span className="pointer-events-none absolute left-full ml-2.5 whitespace-nowrap rounded-lg border border-border/60 bg-popover px-2 py-1 text-[11px] font-medium text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50">
                {label}
              </span>
              {/* Active indicator */}
              {isActive ? (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              ) : null}
            </a>
          );
        })}
      </nav>

      {/* Theme toggle at bottom */}
      <ThemeBtn />
    </aside>
  );
}
