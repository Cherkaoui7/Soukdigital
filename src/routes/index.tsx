import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  RefreshCw,
  MapPin,
  Users,
  Package,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductGridSkeleton, CategoryCardSkeleton } from "@/components/site/ProductSkeleton";
import { useI18n, localizedField, type Locale } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: HomePage,
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:image", content: "/og-souk-digital.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "640" },
      { property: "og:image:alt", content: "Souk Digital — artisanat marocain authentique" },
      { name: "twitter:image", content: "/og-souk-digital.jpg" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function HomePage() {
  const { t, locale } = useI18n();

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort");
      if (error) throw error;
      return data;
    },
  });

  const featuredQuery = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.32 0.2 275) 0%, oklch(0.42 0.18 260) 40%, oklch(0.5 0.16 30) 100%)",
        }}
      >
        {/* Animated gradient orbs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-pulse-gold" />
          <div
            className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-secondary/15 blur-3xl"
            style={{ animation: "souk-pulse-gold 3.5s ease-in-out infinite 1s" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary/10 blur-2xl" />
        </div>

        {/* Moucharabieh pattern */}
        <div
          aria-hidden
          className="absolute inset-0 bg-moucharabieh opacity-15 mix-blend-overlay pointer-events-none"
        />

        {/* Zellige geometric accents */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <svg
            className="absolute top-8 right-8 h-24 w-24 opacity-10 text-accent"
            viewBox="0 0 100 100"
            fill="none"
          >
            <polygon
              points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <polygon
              points="50,20 80,35 80,65 50,80 20,65 20,35"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
            <polygon
              points="50,35 65,42.5 65,57.5 50,65 35,57.5 35,42.5"
              stroke="currentColor"
              strokeWidth="0.8"
              fill="currentColor"
              fillOpacity="0.3"
            />
          </svg>
          <svg
            className="absolute bottom-12 left-6 h-16 w-16 opacity-10 text-white"
            viewBox="0 0 100 100"
            fill="none"
          >
            <rect
              x="10"
              y="10"
              width="80"
              height="80"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              transform="rotate(45 50 50)"
            />
            <rect
              x="25"
              y="25"
              width="50"
              height="50"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              transform="rotate(45 50 50)"
            />
          </svg>
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 py-20 lg:grid-cols-2 lg:py-28 items-center">
          {/* LEFT — text */}
          <div className="text-primary-foreground">
            {/* Eyebrow badge */}
            <p
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm animate-hero-drop"
              style={{ "--hero-delay": "0ms" } as React.CSSProperties}
            >
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              {t("hero.eyebrow")}
            </p>

            {/* Title */}
            <h1
              className="mt-5 font-display text-4xl font-bold leading-[1.15] text-balance sm:text-5xl lg:text-[3.5rem] animate-hero-drop"
              style={{ "--hero-delay": "120ms" } as React.CSSProperties}
            >
              {t("hero.title")}
            </h1>

            {/* Subtitle */}
            <p
              className="mt-6 max-w-md text-base leading-relaxed text-white/80 sm:text-lg animate-hero-drop"
              style={{ "--hero-delay": "240ms" } as React.CSSProperties}
            >
              {t("hero.subtitle")}
            </p>

            {/* CTAs */}
            <div
              className="mt-8 flex flex-wrap gap-3 animate-hero-drop"
              style={{ "--hero-delay": "340ms" } as React.CSSProperties}
            >
              <Link
                to="/produits"
                className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-bold text-accent-foreground shadow-glow-gold hover:shadow-[0_0_60px_-8px_oklch(0.78_0.14_82)] hover:scale-105 active:scale-95 transition-all duration-200"
              >
                {t("hero.ctaPrimary")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                to="/artisans"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-6 py-3 text-sm font-medium text-white/90 backdrop-blur-sm hover:bg-white/15 hover:border-white/30 transition-all duration-200"
              >
                {t("hero.ctaSecondary")}
              </Link>
            </div>

            {/* Trust signals */}
            <div
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 animate-hero-drop"
              style={{ "--hero-delay": "460ms" } as React.CSSProperties}
            >
              {[
                { icon: "✓", text: "Livraison partout au Maroc" },
                { icon: "✓", text: "Paiement sécurisé" },
                { icon: "✓", text: "500+ artisans partenaires" },
              ].map(({ icon, text }) => (
                <span
                  key={text}
                  className="flex items-center gap-1.5 text-xs text-white/70 font-medium"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/30 text-accent text-[10px] font-bold">
                    {icon}
                  </span>
                  {text}
                </span>
              ))}
            </div>

            {/* Stars rating */}
            <div
              className="mt-5 flex items-center gap-2 animate-hero-drop"
              style={{ "--hero-delay": "540ms" } as React.CSSProperties}
            >
              <div className="flex text-accent text-sm">★★★★★</div>
              <span className="text-xs text-white/60 font-medium">4.9/5 · 2 000+ avis clients</span>
            </div>

            {/* Stats row */}
            <div
              className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-8 animate-hero-drop"
              style={{ "--hero-delay": "620ms" } as React.CSSProperties}
            >
              {[
                { icon: Package, value: "1 200+", label: "Produits" },
                { icon: Users, value: "500+", label: "Artisans" },
                { icon: MapPin, value: "12", label: "Régions" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center">
                  <Icon className="mx-auto mb-1 h-4 w-4 text-accent/70" />
                  <p className="font-display text-2xl font-bold text-white">{value}</p>
                  <p className="text-[11px] text-white/55 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>

            {/* Zellige decorative bar */}
            <div
              className="mt-8 h-1.5 max-w-xs rounded-full zellige-border animate-zellige-spin"
              style={{ "--hero-delay": "700ms", transformOrigin: "center" } as React.CSSProperties}
            />
          </div>

          {/* RIGHT — images */}
          <div className="relative hidden lg:flex items-center justify-center">
            {/* Background Glow */}
            <div className="absolute inset-0 rounded-full bg-accent/20 blur-[100px]" aria-hidden />
            
            <div className="relative w-full max-w-[480px] aspect-square mx-auto animate-hero-drop" style={{ "--hero-delay": "180ms" } as React.CSSProperties}>
              {/* Main Circular Image */}
              <div className="w-full h-full rounded-full border-[6px] border-accent/80 overflow-hidden shadow-souk relative z-10 transition-transform duration-700 hover:scale-105" style={{boxShadow: "0 0 40px -10px var(--color-sabra)"}}>
                <img
                  src="https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&q=80&w=1000"
                  alt="Artisanat marocain"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Floating Pill 1 (Top Left) */}
              <div className="absolute top-10 -left-12 z-20 animate-float bg-white rounded-full shadow-xl pl-3 pr-6 py-3 flex items-center gap-4 w-max">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
                  <img src="https://i.pravatar.cc/100?img=47" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-[#1a2b3c]">"Magnifique zellige !"</p>
                  <div className="flex text-[#dea54b] text-sm mt-0.5">★★★★★</div>
                </div>
              </div>

              {/* Floating Pill 2 (Center Left) */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-20 z-20 animate-float-reverse bg-white rounded-full shadow-xl px-6 py-3.5 flex items-center gap-3 w-max" style={{ animationDelay: "1s" }}>
                <span className="text-2xl drop-shadow-sm">🔥</span>
                <div>
                  <p className="text-[15px] font-bold text-[#1a2b3c]">+1,200 vues</p>
                  <p className="text-xs text-gray-500 font-medium">cette semaine</p>
                </div>
              </div>

              {/* Floating Pill 3 (Bottom Right) */}
              <div className="absolute bottom-20 -right-12 z-20 animate-float bg-white rounded-full shadow-xl px-6 py-3.5 flex flex-col justify-center gap-0.5 w-max" style={{ animationDelay: "2s" }}>
                <p className="text-[15px] font-bold text-[#1a2b3c] text-right">"Livraison ultra rapide"</p>
                <div className="flex items-center justify-end gap-2">
                  <div className="flex text-[#dea54b] text-xs">★★★★★</div>
                  <span className="text-xs text-gray-600 font-medium">Youssef, Rabat</span>
                </div>
              </div>

              {/* Floating Icon (Bottom Right) */}
              
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
              {t("home.categoriesTitle")}
            </h2>
            <p className="mt-2 text-muted-foreground">Des souks du royaume à votre porte.</p>
          </div>
          <Link
            to="/produits"
            className="hidden text-sm font-semibold text-primary hover:underline sm:inline"
          >
            {t("common.viewAll")} →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categoriesQuery.isLoading &&
            Array.from({ length: 6 }).map((_, i) => <CategoryCardSkeleton key={i} />)}
          {categoriesQuery.data?.map((cat, i) => (
            <Link
              key={cat.id}
              to="/produits"
              search={{ category: cat.slug }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-souk hover:border-primary/30 animate-souk-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-transform duration-500 group-hover:rotate-45 ${
                  i % 3 === 0
                    ? "bg-primary/10 text-primary"
                    : i % 3 === 1
                      ? "bg-secondary/10 text-secondary"
                      : "bg-accent/20 text-accent-foreground"
                }`}
              >
                ✦
              </div>
              <p className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {localizedField(cat, locale as Locale, "name")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{cat.slug}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
              ★ {t("hero.eyebrow").split("·")[0]}
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold text-foreground sm:text-4xl">
              {t("home.featuredTitle")}
            </h2>
            <p className="mt-2 text-muted-foreground">{t("home.featuredSubtitle")}</p>
          </div>
          <Link
            to="/produits"
            className="hidden text-sm font-semibold text-primary hover:underline sm:inline"
          >
            {t("common.viewAll")} →
          </Link>
        </div>
        <div className="mt-8">
          {featuredQuery.isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featuredQuery.data?.map((p, i) => (
                <div
                  key={p.id}
                  className="animate-souk-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* VALUES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            {t("home.valuesTitle")}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, tk: "authentic" },
              { icon: Truck, tk: "cod" },
              { icon: Sparkles, tk: "delivery" },
              { icon: RefreshCw, tk: "return" },
            ].map(({ icon: Icon, tk }) => (
              <div key={tk} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-foreground">{t(`value.${tk}.title`)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t(`value.${tk}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
