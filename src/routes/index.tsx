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

const Particles = () => {
  const [particles, setParticles] = React.useState<Array<{id: number, left: string, top: string, delay: string, duration: string, size: string}>>([]);

  React.useEffect(() => {
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 15}s`,
      duration: `${10 + Math.random() * 10}s`,
      size: `${2 + Math.random() * 4}px`
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute bg-amber-200/40 rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animation: `float-up ${p.duration} linear infinite`,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

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
      <SiteHeader />      {/* HERO SECTION */}
      <section
        className="relative min-h-[100dvh] flex items-center overflow-hidden font-sans"
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 30%, #7c3aed 60%, #c2410c 100%)",
        }}
      >
        <Particles />
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none opacity-80" aria-hidden>
          {/* Radial gradients from demo */}
          <div className="absolute top-[80%] left-[20%] w-[1000px] h-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(217,119,6,0.25)_0%,transparent_50%)]" />
          <div className="absolute top-[20%] left-[80%] w-[1000px] h-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.2)_0%,transparent_50%)]" />
          {/* SVG Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M50 0L100 50L50 100L0 50z\' fill=\'none\' stroke=\'white\' stroke-width=\'1\'/%3E%3C/svg%3E')]" />
        </div>

        {/* Decorative stars */}
        <div className="absolute top-[10%] left-[5%] text-amber-400 opacity-30 text-2xl animate-float pointer-events-none" style={{ animationDelay: "0s" }}>✦</div>
        <div className="absolute top-[60%] left-[8%] text-amber-400 opacity-30 text-lg animate-float pointer-events-none" style={{ animationDelay: "2s" }}>✧</div>
        <div className="absolute bottom-[20%] right-[10%] text-amber-400 opacity-30 text-xl animate-float pointer-events-none" style={{ animationDelay: "4s" }}>✦</div>
        <div className="absolute top-[30%] right-[5%] text-amber-400 opacity-30 text-sm animate-float pointer-events-none" style={{ animationDelay: "1s" }}>✧</div>

        <div className="mx-auto grid max-w-[1400px] gap-20 px-8 py-24 lg:grid-cols-[1.1fr_1fr] items-center relative z-10 w-full">
          {/* LEFT — text */}
          <div className="text-white">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-[0.8rem] font-semibold uppercase tracking-[1.5px] backdrop-blur-md animate-hero-drop text-amber-300 mb-8" style={{ "--hero-delay": "0ms" } as React.CSSProperties}>
              <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_10px_#d97706] animate-pulse-gold" />
              Souk Digital • Fait au Maroc
            </div>

            {/* Title */}
            <h1 className="font-display text-5xl font-bold leading-[1.1] text-balance sm:text-6xl lg:text-[4.2rem] animate-hero-drop mb-6" style={{ "--hero-delay": "120ms" } as React.CSSProperties}>
              {t("hero.title")?.split(',').map((part: string, i: number, arr: string[]) => 
                i === arr.length - 1 ? (
                  <span key={i} className="text-amber-400 relative inline-block">
                    {part}
                    <span className="absolute bottom-1.5 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 to-transparent opacity-40 rounded-sm" />
                  </span>
                ) : (
                  <React.Fragment key={i}>{part},<br/></React.Fragment>
                )
              ) || "L'artisanat marocain, livré chez vous"}
            </h1>

            {/* Subtitle */}
            <p className="max-w-[520px] text-[1.15rem] leading-[1.7] text-white/75 animate-hero-drop mb-10" style={{ "--hero-delay": "240ms" } as React.CSSProperties}>
              {t("hero.subtitle")}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 animate-hero-drop mb-12" style={{ "--hero-delay": "340ms" } as React.CSSProperties}>
              <Link to="/produits" className="group relative overflow-hidden inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-amber-600 to-amber-400 px-9 py-4 text-base font-semibold text-gray-900 shadow-[0_8px_30px_rgba(217,119,6,0.4)] hover:shadow-[0_15px_40px_rgba(217,119,6,0.5)] hover:-translate-y-1 hover:scale-[1.02] active:scale-95 transition-all duration-400">
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-500 ease-out" />
                {t("hero.ctaPrimary")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180 group-hover:translate-x-1 transition-transform duration-400" />
              </Link>
              <Link to="/artisans" className="inline-flex items-center gap-2 rounded-full border-2 border-white/25 bg-white/10 px-9 py-4 text-base font-medium text-white backdrop-blur-md hover:bg-white/15 hover:border-amber-500 hover:-translate-y-1 transition-all duration-400">
                {t("hero.ctaSecondary")}
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-8 animate-hero-drop mb-8" style={{ "--hero-delay": "460ms" } as React.CSSProperties}>
              {[
                { icon: "✓", text: "Livraison partout au Maroc" },
                { icon: "✓", text: "Paiement sécurisé" },
                { icon: "✓", text: "500+ artisans partenaires" },
              ].map(({ icon, text }) => (
                <span key={text} className="flex items-center gap-2.5 text-[0.88rem] text-white/80 hover:text-white hover:translate-x-1 transition-all duration-400 cursor-default">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-amber-400 text-[0.7rem]">
                    {icon}
                  </span>
                  {text}
                </span>
              ))}
            </div>

            {/* Stars rating */}
            <div className="flex items-center gap-3 animate-hero-drop mb-10" style={{ "--hero-delay": "540ms" } as React.CSSProperties}>
              <div className="flex text-amber-400 text-base tracking-[2px]">★★★★★</div>
              <span className="text-[0.9rem] text-white/80"><strong className="text-white">4.9/5</strong> · 2 000+ avis clients</span>
            </div>

            {/* Stats row */}
            <div className="flex gap-12 border-t border-white/10 pt-8 animate-hero-drop" style={{ "--hero-delay": "620ms" } as React.CSSProperties}>
              {[
                { value: "1 200+", label: "Produits" },
                { value: "500+", label: "Artisans" },
                { value: "12", label: "Régions" },
              ].map(({ value, label }) => (
                <div key={label} className="text-left hover:-translate-y-1 transition-transform duration-400">
                  <div className="font-display text-[2.2rem] font-bold leading-none mb-1.5 bg-gradient-to-br from-white to-amber-400 bg-clip-text text-transparent">{value}</div>
                  <div className="text-[0.8rem] text-white/60 uppercase tracking-[1.5px]">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Visuals */}
          <div className="relative hidden lg:flex items-center justify-center min-h-[600px] animate-hero-drop" style={{ "--hero-delay": "180ms" } as React.CSSProperties}>
            
            <div className="relative w-full max-w-[480px] aspect-square mx-auto group">
              {/* Pulsing rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border-2 border-amber-500/25 animate-pulse-ring pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] rounded-full border-2 border-amber-500/25 animate-pulse-ring pointer-events-none" style={{ animationDelay: "1.3s" }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] rounded-full border-2 border-amber-500/25 animate-pulse-ring pointer-events-none" style={{ animationDelay: "2.6s" }} />

              {/* Main Circular Image */}
              <div className="w-full h-full rounded-full border-[4px] border-amber-500 overflow-hidden relative z-10 transition-transform duration-400 group-hover:scale-[1.02]" style={{boxShadow: "0 0 60px rgba(217, 119, 6, 0.3), 0 20px 60px rgba(0,0,0,0.3)"}}>
                <img
                  src="https://images.unsplash.com/photo-1539020140153-e479b8c22e70?auto=format&fit=crop&q=80&w=1000"
                  alt="Artisanat marocain"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Floating Card 1 */}
              <div className="float-item float-1">
                <img src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=100&h=100&fit=crop" alt="Client" />
                <div className="leading-[1.4]">
                  <p>"Magnifique zellige !"</p>
                  <small className="text-slate-500 font-normal">⭐⭐⭐⭐⭐ Amina, Casa</small>
                </div>
              </div>

              {/* Floating Card 2 */}
              <div className="float-item float-2">
                <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[1.3rem] shrink-0 bg-gradient-to-br from-amber-100 to-amber-200">🔥</div>
                <div className="leading-[1.4]">
                  <p>+1,200 ventes</p>
                  <small className="text-slate-500 font-normal">ce mois-ci</small>
                </div>
              </div>

              {/* Floating Card 3 */}
              <div className="float-item float-3">
                <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-[1.3rem] shrink-0 bg-gradient-to-br from-blue-100 to-blue-200">⭐</div>
                <div className="leading-[1.4]">
                  <p>"Livraison ultra rapide"</p>
                  <small className="text-slate-500 font-normal">Youssef, Rabat</small>
                </div>
              </div>

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
