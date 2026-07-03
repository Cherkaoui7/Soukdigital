import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Truck } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useI18n, type Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { sendOrderConfirmation } from "@/lib/emails.functions";


export const Route = createFileRoute("/commande")({
  component: CheckoutPage,
  ssr: false,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30),
  address: z.string().trim().min(5).max(255),
  city: z.string().trim().min(2).max(80),
  notes: z.string().trim().max(500).optional().default(""),
});

function CheckoutPage() {
  const { t, locale } = useI18n();
  const { items, subtotal, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", address: "", city: "", notes: "" });
  const [payment, setPayment] = useState<"cod" | "card">("cod");

  const shipping = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const total = subtotal + shipping;

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/commande" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone, city").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setForm((f) => ({
          ...f,
          full_name: data.full_name ?? f.full_name,
          phone: data.phone ?? f.phone,
          city: data.city ?? f.city,
        }));
      }
    });
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) return;
    if (items.length === 0) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError("Merci de vérifier vos informations.");
      return;
    }
    setSubmitting(true);
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending",
        payment_method: payment,
        total_mad: total,
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        address: parsed.data.address,
        city: parsed.data.city,
        notes: parsed.data.notes || null,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      setError(orderErr?.message ?? "Erreur");
      setSubmitting(false);
      return;
    }

    const { error: itemsErr } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        product_name: i.name,
        price_mad: i.price,
        quantity: i.quantity,
        image_url: i.image,
      })),
    );

    if (itemsErr) {
      setError(itemsErr.message);
      setSubmitting(false);
      return;
    }

    // Fire-and-forget confirmation email (silent no-op if Resend not configured)
    if (user.email) {
      void sendOrderConfirmation({
        data: {
          orderId: order.id,
          to: user.email,
          fullName: parsed.data.full_name,
          totalMad: total,
          paymentMethod: payment,
        },
      }).catch(() => {});
    }

    clear();
    if (payment === "card") {
      navigate({ to: "/paiement/cmi/$orderId", params: { orderId: order.id } });
      return;
    }
    setSuccess(order.id);
    setSubmitting(false);
  }


  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zellige/15 text-zellige">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-foreground">{t("checkout.success")}</h1>
          <p className="mt-2 text-muted-foreground">{t("checkout.successDesc")}</p>
          <p className="mt-1 text-xs text-muted-foreground">Réf. #{success.slice(0, 8).toUpperCase()}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/compte" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              {t("account.orders")}
            </Link>
            <Link to="/produits" className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted">
              {t("cart.emptyCta")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-20 text-center">
          <p className="text-muted-foreground">{t("cart.empty")}</p>
          <Link to="/produits" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            {t("cart.emptyCta")}
          </Link>
        </div>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <h1 className="font-display text-4xl font-bold text-foreground">{t("checkout.title")}</h1>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold">{t("checkout.contact")}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">{t("checkout.fullName")}</span>
                  <input required maxLength={100} className={`mt-1 ${inputCls}`} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">{t("checkout.phone")}</span>
                  <input required maxLength={30} className={`mt-1 ${inputCls}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+212 6..." />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold">{t("checkout.shipping")}</h2>
              <div className="mt-4 grid gap-4">
                <label className="block">
                  <span className="text-sm font-medium">{t("checkout.address")}</span>
                  <input required maxLength={255} className={`mt-1 ${inputCls}`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">{t("checkout.city")}</span>
                  <input required maxLength={80} className={`mt-1 ${inputCls}`} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Casablanca, Rabat, Fès…" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">{t("checkout.notes")}</span>
                  <textarea maxLength={500} rows={3} className={`mt-1 ${inputCls}`} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-bold">{t("checkout.payment")}</h2>
              <div className="mt-4 space-y-3">
                <label className={`flex cursor-pointer gap-4 rounded-xl border-2 p-4 ${payment === "cod" ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                  <input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} className="mt-1 accent-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Truck className="h-4 w-4 text-primary" /> {t("checkout.cod")}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{t("checkout.codDesc")}</p>
                  </div>
                </label>
                <label className={`flex cursor-pointer gap-4 rounded-xl border-2 p-4 ${payment === "card" ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                  <input type="radio" name="payment" checked={payment === "card"} onChange={() => setPayment("card")} className="mt-1 accent-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <span className="inline-flex h-4 w-6 items-center justify-center rounded bg-primary text-[9px] font-bold text-primary-foreground">CMI</span>
                      {t("checkout.cmi")}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{t("checkout.cmiDesc")}</p>
                  </div>
                </label>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-bold">Récapitulatif</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {items.map((i) => (
                <li key={i.productId} className="flex justify-between gap-3">
                  <span className="line-clamp-1 text-muted-foreground">{i.name} × {i.quantity}</span>
                  <span className="font-medium whitespace-nowrap">{formatPrice(i.price * i.quantity, locale as Locale)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("cart.subtotal")}</dt>
                <dd>{formatPrice(subtotal, locale as Locale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("cart.shipping")}</dt>
                <dd>{shipping === 0 ? t("cart.shippingFree") : formatPrice(shipping, locale as Locale)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-display text-lg font-bold">{t("cart.total")}</dt>
                <dd className="font-display text-lg font-bold text-primary">{formatPrice(total, locale as Locale)}</dd>
              </div>
            </dl>
            {error && <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-souk hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? t("common.loading") : t("checkout.place")}
            </button>
          </aside>
        </form>
      </div>

      <SiteFooter />
    </div>
  );
}
