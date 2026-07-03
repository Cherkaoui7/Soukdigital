import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, Handshake } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useCart } from "@/lib/cart";
import { useI18n, type Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/panier")({
  component: CartPage,
  ssr: false,
});

function CartPage() {
  const { items, updateQty, remove, subtotal, count } = useCart();
  const { t, locale } = useI18n();
  const shipping = subtotal > 500 || subtotal === 0 ? 0 : 40;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <h1 className="font-display text-4xl font-bold text-foreground">{t("cart.title")}</h1>
        <p className="mt-2 text-muted-foreground">{count} {count > 1 ? "articles" : "article"}</p>

        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg text-muted-foreground">{t("cart.empty")}</p>
            <Link
              to="/produits"
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {t("cart.emptyCta")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {items.map((item) => (
                <article key={item.productId} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
                  <Link to="/produits/$slug" params={{ slug: item.slug }} className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                    {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link to="/produits/$slug" params={{ slug: item.slug }} className="font-display text-lg font-semibold text-foreground hover:text-primary line-clamp-2">
                      {item.name}
                    </Link>
                    {item.negotiationId && item.originalPrice && item.originalPrice > item.price ? (
                      <p className="mt-1 flex items-center gap-2 text-sm">
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-bold text-secondary">
                          <Handshake className="h-3 w-3" /> {t("cart.negotiated")}
                        </span>
                        <span className="font-semibold text-primary">{formatPrice(item.price, locale as Locale)}</span>
                        <span className="text-muted-foreground line-through">{formatPrice(item.originalPrice, locale as Locale)}</span>
                        <span className="text-muted-foreground">× {item.quantity}</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">{formatPrice(item.price, locale as Locale)} × {item.quantity}</p>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-full border border-border bg-background">
                        <button
                          onClick={() => updateQty(item.productId, item.quantity - 1)}
                          className="p-2 hover:text-primary"
                          aria-label="-"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.productId, item.quantity + 1)}
                          className="p-2 hover:text-primary"
                          aria-label="+"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(item.productId)}
                        className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> {t("cart.remove")}
                      </button>
                    </div>
                  </div>
                  <p className="font-display text-lg font-bold text-primary self-start">
                    {formatPrice(item.price * item.quantity, locale as Locale)}
                  </p>
                </article>
              ))}
            </div>

            <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
              <h2 className="font-display text-xl font-bold">Récapitulatif</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("cart.subtotal")}</dt>
                  <dd className="font-medium">{formatPrice(subtotal, locale as Locale)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("cart.shipping")}</dt>
                  <dd className="font-medium">{shipping === 0 ? t("cart.shippingFree") : formatPrice(shipping, locale as Locale)}</dd>
                </div>
                <div className="mt-3 flex justify-between border-t border-border pt-3">
                  <dt className="font-display text-lg font-bold">{t("cart.total")}</dt>
                  <dd className="font-display text-lg font-bold text-primary">{formatPrice(total, locale as Locale)}</dd>
                </div>
              </dl>
              <Link
                to="/commande"
                className="mt-6 flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-souk hover:opacity-90"
              >
                {t("cart.checkout")}
              </Link>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Paiement à la livraison disponible
              </p>
            </aside>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
