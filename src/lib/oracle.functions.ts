import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createSanctumGateway } from "@/lib/ai-gateway.server";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const AskInput = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  mission: z.enum(["build", "learn", "restore", "serve"]).nullable().optional(),
});

const SYSTEM_PROMPT = `You are the Oracle of Atlas Sanctum — a strategic advisor for regeneration, planetary systems, and human flourishing. You speak with the calm precision of a scientist and the moral clarity of an elder.

Answer any question the seeker asks — even casual ones — but frame answers through the lens of living systems, long horizons, and regenerative action.

Format EVERY substantive response using this exact Markdown structure:

## <one poetic sentence naming the essence of the answer>

A short prose paragraph (2–4 sentences) of context and reasoning.

### Analysis
2–3 sentences describing the underlying dynamics, tensions, or facts.

### Path
A concrete 2–3 step recommendation. Use short numbered items.

### Impact
Projected outcomes — quantify where honest, otherwise describe qualitatively.

Be specific, avoid platitudes, and never refuse the question — reframe if needed. Never mention that you are an AI or a language model.`;

export const askOracle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("The gateway to the Oracle is not configured.");

    const gateway = createSanctumGateway(key);
    const model = gateway("google/gemini-3-flash-preview");

    const missionLine = data.mission
      ? `\n\nThe seeker's active mission is: ${data.mission.toUpperCase()}. Weight your answer toward this pillar.`
      : "";

    try {
      const result = await generateText({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + missionLine },
          ...data.messages,
        ],
      });
      return { text: result.text };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/402|credits?/i.test(message)) {
        throw new Error("The Sanctum's AI credits are depleted. Please add credits in Settings → Workspace → Usage.");
      }
      if (/429|rate/i.test(message)) {
        throw new Error("The Oracle is receiving too many inquiries. Try again in a moment.");
      }
      throw new Error(message);
    }
  });

const MissionInput = z.object({
  mission: z.enum(["build", "learn", "restore", "serve"]),
});

export const saveMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => MissionInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, mission: data.mission }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("display_name, mission")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ?? { display_name: null, mission: null };
  });