import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { getProductRecommendations } from "@/lib/recommendations.functions";
import { useI18n, type Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";

type Item = { id: string; slug: string; name: string; image_url: string | null; price_mad: number; reason: string };

export function ProductRecommendations({ productId }: { productId: string }) {
  const { t, locale } = useI18n();
  const fn = useServerFn(getProductRecommendations);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fn({ data: { productId, locale: locale as Locale, limit: 4 } })
      .then((r) => { if (!cancelled) setItems(r.items); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId, locale, fn]);

  if (!loading && items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 border-t border-border">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
            <Sparkles className="h-3.5 w-3.5" /> {t("reco.eyebrow")}
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-foreground">{t("reco.title")}</h2>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {(loading ? Array.from({ length: 4 }) : items).map((it, i) => {
          if (loading) {
            return <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse" />;
          }
          const item = it as Item;
          return (
            <Link
              key={item.id}
              to="/produits/$slug"
              params={{ slug: item.slug }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-souk"
            >
              <div className="aspect-square overflow-hidden bg-muted">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="line-clamp-1 font-display text-base font-semibold text-foreground">{item.name}</h3>
                <p className="line-clamp-2 text-xs italic text-muted-foreground">"{item.reason}"</p>
                <p className="mt-auto font-display text-lg font-bold text-primary">
                  {formatPrice(item.price_mad, locale as Locale)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
