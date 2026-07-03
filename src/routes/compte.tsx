import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Package, Sparkles, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PushOptInButton } from "@/components/site/PushOptInButton";
import { useAuth } from "@/lib/auth";
import { useI18n, type Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/compte")({
  component: AccountPage,
  ssr: false,
});

function AccountPage() {
  const { user, loading } = useAuth();
  const { t, locale } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const ordersQuery = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const loyaltyQuery = useQuery({
    queryKey: ["loyalty-profile-account", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("loyalty_points")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground">{t("account.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> {t("nav.signOut")}
          </button>
        </div>

        <Link
          to="/fidelite"
          className="mt-8 flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border p-5 text-primary-foreground shadow-souk transition-transform hover:scale-[1.01]"
          style={{ background: "var(--gradient-majorelle)" }}
        >
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-2xl font-bold"
            >
              ✦
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider opacity-90">
                <Sparkles className="h-3.5 w-3.5" /> {t("nav.loyalty")}
              </p>
              <p className="font-display text-xl font-bold">
                {loyaltyQuery.data?.loyalty_points ?? 0} {t("loyalty.pts")}
              </p>
              <p className="text-xs opacity-80">{t("account.loyalty")}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 opacity-80" />
        </Link>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <PushOptInButton />
          <span className="text-xs text-muted-foreground">Reçois promos, expéditions et nouveautés sur ton appareil.</span>
        </div>

        <h2 className="mt-10 font-display text-2xl font-bold">{t("account.orders")}</h2>


        {ordersQuery.data && ordersQuery.data.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">{t("account.noOrders")}</p>
            <Link to="/produits" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
              {t("cart.emptyCta")}
            </Link>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {ordersQuery.data?.map((order) => (
            <article key={order.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-bold">{t("account.order")} #{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  order.status === "delivered" ? "bg-zellige/15 text-zellige" :
                  order.status === "cancelled" ? "bg-destructive/10 text-destructive" :
                  "bg-accent/20 text-accent-foreground"
                }`}>
                  {t(`account.status.${order.status}`)}
                </span>
              </div>
              <ul className="mt-4 space-y-1 text-sm">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 text-muted-foreground">
                    <span className="line-clamp-1">{item.product_name} × {item.quantity}</span>
                    <span>{formatPrice(Number(item.price_mad) * item.quantity, locale as Locale)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">{order.city} · {order.payment_method === "cod" ? t("checkout.cod") : t("checkout.cmi")}</span>
                <span className="font-display text-lg font-bold text-primary">{formatPrice(Number(order.total_mad), locale as Locale)}</span>
              </div>
              {order.tracking_number && (
                <Link
                  to="/suivi/$tracking"
                  params={{ tracking: order.tracking_number }}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                >
                  <Package className="h-3.5 w-3.5" /> {t("amana.trackCta")} · {order.tracking_number}
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
