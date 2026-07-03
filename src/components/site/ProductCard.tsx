import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/format";
import { useI18n, localizedField, type Locale } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { ShoppingBag } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { WishlistButton } from "@/components/site/WishlistButton";

type Product = Tables<"products">;

export function ProductCard({ product }: { product: Product }) {
  const { t, locale } = useI18n();
  const { add } = useCart();
  const name = localizedField(product, locale as Locale, "name");
  const outOfStock = product.stock <= 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-card border border-border/60 transition-all hover:-translate-y-1 hover:shadow-souk">
      <div className="relative block aspect-[4/5] overflow-hidden bg-muted">
        {product.image_url ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img
            src={product.image_url}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <img
            src="/images/product-placeholder.svg"
            alt={name}
            className="h-full w-full object-cover"
          />
        )}
        {product.old_price_mad && (
          <span className="absolute top-3 start-3 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
            -
            {Math.round(
              ((Number(product.old_price_mad) - Number(product.price_mad)) /
                Number(product.old_price_mad)) *
                100,
            )}
            %
          </span>
        )}
        {product.featured && !product.old_price_mad && (
          <span className="absolute top-3 start-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
            ★ Souk
          </span>
        )}
        <WishlistButton productId={product.id} className="absolute top-3 end-3 z-10" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {product.origin_city}
        </p>
        <Link
          to="/produits/$slug"
          params={{ slug: product.slug }}
          className="mt-1 font-display text-lg font-semibold leading-tight text-foreground hover:text-primary transition-colors line-clamp-2 before:absolute before:inset-0"
        >
          {name}
        </Link>
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="font-display text-xl font-bold text-primary">
              {formatPrice(Number(product.price_mad), locale as Locale)}
            </p>
            {product.old_price_mad && (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(Number(product.old_price_mad), locale as Locale)}
              </p>
            )}
          </div>
          <button
            onClick={() =>
              add({
                productId: product.id,
                slug: product.slug,
                name,
                price: Number(product.price_mad),
                image: product.image_url,
              })
            }
            disabled={outOfStock}
            className="relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={outOfStock ? t("product.outOfStock") : t("product.addToCart")}
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
