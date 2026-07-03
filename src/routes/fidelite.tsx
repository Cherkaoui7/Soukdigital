import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Sparkles, Gift, Truck, TicketPercent } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useAuth } from "@/lib/auth";
import { useI18n, type Locale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/fidelite")({
  component: LoyaltyPage,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Carte Zellige — Fidélité | Souk Digital" },
      {
        name: "description",
        content:
          "Cumulez des points sur chaque commande et débloquez les paliers Bronze, Argent et Or de la Carte Zellige.",
      },
    ],
  }),
});

type Tier = { key: "bronze" | "silver" | "gold"; min: number; color: string; glyph: string };

const TIERS: Tier[] = [
  { key: "bronze", min: 0, color: "hsl(28 55% 52%)", glyph: "◆" },
  { key: "silver", min: 500, color: "hsl(210 15% 70%)", glyph: "◈" },
  { key: "gold", min: 2000, color: "hsl(42 78% 55%)", glyph: "✦" },
];

function tierFor(points: number): Tier {
  return [...TIERS].reverse().find((t) => points >= t.min) ?? TIERS[0];
}

function LoyaltyPage() {
  const { user, loading } = useAuth();
  const { t, locale } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const profileQuery = useQuery({
    queryKey: ["loyalty-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, loyalty_points")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const txQuery = useQuery({
    queryKey: ["loyalty-tx", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_transactions")
        .select("id, points, reason, created_at, order_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 text-muted-foreground">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  const points = profileQuery.data?.loyalty_points ?? 0;
  const tier = tierFor(points);
  const nextTier = TIERS.find((tt) => tt.min > points);
  const progress = nextTier
    ? Math.min(100, Math.round(((points - tier.min) / (nextTier.min - tier.min)) * 100))
    : 100;
  const toNext = nextTier ? nextTier.min - points : 0;

  const localeCode = locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-secondary">
          <Sparkles className="h-3.5 w-3.5" />
          {t("loyalty.eyebrow")}
        </div>
        <h1 className="mt-1 font-display text-4xl font-bold text-foreground">
          {t("loyalty.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("loyalty.subtitle")}</p>

        {/* Card */}
        <div
          className="relative mt-8 overflow-hidden rounded-3xl border border-border p-6 sm:p-8 shadow-souk"
          style={{ background: "var(--gradient-majorelle)" }}
        >
          <div className="absolute inset-0 opacity-15 bg-moucharabieh" aria-hidden />
          <div className="relative flex flex-wrap items-start justify-between gap-6 text-primary-foreground">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] opacity-80">
                {t("loyalty.cardTitle")}
              </p>
              <p className="mt-1 font-display text-2xl font-bold">
                {profileQuery.data?.full_name || user.email}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold shadow-souk"
                  style={{ background: tier.color, color: "#1a1a1a" }}
                  aria-hidden
                >
                  {tier.glyph}
                </span>
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-80">
                    {t("loyalty.tier")}
                  </p>
                  <p className="font-display text-xl font-bold">
                    {t(`loyalty.tier.${tier.key}`)}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-end">
              <p className="text-xs uppercase tracking-wider opacity-80">
                {t("loyalty.points")}
              </p>
              <p className="font-display text-5xl font-bold leading-none">{points}</p>
              <p className="mt-1 text-xs opacity-80">{t("loyalty.pointsHint")}</p>
            </div>
          </div>

          {nextTier ? (
            <div className="relative mt-6 text-primary-foreground">
              <div className="flex justify-between text-xs opacity-90">
                <span>{t(`loyalty.tier.${tier.key}`)}</span>
                <span>
                  {toNext} {t("loyalty.pointsToNext")} {t(`loyalty.tier.${nextTier.key}`)}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/25 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, background: "hsl(42 78% 60%)" }}
                />
              </div>
            </div>
          ) : (
            <p className="relative mt-6 text-sm text-primary-foreground/90">
              {t("loyalty.topTier")}
            </p>
          )}
        </div>

        {/* Tier grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {TIERS.map((tt) => {
            const active = tt.key === tier.key;
            return (
              <div
                key={tt.key}
                className={`rounded-2xl border p-5 ${
                  active
                    ? "border-primary bg-primary/5 shadow-souk"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
                    style={{ background: tt.color, color: "#1a1a1a" }}
                    aria-hidden
                  >
                    {tt.glyph}
                  </span>
                  <div>
                    <p className="font-display text-lg font-bold">
                      {t(`loyalty.tier.${tt.key}`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tt.min}+ {t("loyalty.pts")}
                    </p>
                  </div>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Gift className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    {t(`loyalty.perk.${tt.key}.1`)}
                  </li>
                  <li className="flex items-start gap-2">
                    <TicketPercent className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    {t(`loyalty.perk.${tt.key}.2`)}
                  </li>
                  <li className="flex items-start gap-2">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    {t(`loyalty.perk.${tt.key}.3`)}
                  </li>
                </ul>
              </div>
            );
          })}
        </div>

        {/* History */}
        <h2 className="mt-12 font-display text-2xl font-bold">{t("loyalty.history")}</h2>
        {txQuery.data && txQuery.data.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <Award className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">{t("loyalty.noHistory")}</p>
            <Link
              to="/produits"
              className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              {t("cart.emptyCta")}
            </Link>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
            {txQuery.data?.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {tx.reason === "order"
                      ? t("loyalty.reason.order")
                      : tx.reason}
                    {tx.order_id ? (
                      <span className="ms-2 text-xs text-muted-foreground">
                        #{tx.order_id.slice(0, 8).toUpperCase()}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString(localeCode, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="font-display text-lg font-bold text-zellige">
                  +{tx.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
