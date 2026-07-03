import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useI18n, type Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/paiement/cmi/$orderId")({
  component: CmiPage,
  ssr: false,
  head: () => ({ meta: [{ title: "Paiement CMI · Souk Digital" }, { name: "robots", content: "noindex,nofollow" }] }),
});

function CmiPage() {
  const { orderId } = Route.useParams();
  const { t, locale } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ number: "", name: "", expiry: "", cvv: "" });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const orderQuery = useQuery({
    queryKey: ["cmi-order", orderId],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = form.number.replace(/\s/g, "");
    if (digits.length < 13 || !/^\d+$/.test(digits)) return setError(t("cmi.errInvalidNumber"));
    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) return setError(t("cmi.errInvalidExpiry"));
    if (!/^\d{3,4}$/.test(form.cvv)) return setError(t("cmi.errInvalidCvv"));
    if (form.name.trim().length < 3) return setError(t("cmi.errInvalidName"));

    setProcessing(true);
    // Simulated CMI 3DS: 1.6s think, then confirm order.
    await new Promise((r) => setTimeout(r, 1600));
    const { error: upErr } = await supabase
      .from("orders")
      .update({ payment_method: "card", status: "confirmed", paid_at: new Date().toISOString() })
      .eq("id", orderId);
    if (upErr) { setError(upErr.message); setProcessing(false); return; }
    setDone(true);
    setProcessing(false);
  }

  if (loading || !user || orderQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  const order = orderQuery.data;
  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center text-muted-foreground">{t("cmi.notFound")}</div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zellige/15 text-zellige">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold">{t("cmi.successTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("cmi.successDesc")}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/compte" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">{t("account.orders")}</Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CreditCard className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold">{t("cmi.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("cmi.subtitle")}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_260px]">
          <form onSubmit={pay} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium">{t("cmi.cardNumber")}</span>
              <input inputMode="numeric" required maxLength={23} value={form.number}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
                  setForm({ ...form, number: v });
                }}
                placeholder="4242 4242 4242 4242" className={`mt-1 font-mono ${inputCls}`} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">{t("cmi.cardName")}</span>
              <input required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`mt-1 ${inputCls}`} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium">{t("cmi.expiry")}</span>
                <input required placeholder="MM/AA" maxLength={5} value={form.expiry}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                    const v = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                    setForm({ ...form, expiry: v });
                  }}
                  className={`mt-1 font-mono ${inputCls}`} />
              </label>
              <label className="block">
                <span className="text-sm font-medium">CVV</span>
                <input required inputMode="numeric" maxLength={4} value={form.cvv}
                  onChange={(e) => setForm({ ...form, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  className={`mt-1 font-mono ${inputCls}`} />
              </label>
            </div>

            {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={processing}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-souk hover:opacity-90 disabled:opacity-50">
              <Lock className="h-4 w-4" />
              {processing ? t("cmi.processing") : `${t("cmi.pay")} ${formatPrice(Number(order.total_mad), locale as Locale)}`}
            </button>

            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-zellige" /> {t("cmi.secure")}
            </p>
          </form>

          <aside className="rounded-2xl border border-border bg-card p-5 h-fit">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("account.order")}</p>
            <p className="mt-1 font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">{t("cart.total")}</p>
              <p className="font-display text-2xl font-bold text-primary">{formatPrice(Number(order.total_mad), locale as Locale)}</p>
            </div>
            <div className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              {t("cmi.testHint")}
            </div>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
