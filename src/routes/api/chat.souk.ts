import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type ChatMsg = { role: "user" | "assistant"; content: string };

type Body = {
  messages: ChatMsg[];
  locale?: "fr" | "ar" | "en";
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

function systemPrompt(
  locale: "fr" | "ar" | "en",
  ctx: { products: string; artisans: string; categories: string },
) {
  const langLabel =
    locale === "ar" ? "Moroccan Darija (Arabic script)" : locale === "en" ? "English" : "French";
  return `You are "Lalla Aïcha", a friendly Moroccan shopping guide for Souk Digital — an e-commerce marketplace of authentic Moroccan crafts.

Personality: warm, welcoming, curious about the visitor's needs, occasional Moroccan expressions ("b'saha", "khouya", "khti", "inchallah"). Never pushy.

Your job:
- Help visitors discover products, artisans and categories.
- Recommend items from the CATALOG below (use exact product names).
- Explain origin cities (Fès, Marrakech, Taliouine…), artisan know-how, materials.
- Answer questions about payment (COD / CMI), Amana delivery, loyalty (Carte Zellige), negotiation.
- If a product fits, suggest visiting its page: /produits/<slug>.
- Suggest /artisans/<slug> for maâlem profiles.

Rules:
- Reply ONLY in ${langLabel}.
- Keep answers short (2–4 sentences), scannable, no long lists unless asked.
- Never invent prices, stock or products not in the CATALOG.
- If unsure, invite them to browse /produits or ask a more specific question.

CATALOG — CATEGORIES:
${ctx.categories}

CATALOG — TOP PRODUCTS (name — city — price MAD — /produits/slug):
${ctx.products}

CATALOG — ARTISANS (name — city — craft — /artisans/slug):
${ctx.artisans}`;
}

export const Route = createFileRoute("/api/chat/souk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Rate limit: 20 messages / minute per IP (or user if signed in).
        const { enforceRateLimit, getClientIdentifier, RateLimitError, withBreaker, CircuitOpenError } =
          await import("@/lib/resilience.server");
        try {
          await enforceRateLimit("chat_souk", getClientIdentifier(request), 20, 60);
        } catch (e) {
          if (e instanceof RateLimitError) {
            return new Response("Chwiya chwiya khouya, réessaie dans un instant 🙏", {
              status: 429,
              headers: { "Retry-After": String(e.retryAfter) },
            });
          }
          throw e;
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!Array.isArray(body.messages) || body.messages.length === 0) {
          return new Response("messages required", { status: 400 });
        }
        const messages = body.messages
          .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-12)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
        const locale = body.locale === "ar" || body.locale === "en" ? body.locale : "fr";

        // Fetch light catalog context using the anon key (public read policies).
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const nameField = locale === "ar" ? "name_ar" : locale === "en" ? "name_en" : "name_fr";

        const [prodRes, artRes, catRes] = await Promise.all([
          supabase
            .from("products")
            .select(`slug, price_mad, origin_city, name_fr, name_ar, name_en`)
            .order("featured", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("artisans")
            .select(`slug, city, name, craft_fr, craft_ar, craft_en`)
            .limit(20),
          supabase.from("categories").select(`slug, name_fr, name_ar, name_en`).limit(20),
        ]);

        const products = (prodRes.data ?? [])
          .map((p) => {
            const name = (p as Record<string, unknown>)[nameField] ?? p.name_fr;
            return `- ${name} — ${p.origin_city ?? "—"} — ${p.price_mad} MAD — /produits/${p.slug}`;
          })
          .join("\n");
        const artisans = (artRes.data ?? [])
          .map((a) => {
            const craft = (a as Record<string, unknown>)[`craft_${locale}`] ?? a.craft_fr;
            return `- ${a.name} — ${a.city} — ${craft} — /artisans/${a.slug}`;
          })
          .join("\n");
        const categories = (catRes.data ?? [])
          .map((c) => {
            const name = (c as Record<string, unknown>)[nameField] ?? c.name_fr;
            return `- ${name} — /produits?categorie=${c.slug}`;
          })
          .join("\n");


        const upstream = await withBreaker("gemini_chat", async () => {
          const r = await fetch(GATEWAY, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              stream: true,
              messages: [
                { role: "system", content: systemPrompt(locale, { products, artisans, categories }) },
                ...messages,
              ],
            }),
          });
          if (!r.ok || !r.body) throw new Error(`Gateway ${r.status}`);
          return r;
        }).catch((err) => {
          if (err instanceof CircuitOpenError) return null;
          throw err;
        });

        if (!upstream) {
          return new Response(
            locale === "ar"
              ? "السوق مشغول شوية، جرب من بعد 🙏"
              : locale === "en"
                ? "The souk is busy, please try again shortly 🙏"
                : "Le souk est un peu occupé, réessaie dans un instant 🙏",
            { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
          );
        }

        // Transform SSE chat.completions stream into a plain text stream of token deltas.
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const stream = new ReadableStream({
          async start(controller) {
            const reader = upstream.body!.getReader();
            let buffer = "";
            try {
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const raw of lines) {
                  const line = raw.trim();
                  if (!line.startsWith("data:")) continue;
                  const data = line.slice(5).trim();
                  if (!data || data === "[DONE]") continue;
                  try {
                    const json = JSON.parse(data);
                    const delta = json?.choices?.[0]?.delta?.content;
                    if (typeof delta === "string" && delta.length > 0) {
                      controller.enqueue(encoder.encode(delta));
                    }
                  } catch {
                    // ignore malformed chunks
                  }
                }
              }
            } catch (err) {
              controller.error(err);
              return;
            }
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
