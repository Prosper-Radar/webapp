"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Map, Moon, Sun, LogOut, ExternalLink } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ReplayWalkthrough } from "@/components/deal-scout/app-walkthrough";
import {
  InfoCard,
  InfoCardContent,
  InfoCardTitle,
  InfoCardDescription,
  InfoCardFooter,
  InfoCardDismiss,
} from "@/components/ui/info-card";

// Pipeline masqué pour le MVP — décommenter pour réactiver
const NAV_ITEMS = [
  { href: "/", icon: Map, label: "Deals Map" },
  // { href: "/pipeline", icon: KanbanSquare, label: "Pipeline" },
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

function SignOutBtn() {
  const { data: session } = useSession();
  if (!session) return null;
  return (
    <button
      type="button"
      title={`Se déconnecter (${session.user?.name ?? session.user?.email})`}
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="group relative flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
    >
      <LogOut className="size-4" />
      <span className="pointer-events-none absolute left-full ml-2.5 whitespace-nowrap rounded-lg border border-border/60 bg-popover px-2 py-1 text-[11px] font-medium text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50">
        Déconnexion · {session.user?.name ?? session.user?.email}
      </span>
    </button>
  );
}

function KanbanPreview() {
  const cols = [
    { label: "Spotted",    color: "#6366f1", cards: [70, 50] },
    { label: "Reviewing",  color: "#f59e0b", cards: [85, 40, 60] },
    { label: "Contract",   color: "#10b981", cards: [55] },
    { label: "Closed",     color: "#3b82f6", cards: [90, 75] },
  ];
  return (
    <div className="mt-2 flex gap-1.5 rounded-md overflow-hidden p-2 bg-muted/40 border border-border/40">
      {cols.map((col) => (
        <div key={col.label} className="flex flex-1 flex-col gap-1 min-w-0">
          <div
            className="rounded-sm h-1.5 w-full mb-0.5"
            style={{ backgroundColor: col.color, opacity: 0.85 }}
          />
          {col.cards.map((w, i) => (
            <div
              key={i}
              className="rounded h-3.5 opacity-70"
              style={{ backgroundColor: col.color, width: `${w}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function PipelineCard() {
  return (
    <InfoCard
      storageKey="pipeline-coming-soon"
      dismissType="forever"
      className="bg-card/60 border-border/50 w-full"
    >
      <InfoCardContent>
        <InfoCardTitle className="text-xs font-semibold">Pipeline — Bientôt</InfoCardTitle>
        <InfoCardDescription className="text-[11px]">
          Suivi Kanban de vos deals, de Spotted à Closed.
        </InfoCardDescription>
        <KanbanPreview />
        <InfoCardFooter>
          <InfoCardDismiss className="text-muted-foreground hover:text-foreground transition-colors">
            Masquer
          </InfoCardDismiss>
          <span className="flex items-center gap-1 text-emerald-500 font-medium text-[11px]">
            Coming soon <ExternalLink size={10} />
          </span>
        </InfoCardFooter>
      </InfoCardContent>
    </InfoCard>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-48 flex-col items-stretch border-r border-border/50 bg-background/95 backdrop-blur-xl py-3 shrink-0">
      {/* Logo */}
      <div className="mb-3 flex items-center gap-2.5 px-3">
        <Image src="/noun.png" alt="DealScout" width={22} height={22} className="object-contain shrink-0" />
        <span className="font-semibold text-sm tracking-tight">DealScout</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <a
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <Icon className="size-4 shrink-0" />
              <span>{label}</span>
            </a>
          );
        })}
      </nav>

      {/* Pipeline coming soon card */}
      <div className="px-2 pb-2">
        <PipelineCard />
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-between px-2 pt-1 border-t border-border/30">
        <div className="flex items-center gap-0.5">
          <ThemeBtn />
          <ReplayWalkthrough />
        </div>
        <SignOutBtn />
      </div>
    </aside>
  );
}
