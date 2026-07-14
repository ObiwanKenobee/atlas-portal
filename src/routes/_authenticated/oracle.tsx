import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { askOracle, getProfile } from "@/lib/oracle.functions";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How can Nairobi become more climate-resilient?",
  "Design a regenerative food system for a city of 2 million.",
  "What must a river be given back to heal?",
  "How do we decouple prosperity from extraction?",
];

export const Route = createFileRoute("/_authenticated/oracle")({
  head: () => ({ meta: [{ title: "The Oracle — Atlas Sanctum" }] }),
  component: OraclePage,
});

function OraclePage() {
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getProfile);
  const ask = useServerFn(askOracle);
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await ask({
        data: {
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          mission: (profile.data?.mission as "build" | "learn" | "restore" | "serve" | null) ?? null,
        },
      });
      setMessages([...next, { role: "assistant", content: res.text }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The Oracle could not respond.");
      setMessages(next);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      <div className="observatory-glow fixed inset-0 pointer-events-none" />
      <div className="constellation-grid fixed inset-0 pointer-events-none opacity-15" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-border/60">
        <div className="flex items-center gap-4">
          <Link to="/sanctum" className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-foreground">
            ← Sanctum
          </Link>
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            The Oracle
          </span>
        </div>
        <button onClick={signOut} className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground">
          Sign out
        </button>
      </nav>

      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Side rail */}
        <aside className="hidden lg:flex w-64 border-r border-border/60 p-8 flex-col gap-8 shrink-0">
          <div className="aspect-square rounded-full border border-border/60 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-4 rounded-full border border-[color:var(--gold)]/20 animate-pulse" />
            <div className="absolute inset-10 rounded-full border border-[color:var(--earth-green)]/30" />
            <div className="size-2 rounded-full bg-[color:var(--gold)]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Active Context</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {profile.data?.display_name ?? "Seeker"} — pillar of {profile.data?.mission ?? "—"}.
            </p>
          </div>
          <div className="pt-6 border-t border-border/60 space-y-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="size-1 rounded-full bg-[color:var(--earth-green)]" />
              <span>Biosphere: stable</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-1 rounded-full bg-[color:var(--gold)]" />
              <span>Horizon: 2050</span>
            </div>
          </div>
        </aside>

        {/* Conversation */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-12 py-12">
            <div className="max-w-3xl mx-auto space-y-12">
              {messages.length === 0 && !loading && <EmptyState />}
              {messages.map((m, i) => (
                <MessageBlock key={i} message={m} />
              ))}
              {loading && <ThinkingBlock />}
            </div>
          </div>

          <div className="border-t border-border/60 px-6 md:px-12 py-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="px-3 py-1.5 rounded-full border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-[color:var(--gold)]/40 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="relative"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder="Inquire of the Sanctum…"
                  rows={3}
                  className="w-full bg-input border border-border rounded-xl p-5 pr-32 text-sm resize-none focus:outline-none focus:border-[color:var(--gold)]/50 placeholder:text-muted-foreground/60"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute bottom-4 right-4 py-2 px-4 rounded-lg bg-foreground text-background text-xs font-semibold disabled:opacity-40"
                >
                  {loading ? "…" : "Ask Oracle"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center space-y-4 py-24">
      <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
        The Oracle listens
      </span>
      <h2 className="font-serif text-4xl font-medium text-balance">
        Ask any question that matters.
      </h2>
      <p className="text-muted-foreground max-w-[42ch] mx-auto text-pretty">
        Cities, ecosystems, energy, meaning — the Oracle answers through the lens of living systems.
      </p>
    </div>
  );
}

function ThinkingBlock() {
  return (
    <div className="space-y-3 animate-pulse">
      <span className="text-[10px] tracking-[0.25em] uppercase text-[color:var(--earth-green)]/80">
        Consulting the Sanctum
      </span>
      <div className="h-3 w-2/3 bg-muted rounded" />
      <div className="h-3 w-1/2 bg-muted rounded" />
      <div className="h-3 w-3/4 bg-muted rounded" />
    </div>
  );
}

function MessageBlock({ message }: { message: Msg }) {
  if (message.role === "user") {
    return (
      <div className="space-y-2">
        <span className="text-[10px] tracking-[0.25em] uppercase text-[color:var(--gold)]/80">
          Seeker
        </span>
        <p className="font-serif text-2xl leading-snug text-foreground text-pretty">
          {message.content}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <span className="text-[10px] tracking-[0.25em] uppercase text-[color:var(--earth-green)]/80">
        Oracle Response
      </span>
      <OracleMarkdown text={message.content} />
    </div>
  );
}

// Minimal markdown-ish renderer for ## / ### / numbered / paragraphs.
function OracleMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/);
  return (
    <div className="space-y-5 text-[15px] leading-relaxed text-foreground/90">
      {blocks.map((block, i) => {
        if (block.startsWith("### ")) {
          const label = block.slice(4).split("\n")[0];
          const body = block.split("\n").slice(1).join("\n");
          const tone = /impact/i.test(label)
            ? "var(--ocean)"
            : /path/i.test(label)
              ? "var(--earth-green)"
              : "var(--gold)";
          return (
            <div key={i} className="space-y-2 border-t border-border/60 pt-4">
              <h4
                className="text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: tone }}
              >
                {label}
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{body}</p>
            </div>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h3 key={i} className="font-serif text-2xl md:text-3xl font-medium text-foreground leading-snug text-balance">
              {block.slice(3)}
            </h3>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {block}
          </p>
        );
      })}
    </div>
  );
}