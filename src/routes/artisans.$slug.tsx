import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductCard } from "@/components/site/ProductCard";
import { useI18n, type Locale } from "@/lib/i18n";

export const Route = createFileRoute("/artisans/$slug")({
  component: ArtisanDetail,
  ssr: false,
});

function ArtisanDetail() {
  const { slug } = Route.useParams();
  const { t, locale } = useI18n();
  const lang = locale as Locale;
  const craftField = lang === "ar" ? "craft_ar" : lang === "en" ? "craft_en" : "craft_fr";
  const bioField = lang === "ar" ? "bio_ar" : lang === "en" ? "bio_en" : "bio_fr";

  const artisanQuery = useQuery({
    queryKey: ["artisan", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const productsQuery = useQuery({
    queryKey: ["artisan-products", artisanQuery.data?.id],
    enabled: !!artisanQuery.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("artisan_id", artisanQuery.data!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (artisanQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 text-muted-foreground">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  const a = artisanQuery.data;
  if (!a) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
          <p className="text-muted-foreground">—</p>
          <Link
            to="/artisans"
            className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("artisans.backToList")}
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const craft = (a as unknown as Record<string, string>)[craftField];
  const bio = (a as unknown as Record<string, string | null>)[bioField];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section
        className="border-b border-border relative overflow-hidden"
        style={{ background: "var(--gradient-majorelle)" }}
      >
        <div className="absolute inset-0 bg-moucharabieh opacity-15" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 text-primary-foreground">
          <Link
            to="/artisans"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider opacity-90 hover:opacity-100"
          >
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            {t("artisans.backToList")}
          </Link>

          <div className="mt-6 flex flex-col md:flex-row md:items-end gap-6">
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl text-4xl font-display font-bold text-primary-foreground shadow-souk"
              style={{ background: "var(--gradient-terracotta)" }}
              aria-hidden
            >
              {a.name.trim().charAt(0)}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] opacity-90">
                ✦ {t("artisans.eyebrow")}
              </p>
              <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold">
                {a.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm opacity-95">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {a.city}
                  {a.region && <span className="opacity-80">· {a.region}</span>}
                </span>
                {a.years_experience !== null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    {a.years_experience} {t("artisans.experience")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {t("artisans.story")}
            </h2>
            <p className="mt-3 leading-relaxed text-foreground/85">
              {bio ?? "—"}
            </p>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 h-fit zellige-border">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("artisans.craft")}
              </dt>
              <dd className="mt-1 font-display text-lg font-semibold text-secondary">
                {craft}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("artisans.city")}
              </dt>
              <dd className="mt-1 font-medium text-foreground">{a.city}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <h2 className="font-display text-2xl font-bold text-foreground">
          {t("artisans.productsBy")} {a.name}
        </h2>
        <div className="mt-6">
          {productsQuery.data && productsQuery.data.length === 0 && (
            <p className="text-muted-foreground">{t("artisans.noProducts")}</p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productsQuery.data?.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
