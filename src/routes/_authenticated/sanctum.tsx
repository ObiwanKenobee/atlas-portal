import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, saveMission } from "@/lib/oracle.functions";

type Mission = "build" | "learn" | "restore" | "serve";

const PILLARS: { id: Mission; label: string; blurb: string; tone: string }[] = [
  { id: "build", label: "Build", blurb: "Design new systems", tone: "var(--ocean)" },
  { id: "learn", label: "Learn", blurb: "Deepen understanding", tone: "var(--gold)" },
  { id: "restore", label: "Restore", blurb: "Heal what is broken", tone: "var(--earth-green)" },
  { id: "serve", label: "Serve", blurb: "Tend to community", tone: "var(--gold)" },
];

export const Route = createFileRoute("/_authenticated/sanctum")({
  head: () => ({ meta: [{ title: "The Sanctum — Atlas Sanctum" }] }),
  component: SanctumPage,
});

function SanctumPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const saveMissionFn = useServerFn(saveMission);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  const [selected, setSelected] = useState<Mission | null>(null);
  const mission = selected ?? (profileQuery.data?.mission as Mission | null) ?? null;

  const save = useMutation({
    mutationFn: (m: Mission) => saveMissionFn({ data: { mission: m } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });

  async function onEnter() {
    if (!mission) {
      toast.error("Choose a pillar to orient your inquiry.");
      return;
    }
    try {
      if (mission !== profileQuery.data?.mission) await save.mutateAsync(mission);
      navigate({ to: "/oracle" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your mission.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const name = profileQuery.data?.display_name || "Seeker";

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="observatory-glow absolute inset-0 pointer-events-none" />
      <div className="constellation-grid absolute inset-0 pointer-events-none opacity-20" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link to="/" className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground">
          Atlas Sanctum
        </Link>
        <button
          onClick={signOut}
          className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-16 space-y-16">
        <header className="text-center space-y-4">
          <div className="flex justify-center items-center gap-3">
            <div className="size-1.5 rounded-full bg-[color:var(--earth-green)] animate-pulse" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Welcome, {name}
            </span>
          </div>
          <h1 className="font-serif text-5xl font-medium text-balance">
            Orient your contribution.
          </h1>
          <p className="text-muted-foreground max-w-[46ch] mx-auto text-pretty">
            The pillar you choose weights the Oracle's counsel and marks your presence in the Sanctum.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-6 py-8 border-y border-border/60 max-w-md mx-auto">
          <Indicator label="Planet Health" value={64} tone="var(--earth-green)" />
          <Indicator label="Human Flourishing" value={42} tone="var(--gold)" />
        </div>

        <div className="space-y-4">
          <div className="text-center text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Select your pillar
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PILLARS.map((p) => {
              const active = mission === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className="group relative p-5 rounded-md border text-left transition-all"
                  style={{
                    borderColor: active ? p.tone : "var(--border)",
                    background: active
                      ? `color-mix(in oklab, ${p.tone} 8%, transparent)`
                      : "color-mix(in oklab, var(--card) 60%, transparent)",
                  }}
                >
                  <div
                    className="text-sm font-medium"
                    style={{ color: active ? p.tone : "var(--foreground)" }}
                  >
                    {p.label}
                  </div>
                  <div className="mt-1 text-[10px] tracking-wide text-muted-foreground">
                    {p.blurb}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onEnter}
            disabled={save.isPending}
            className="py-4 px-10 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            Enter the Oracle
          </button>
          <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            {mission ? `Pillar: ${mission}` : "No pillar chosen"}
          </span>
        </div>
      </main>
    </div>
  );
}

function Indicator({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="space-y-2 text-left">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${value}%`, backgroundColor: `color-mix(in oklab, ${tone} 70%, transparent)` }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color: tone }}>
          {value}%
        </span>
      </div>
    </div>
  );
}