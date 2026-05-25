"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [pending,  startTransition] = useTransition();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Email ou mot de passe incorrect.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16,185,129,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-xl px-8 py-10 shadow-2xl ring-1 ring-inset ring-white/5">

          {/* Logo + title */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Image
                src="/noun.png"
                alt="DealScout"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div className="text-center">
              <h1 className="text-white font-semibold text-lg tracking-tight">
                DealScout
              </h1>
              <p className="text-white/40 text-sm mt-0.5">
                Connecte-toi pour accéder à ton espace
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs text-white/50 font-medium uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jay@prospergroup.com"
                className={cn(
                  "w-full rounded-lg bg-white/5 border border-white/10 px-3.5 py-2.5",
                  "text-sm text-white placeholder:text-white/20",
                  "outline-none transition-all",
                  "focus:border-emerald-500/60 focus:bg-white/8 focus:ring-1 focus:ring-emerald-500/20",
                  "hover:border-white/15",
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs text-white/50 font-medium uppercase tracking-wider">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={cn(
                  "w-full rounded-lg bg-white/5 border border-white/10 px-3.5 py-2.5",
                  "text-sm text-white placeholder:text-white/20",
                  "outline-none transition-all",
                  "focus:border-emerald-500/60 focus:bg-white/8 focus:ring-1 focus:ring-emerald-500/20",
                  "hover:border-white/15",
                )}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className={cn(
                "w-full mt-1 flex items-center justify-center gap-2",
                "rounded-lg bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600",
                "text-white font-medium text-sm py-2.5",
                "transition-all duration-150",
                "disabled:opacity-50 disabled:pointer-events-none",
                "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
              )}
            >
              {pending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {pending ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        </div>

        {/* Subtle footer */}
        <p className="text-center text-white/20 text-xs mt-5">
          Prosper Group · Accès restreint
        </p>
      </div>
    </div>
  );
}
