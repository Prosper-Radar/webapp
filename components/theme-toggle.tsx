"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8 w-[5.5rem] rounded-full bg-muted/40" aria-hidden />;
  }

  const isLight = resolvedTheme === "light";

  return (
    <div
      role="radiogroup"
      aria-label="Apparence"
      className="inline-flex h-8 items-center rounded-full border border-black/10 bg-black/[0.04] p-0.5 shadow-inner backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]"
    >
      <button
        type="button"
        role="radio"
        aria-checked={isLight}
        className={cn(
          "flex size-7 items-center justify-center rounded-full transition-all duration-200",
          isLight
            ? "bg-background text-foreground shadow-sm dark:bg-white/15 dark:text-white"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => setTheme("light")}
      >
        <Sun className="size-3.5" aria-hidden />
        <span className="sr-only">Clair</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={!isLight}
        className={cn(
          "flex size-7 items-center justify-center rounded-full transition-all duration-200",
          !isLight
            ? "bg-background text-foreground shadow-sm dark:bg-white/15 dark:text-white"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => setTheme("dark")}
      >
        <Moon className="size-3.5" aria-hidden />
        <span className="sr-only">Sombre</span>
      </button>
    </div>
  );
}
