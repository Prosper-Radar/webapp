"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dealscout_tour_v1";

type Side = "top" | "bottom" | "left" | "right" | "center";

interface Step {
  target?: string;
  side?: Side;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    title: "DealScout — quick tour",
    description: "4 arrêts · 20 secondes. Appuie sur Échap pour passer.",
    side: "center",
  },
  {
    target: "map",
    side: "right",
    title: "La carte",
    description: "Vert ≥ 70 = Tier A · Bleu = Tier B · Gris = Tier C. Le chiffre dans le cercle est le score — pas un compteur.",
  },
  {
    target: "filters",
    side: "bottom",
    title: "Filtres",
    description: "Filtre par tier ou cherche une adresse. La carte se met à jour en direct.",
  },
  {
    target: "deal-list",
    side: "left",
    title: "Liste des deals",
    description: "Clique sur un deal pour ouvrir le score détaillé, les infos propriétaire et le skip trace.",
  },
  {
    target: "pipeline-nav",
    side: "right",
    title: "Pipeline",
    description: "6 étapes de Spotted à Closed. Glisse les cartes ou utilise le menu ···.",
  },
];

const GAP = 14;
const PAD = 6;

// ── Spotlight overlay ─────────────────────────────────────────────────────────
// Single persistent div that slides smoothly between target elements.

interface SpotlightProps {
  el: Element | null;
  visible: boolean;
}

function Spotlight({ el, visible }: Readonly<SpotlightProps>) {
  const [rect, setRect] = React.useState<{ top: number; left: number; width: number; height: number } | null>(null);

  React.useEffect(() => {
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [el]);

  return (
    <>
      {/* Dark overlay behind everything */}
      <div
        className="pointer-events-none fixed inset-0 z-[9996] bg-black/55"
        style={{ transition: "opacity 0.25s", opacity: visible ? 1 : 0 }}
      />
      {/* Cutout highlight — slides to target */}
      {rect && (
        <div
          className="pointer-events-none fixed z-[9997]"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 10,
            outline: "1.5px solid rgba(16,185,129,0.55)",
            outlineOffset: 0,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            transition: "top 0.32s cubic-bezier(0.4,0,0.2,1), left 0.32s cubic-bezier(0.4,0,0.2,1), width 0.32s cubic-bezier(0.4,0,0.2,1), height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.2s",
            opacity: visible ? 1 : 0,
          }}
        />
      )}
    </>
  );
}

// ── Popover positioning ───────────────────────────────────────────────────────

function getPos(el: Element | null, side: Side, pw = 288, ph = 148) {
  if (!el || side === "center") {
    return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" } as React.CSSProperties;
  }
  const r = el.getBoundingClientRect();
  const vw = globalThis.innerWidth;
  const vh = globalThis.innerHeight;
  let top = 0, left = 0;

  if (side === "right")       { top = r.top + r.height / 2 - ph / 2; left = r.right + GAP; }
  else if (side === "left")   { top = r.top + r.height / 2 - ph / 2; left = r.left - pw - GAP; }
  else if (side === "bottom") { top = r.bottom + GAP; left = r.left + r.width / 2 - pw / 2; }
  else                        { top = r.top - ph - GAP; left = r.left + r.width / 2 - pw / 2; }

  // Clamp to viewport
  if (left + pw > vw - 8) left = vw - pw - 8;
  if (left < 8) left = 8;
  if (top + ph > vh - 8) top = vh - ph - 8;
  if (top < 8) top = 8;

  return { top, left, transform: "none" } as React.CSSProperties;
}

// ── Main component ────────────────────────────────────────────────────────────

export function AppWalkthrough() {
  const [step, setStep] = React.useState<number | null>(null);
  const [targetEl, setTargetEl] = React.useState<Element | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [animKey, setAnimKey] = React.useState(0); // forces card re-animation on step change

  React.useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setStep(0), 900);
    return () => clearTimeout(t);
  }, []);

  const currentStep = step !== null ? STEPS[step] : null;

  React.useEffect(() => {
    if (!currentStep?.target) { setTargetEl(null); return; }
    const el = document.querySelector(`[data-tour='${currentStep.target}']`);
    setTargetEl(el ?? null);
    setAnimKey((k) => k + 1);
  }, [currentStep]);

  function close() {
    setStep(null);
    sessionStorage.setItem(STORAGE_KEY, "done");
  }

  function goTo(n: number) {
    setAnimKey((k) => k + 1);
    setStep(n);
  }

  function next() {
    if (step === null) return;
    if (step >= STEPS.length - 1) { close(); return; }
    goTo(step + 1);
  }

  function prev() {
    if (step === null || step === 0) return;
    goTo(step - 1);
  }

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (step === null) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
    }
    globalThis.addEventListener("keydown", onKey);
    return () => globalThis.removeEventListener("keydown", onKey);
  });

  if (!mounted || step === null || !currentStep) return null;

  const isCenter = !currentStep.target;
  const pos = getPos(targetEl, currentStep.side ?? "center");

  return createPortal(
    <>
      <Spotlight el={targetEl} visible={!isCenter} />

      {/* Full overlay for center step */}
      {isCenter && (
        <div
          className="fixed inset-0 z-[9996] bg-black/55"
          onClick={close}
        />
      )}

      {/* Popover card */}
      <div
        key={animKey}
        role="dialog"
        aria-modal="true"
        className="fixed z-[9999] w-[288px] rounded-xl border border-white/8 bg-[#111113]/97 shadow-[0_24px_64px_rgba(0,0,0,0.75),0_0_0_0.5px_rgba(255,255,255,0.04)_inset] backdrop-blur-2xl"
        style={{
          ...pos,
          animation: "ds-enter 0.22s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 rounded-md p-1 text-white/25 transition-colors hover:bg-white/8 hover:text-white/60"
          aria-label="Fermer le tour"
        >
          <X className="size-3.5" />
        </button>

        <div className="p-4 pb-3">
          <p className="mb-1.5 pr-7 text-[13px] font-semibold tracking-[-0.01em] text-white">
            {currentStep.title}
          </p>
          <p className="text-[11.5px] leading-relaxed text-white/42">
            {currentStep.description}
          </p>
        </div>

        <div className="flex items-center gap-2 border-t border-white/6 px-4 py-2.5">
          {/* Progress dots */}
          <div className="mr-auto flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                type="button"
                key={`dot-${i}`}
                onClick={() => goTo(i)}
                aria-label={`Étape ${i + 1}`}
                className={cn(
                  "rounded-full transition-all duration-250",
                  i === step
                    ? "h-1.5 w-4 bg-emerald-500"
                    : "h-1.5 w-1.5 bg-white/18 hover:bg-white/35",
                )}
              />
            ))}
          </div>

          {step > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={prev}
              className="h-7 px-2.5 text-[11px] text-white/40 hover:bg-white/8 hover:text-white/70"
            >
              Back
            </Button>
          )}

          <Button
            size="sm"
            onClick={next}
            className="h-7 gap-1 bg-emerald-500 px-3 text-[11px] font-semibold text-white hover:bg-emerald-500/90"
          >
            {step === STEPS.length - 1 ? "Done" : "Next"}
            {step < STEPS.length - 1 && <ChevronRight className="size-3" />}
          </Button>
        </div>
      </div>

      {/* Keyframe injected once */}
      <style>{`
        @keyframes ds-enter {
          from { opacity: 0; transform: ${isCenter ? "translate(-50%,-50%) scale(0.96)" : "scale(0.96)"}; }
          to   { opacity: 1; transform: ${isCenter ? "translate(-50%,-50%) scale(1)"    : "scale(1)"}; }
        }
      `}</style>
    </>,
    document.body,
  );
}

function replay() {
  sessionStorage.removeItem(STORAGE_KEY);
  globalThis.location.reload();
}

export function ReplayWalkthrough() {
  return (
    <button
      type="button"
      onClick={replay}
      className="text-xs text-muted-foreground/50 transition-colors hover:text-foreground"
    >
      Replay tour
    </button>
  );
}
