import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const enterTo = authed ? "/sanctum" : "/auth";

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-[color:var(--gold)]/20">
      <div className="observatory-glow absolute inset-0 pointer-events-none" />
      <div className="constellation-grid absolute inset-0 pointer-events-none opacity-30" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-full bg-[color:var(--earth-green)] animate-pulse" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Atlas Sanctum
          </span>
        </div>
        <Link
          to="/auth"
          className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          {authed ? "Continue" : "Sign in"}
        </Link>
      </nav>

      <section className="relative z-10 flex flex-col items-center px-6 pt-16 pb-24">
        <div className="max-w-2xl w-full text-center space-y-12">
          <header className="space-y-6">
            <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Civilization Interface — Alpha
            </span>
            <h1 className="font-serif text-6xl md:text-7xl font-medium text-balance leading-[1.05] tracking-tight">
              Atlas Sanctum
            </h1>
            <p className="text-lg text-muted-foreground max-w-[46ch] mx-auto text-pretty leading-relaxed">
              The interface for a living civilization. Orient your contribution to the planetary
              whole and consult the Oracle on regeneration, systems, and human flourishing.
            </p>
          </header>

          <div className="grid grid-cols-2 gap-8 py-8 border-y border-border/60">
            <IndicatorBar label="Planet Health" value={64} tone="earth" />
            <IndicatorBar label="Human Flourishing" value={42} tone="gold" />
          </div>

          <div className="flex flex-col items-center gap-4">
            <Link
              to={enterTo}
              className="inline-flex items-center justify-center py-4 px-10 rounded-full bg-foreground text-background text-sm font-medium tracking-wide hover:bg-foreground/90 transition-colors"
            >
              Enter the Sanctum
            </Link>
            <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              {authed ? "Session Restored" : "Sign in or create your seeker profile"}
            </span>
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-12 flex flex-col items-center border-t border-border/40">
        <div className="w-px h-16 bg-gradient-to-b from-border to-transparent" />
        <span className="mt-6 text-[10px] tracking-[0.4em] text-muted-foreground/60 uppercase">
          Observatory Alpha 1.0
        </span>
      </footer>
    </div>
  );
}

function IndicatorBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "earth" | "gold";
}) {
  const color = tone === "earth" ? "var(--earth-green)" : "var(--gold)";
  return (
    <div className="space-y-2 text-left">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${value}%`, backgroundColor: `color-mix(in oklab, ${color} 70%, transparent)` }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color }}>
          {value}%
        </span>
      </div>
    </div>
  );
}