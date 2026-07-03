import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Truck, MapPin, CheckCircle2, Clock } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Locale } from "@/lib/i18n";

export const Route = createFileRoute("/suivi/$tracking")({
  component: TrackingPage,
  ssr: false,
  head: ({ params }) => ({ meta: [{ title: `Suivi ${params.tracking} · Amana · Souk Digital` }] }),
});

type Step = { key: string; icon: typeof Package; date?: string };

function TrackingPage() {
  const { tracking } = Route.useParams();
  const { t, locale } = useI18n();

  const orderQuery = useQuery({
    queryKey: ["tracking", tracking],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, city, tracking_number, tracking_carrier, created_at, paid_at, full_name")
        .eq("tracking_number", tracking)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const order = orderQuery.data;
  const status = order?.status ?? "pending";
  const statusOrder = ["pending", "confirmed", "shipped", "delivered"] as const;
  const idx = statusOrder.indexOf(status as typeof statusOrder[number]);

  const steps: Step[] = [
    { key: "amana.step.registered", icon: Package, date: order?.created_at ?? undefined },
    { key: "amana.step.hub", icon: MapPin, date: order?.paid_at ?? undefined },
    { key: "amana.step.enroute", icon: Truck },
    { key: "amana.step.delivered", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">{t("nav.home")}</Link>
          <span className="text-accent">✦</span>
          <span className="text-foreground">{t("amana.title")}</span>
        </nav>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold">{t("amana.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("amana.carrier")} · {tracking}</p>
          </div>
        </div>

        {orderQuery.isLoading && <p className="mt-8 text-muted-foreground">{t("common.loading")}</p>}

        {!orderQuery.isLoading && !order && (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
            {t("amana.notFound")}
          </div>
        )}

        {order && (
          <div className="mt-8 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t("account.order")}</p>
                  <p className="font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {t(`account.status.${status}`)}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{t("amana.recipient")}</p>
                  <p className="font-medium">{order.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("checkout.city")}</p>
                  <p className="font-medium">{order.city}</p>
                </div>
              </div>
            </div>

            <ol className="relative space-y-4 border-s-2 border-border ps-6">
              {steps.map((s, i) => {
                const active = i <= idx || (i === 0);
                const current = i === idx || (idx < 0 && i === 0);
                const Icon = active ? s.icon : Clock;
                return (
                  <li key={s.key} className="relative">
                    <span className={`absolute -start-[34px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
                    }`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className={`font-display font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>
                      {t(s.key)} {current && <span className="ms-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent-foreground">{t("amana.current")}</span>}
                    </p>
                    {s.date && active && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.date).toLocaleString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
