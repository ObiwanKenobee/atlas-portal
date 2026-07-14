import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Enter the Sanctum — Atlas Sanctum" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/sanctum", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Sanctum opened. Check your email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/sanctum", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something obscured the entrance.");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/sanctum", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      <div className="observatory-glow absolute inset-0 pointer-events-none" />
      <div className="constellation-grid absolute inset-0 pointer-events-none opacity-20" />

      <nav className="relative z-10 px-8 py-6">
        <Link
          to="/"
          className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground"
        >
          ← Sanctum
        </Link>
      </nav>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md space-y-10">
          <header className="text-center space-y-3">
            <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              {mode === "signin" ? "Re-enter" : "Initiate"}
            </span>
            <h1 className="font-serif text-4xl font-medium">
              {mode === "signin" ? "Return to the Sanctum" : "Open the Sanctum"}
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              {mode === "signin"
                ? "Sign in to consult the Oracle."
                : "Create a seeker profile to begin."}
            </p>
          </header>

          <button
            onClick={onGoogle}
            disabled={loading}
            className="w-full py-3 rounded-md border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium disabled:opacity-50"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="sanctum-input"
                  placeholder="How you wish to be known"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sanctum-input"
                placeholder="you@earth.org"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="sanctum-input"
                placeholder="At least 6 characters"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {loading ? "…" : mode === "signin" ? "Enter" : "Open the Sanctum"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            {mode === "signin" ? "No profile yet? " : "Already a seeker? "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-foreground hover:text-[color:var(--gold)] transition-colors"
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </main>

      <style>{`
        .sanctum-input {
          width: 100%;
          background: var(--input);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: var(--foreground);
          outline: none;
          transition: border-color 150ms;
        }
        .sanctum-input::placeholder { color: var(--muted-foreground); opacity: 0.6; }
        .sanctum-input:focus { border-color: color-mix(in oklab, var(--gold) 60%, transparent); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}