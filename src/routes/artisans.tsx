import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useI18n, type Locale } from "@/lib/i18n";

export const Route = createFileRoute("/artisans")({
  component: ArtisansPage,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nos artisans — Maâlems du Maroc | Souk Digital" },
      {
        name: "description",
        content:
          "Rencontrez les maâlems et coopératives marocaines qui façonnent chaque pièce du souk : Fès, Marrakech, Taliouine, Chefchaouen, Essaouira, Salé.",
      },
      { property: "og:title", content: "Nos artisans — Souk Digital" },
      {
        property: "og:description",
        content: "Ville, savoir-faire et histoire de chaque maâlem du souk.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-souk-artisans.jpg" },
      { property: "og:image:width", content: "1216" },
      { property: "og:image:height", content: "640" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/og-souk-artisans.jpg" },
    ],
    links: [{ rel: "canonical", href: "/artisans" }],

  }),
});

function ArtisansPage() {
  const { t, locale } = useI18n();
  const lang = locale as Locale;

  const query = useQuery({
    queryKey: ["artisans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
        .select("*")
        .order("featured", { ascending: false })
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const craftField = lang === "ar" ? "craft_ar" : lang === "en" ? "craft_en" : "craft_fr";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section
        className="border-b border-border relative overflow-hidden"
        style={{ background: "var(--gradient-majorelle)" }}
      >
        <div className="absolute inset-0 bg-moucharabieh opacity-15" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 text-primary-foreground">
          <p className="text-xs uppercase tracking-[0.3em] opacity-90">
            ✦ {t("artisans.eyebrow")}
          </p>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl font-bold">
            {t("artisans.title")}
          </h1>
          <p className="mt-4 max-w-2xl opacity-90 leading-relaxed">
            {t("artisans.subtitle")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {query.isLoading && (
          <p className="text-muted-foreground">{t("common.loading")}</p>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {query.data?.map((a) => (
            <Link
              key={a.id}
              to="/artisans/$slug"
              params={{ slug: a.slug }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-souk zellige-border"
            >
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl text-primary-foreground shadow-souk"
                style={{ background: "var(--gradient-terracotta)" }}
                aria-hidden
              >
                {a.name.trim().charAt(0)}
              </div>
              <h2 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                {a.name}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {a.city}
                {a.region && (
                  <span className="text-muted-foreground/70">· {a.region}</span>
                )}
              </p>
              <p className="mt-3 text-sm font-medium text-secondary">
                {(a as unknown as Record<string, string>)[craftField]}
              </p>
              {a.years_experience !== null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {a.years_experience} {t("artisans.experience")}
                </p>
              )}
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                {t("artisans.discover")}
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
