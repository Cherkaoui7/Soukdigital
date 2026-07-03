import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const InputSchema = z.object({
  productId: z.string().uuid(),
  locale: z.enum(["fr", "ar", "en"]).default("fr"),
  limit: z.number().int().min(1).max(8).default(4),
});

type Reco = { id: string; slug: string; name: string; image_url: string | null; price_mad: number; reason: string };

export const getProductRecommendations = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => InputSchema.parse(raw))
  .handler(async ({ data }): Promise<{ items: Reco[] }> => {
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anon) return { items: [] };
    const sb = createClient<Database>(url, anon, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    // Load current product
    const { data: current } = await sb
      .from("products")
      .select("id, category_id, artisan_id, origin_city, price_mad, name_fr, name_ar, name_en")
      .eq("id", data.productId)
      .maybeSingle();
    if (!current) return { items: [] };

    // Candidate pool: same category first, then same city, then everything
    const { data: pool } = await sb
      .from("products")
      .select("id, slug, name_fr, name_ar, name_en, description_fr, image_url, price_mad, category_id, artisan_id, origin_city")
      .gt("stock", 0)
      .neq("id", data.productId)
      .limit(30);
    if (!pool || pool.length === 0) return { items: [] };

    // Score by heuristics
    const scored = pool.map((p) => {
      let score = 0;
      if (p.category_id === current.category_id) score += 3;
      if (p.artisan_id === current.artisan_id) score += 2;
      if (p.origin_city === current.origin_city) score += 1;
      const priceDelta = Math.abs(Number(p.price_mad) - Number(current.price_mad));
      const priceScore = Math.max(0, 2 - priceDelta / Math.max(1, Number(current.price_mad)));
      return { p, score: score + priceScore };
    });
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, data.limit);

    // Try AI reasoning via Lovable Gateway (optional; fall back to heuristic reason)
    const aiKey = process.env.LOVABLE_API_KEY;
    const nameKey = data.locale === "ar" ? "name_ar" : data.locale === "en" ? "name_en" : "name_fr";
    const currentName = (current as any)[nameKey] ?? current.name_fr;

    let reasons: Record<string, string> = {};
    if (aiKey) {
      try {
        const { withBreaker } = await import("@/lib/resilience.server");
        reasons = await withBreaker(
          "gemini_reco",
          async () => {
            const prompt = `Tu es un guide de souk marocain. Le client regarde "${currentName}". Pour chacune de ces suggestions, donne UNE phrase courte (max 12 mots) expliquant pourquoi elle pourrait plaire, dans la langue: ${data.locale}. Réponds en JSON pur: {"reasons": {"<id>": "<phrase>"}}.
Suggestions:
${top.map((s) => `- ${s.p.id} :: ${(s.p as any)[nameKey] ?? s.p.name_fr}`).join("\n")}`;
            const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${aiKey}` },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
              }),
            });
            if (!res.ok) throw new Error(`AI ${res.status}`);
            const json = await res.json();
            const content = json?.choices?.[0]?.message?.content ?? "{}";
            return (JSON.parse(content)?.reasons ?? {}) as Record<string, string>;
          },
          () => ({}) as Record<string, string>,
        );
      } catch {
        // silent fallback
      }
    }


    const defaultReason =
      data.locale === "ar" ? "اختيار موصى به من السوق" : data.locale === "en" ? "Curated match from the souk" : "Coup de cœur du souk";

    const items: Reco[] = top.map((s) => ({
      id: s.p.id,
      slug: s.p.slug,
      name: (s.p as any)[nameKey] ?? s.p.name_fr,
      image_url: s.p.image_url,
      price_mad: Number(s.p.price_mad),
      reason: reasons[s.p.id] ?? defaultReason,
    }));

    return { items };
  });
