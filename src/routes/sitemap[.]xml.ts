import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/produits", changefreq: "daily", priority: "0.9" },
          { path: "/artisans", changefreq: "weekly", priority: "0.8" },
          { path: "/fidelite", changefreq: "monthly", priority: "0.4" },
          { path: "/auth", changefreq: "monthly", priority: "0.3" },
        ];

        try {
          const supabase = createClient<Database>(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
          );
          const [{ data: products }, { data: artisans }] = await Promise.all([
            supabase.from("products").select("slug, created_at").limit(2000),
            supabase.from("artisans").select("slug, updated_at").limit(500),
          ]);
          for (const p of products ?? []) {
            if (!p.slug) continue;
            entries.push({
              path: `/produits/${p.slug}`,
              changefreq: "weekly",
              priority: "0.7",
              lastmod: p.created_at ?? undefined,
            });
          }
          for (const a of artisans ?? []) {
            if (!a.slug) continue;
            entries.push({
              path: `/artisans/${a.slug}`,
              changefreq: "monthly",
              priority: "0.6",
              lastmod: a.updated_at ?? undefined,
            });
          }
        } catch {
          // fall back to static entries only
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
