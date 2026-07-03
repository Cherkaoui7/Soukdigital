import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/og/product/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = params.slug.replace(/\.(png|jpg|jpeg)$/i, "");
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const { data: product } = await supabase
          .from("products")
          .select("name_fr, description_fr, origin_city, price_mad")
          .eq("slug", slug)
          .maybeSingle();

        if (!product) return new Response("Not found", { status: 404 });

        const prompt = `Editorial social share cover, 3:2, deep majorelle blue background with subtle geometric zellige tile pattern, elegant gold-leaf frame. Foreground: a stylized artisanal Moroccan product representing "${product.name_fr}" from ${product.origin_city}, warm terracotta and saffron accents, soft rim light. Bold serif title text "${product.name_fr}" at top and a small "Souk Digital" wordmark at bottom-right. Photorealistic, luxurious craft magazine aesthetic. No people faces.`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-image-2",
            prompt,
            size: "1536x1024",
            quality: "low",
            n: 1,
          }),
        });

        if (!upstream.ok) {
          return new Response(await upstream.text(), { status: upstream.status });
        }
        const json = (await upstream.json()) as { data?: Array<{ b64_json?: string }> };
        const b64 = json.data?.[0]?.b64_json;
        if (!b64) return new Response("No image", { status: 502 });

        const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        return new Response(buf, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=604800, s-maxage=2592000, immutable",
          },
        });
      },
    },
  },
});
