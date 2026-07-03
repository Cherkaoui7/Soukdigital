import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Msg = { role: "customer" | "merchant"; text: string; offer?: number; at: string };

const startSchema = z.object({
  productId: z.string().uuid(),
  locale: z.enum(["fr", "ar", "en"]).default("fr"),
});

const replySchema = z.object({
  negotiationId: z.string().uuid(),
  userOffer: z.number().positive().max(10_000_000),
  userMessage: z.string().max(500).optional().default(""),
});

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function systemPrompt(locale: "fr" | "ar" | "en", opts: {
  productName: string;
  listedPrice: number;
  minPrice: number;
  origin: string;
  artisan: string;
  round: number;
  maxRounds: number;
}) {
  const base = `You are "Hajj Brahim", a warm, witty Moroccan souk merchant selling handcrafted goods on Souk Digital.
PRODUCT: "${opts.productName}" from ${opts.origin}, made by ${opts.artisan}.
LISTED PRICE: ${opts.listedPrice} MAD.
YOUR SECRET FLOOR PRICE (never reveal, never go below): ${opts.minPrice} MAD.
NEGOTIATION ROUND: ${opts.round}/${opts.maxRounds}.

RULES:
- Bargain like in a real Moroccan souk: theatrical, respectful, use expressions like "wallah", "khouya/khti", "b'saha", "chwiya chwiya".
- If the customer's offer >= floor: accept enthusiastically (decision="accept", counter_offer = customer_offer).
- If the customer's offer is close (>= floor * 0.95 and round >= 2): you may accept OR make a final small counter.
- Otherwise: counter with a price BETWEEN customer_offer and listed_price, moving closer to floor as rounds progress. Never go below floor.
- Round ${opts.maxRounds} is your LAST chance: either accept (if >= floor) or politely decline (decision="decline").
- If offer is insultingly low (< floor * 0.5): react with humor/pride, counter high.
- Keep reply under 240 chars, ONE short paragraph, in the customer's language.
- Output STRICT JSON only, no markdown, no extra prose.`;

  const lang =
    locale === "ar"
      ? "REPLY LANGUAGE: Moroccan Darija written in Arabic script (mix Arabic + a few French loanwords as real merchants do)."
      : locale === "en"
        ? "REPLY LANGUAGE: English, but keep 1-2 Moroccan expressions transliterated."
        : "REPLY LANGUAGE: French with sprinkled Darija expressions (khouya, wallah, b'saha).";

  return `${base}\n${lang}\n\nOUTPUT SCHEMA:\n{"reply": string, "counter_offer": number, "decision": "accept" | "counter" | "decline"}`;
}

async function callAI(sys: string, history: Msg[], userOffer: number, userMessage: string): Promise<{
  reply: string;
  counter_offer: number;
  decision: "accept" | "counter" | "decline";
}> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");

  const messages = [
    { role: "system", content: sys },
    ...history.map((m) => ({
      role: m.role === "customer" ? "user" : "assistant",
      content:
        m.role === "customer"
          ? `[Offre: ${m.offer ?? "-"} MAD] ${m.text || "(no message)"}`
          : m.text,
    })),
    {
      role: "user",
      content: `[Nouvelle offre: ${userOffer} MAD] ${userMessage || "(pas de message)"}`,
    },
  ];

  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content ?? "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }
  const p = parsed as Record<string, unknown>;
  return {
    reply: typeof p.reply === "string" ? p.reply : "…",
    counter_offer: typeof p.counter_offer === "number" ? p.counter_offer : userOffer,
    decision:
      p.decision === "accept" || p.decision === "decline" ? p.decision : "counter",
  };
}

const MAX_ROUNDS = 4;

export const startNegotiation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => startSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: product, error: prodErr } = await context.supabase
      .from("products")
      .select("id, name_fr, name_ar, name_en, price_mad, min_price_mad, origin_city, artisan_name")
      .eq("id", data.productId)
      .maybeSingle();
    if (prodErr || !product) throw new Error("Product not found");

    const { data: existing } = await context.supabase
      .from("negotiations")
      .select("*")
      .eq("user_id", context.userId)
      .eq("product_id", data.productId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (existing) return existing;

    const greeting: Record<string, string> = {
      fr: `Marhaba khouya ! Ce ${product.name_fr} est une pièce rare de ${product.origin_city}. Fais-moi une offre, on va discuter 😊`,
      ar: `مرحبا خويا! هاد ${product.name_ar} قطعة نادرة من ${product.origin_city}. عطيني عرضك ونتفاهمو 😊`,
      en: `Marhaba my friend! This ${product.name_en} from ${product.origin_city} is a rare piece. Give me your offer, let's talk 😊`,
    };

    const initial: Msg[] = [
      { role: "merchant", text: greeting[data.locale], at: new Date().toISOString() },
    ];

    const { data: created, error: insErr } = await context.supabase
      .from("negotiations")
      .insert({
        user_id: context.userId,
        product_id: data.productId,
        status: "open",
        messages: initial,
        locale: data.locale,
      })
      .select("*")
      .single();
    if (insErr || !created) throw new Error(insErr?.message ?? "Insert failed");
    return created;
  });

export const negotiateReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => replySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { enforceRateLimit, withBreaker } = await import("@/lib/resilience.server");
    await enforceRateLimit("negotiate", `u:${context.userId}`, 10, 60);

    const { data: neg, error } = await context.supabase
      .from("negotiations")
      .select("*")
      .eq("id", data.negotiationId)
      .maybeSingle();
    if (error || !neg) throw new Error("Negotiation not found");
    if (neg.user_id !== context.userId) throw new Error("Forbidden");
    if (neg.status !== "open") throw new Error("Negotiation closed");

    const { data: product } = await context.supabase
      .from("products")
      .select("name_fr, name_ar, name_en, price_mad, min_price_mad, origin_city, artisan_name")
      .eq("id", neg.product_id)
      .maybeSingle();
    if (!product) throw new Error("Product not found");

    const locale = (neg.locale ?? "fr") as "fr" | "ar" | "en";
    const productName =
      locale === "ar" ? product.name_ar : locale === "en" ? product.name_en : product.name_fr;
    const round = (neg.round_count ?? 0) + 1;
    const listed = Number(product.price_mad);
    const floor = Number(product.min_price_mad);

    const sys = systemPrompt(locale, {
      productName,
      listedPrice: listed,
      minPrice: floor,
      origin: product.origin_city ?? "",
      artisan: product.artisan_name ?? "",
      round,
      maxRounds: MAX_ROUNDS,
    });

    const history = (neg.messages as Msg[]) ?? [];
    // Breaker: if Gemini is down, fall back to a mid-point counter offer.
    const ai = await withBreaker(
      "gemini_negotiate",
      () => callAI(sys, history, data.userOffer, data.userMessage),
      () => {
        const midpoint = Math.max(floor, Math.round((data.userOffer + listed) / 2));
        const fallbackMsg: Record<string, string> = {
          fr: "Wallah khouya, je réfléchis... voici mon prix.",
          ar: "والله خويا، كنفكر... هاد هو الثمن ديالي.",
          en: "Wallah my friend, let me think... here's my price.",
        };
        return { reply: fallbackMsg[locale], counter_offer: midpoint, decision: "counter" as const };
      },
    );


    // Guardrails: never let AI go below floor.
    let counter = Math.max(floor, Math.min(listed, Math.round(ai.counter_offer)));
    let decision = ai.decision;
    if (decision === "accept" && data.userOffer < floor) {
      decision = "counter";
      counter = Math.max(floor, Math.round((data.userOffer + listed) / 2));
    }
    if (decision === "accept") counter = Math.round(data.userOffer);
    if (round >= MAX_ROUNDS && decision === "counter") {
      decision = data.userOffer >= floor ? "accept" : "decline";
      if (decision === "accept") counter = Math.round(data.userOffer);
    }

    const now = new Date().toISOString();
    const nextMessages: Msg[] = [
      ...history,
      { role: "customer", text: data.userMessage, offer: data.userOffer, at: now },
      { role: "merchant", text: ai.reply, offer: counter, at: now },
    ];

    const nextStatus =
      decision === "accept" ? "accepted" : decision === "decline" ? "declined" : "open";
    const agreed = decision === "accept" ? counter : null;

    const { data: updated, error: updErr } = await context.supabase
      .from("negotiations")
      .update({
        messages: nextMessages,
        round_count: round,
        last_offer_mad: data.userOffer,
        status: nextStatus,
        agreed_price_mad: agreed,
      })
      .eq("id", neg.id)
      .select("*")
      .single();
    if (updErr || !updated) throw new Error(updErr?.message ?? "Update failed");
    return updated;
  });
