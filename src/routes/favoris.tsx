import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductCard } from "@/components/site/ProductCard";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/favoris")({
  component: FavoritesPage,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mes favoris · Souk Digital" },
      { name: "description", content: "Retrouve tes coups de cœur du souk marocain." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function FavoritesPage() {
  const { user, loading } = useAuth();
  const { ids, isLoading } = useWishlist();
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const productIds = Array.from(ids);
  const { data: products } = useQuery({
    queryKey: ["wishlist-products", productIds],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
            <Heart className="h-5 w-5 fill-current" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold">{t("wishlist.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("wishlist.subtitle")}</p>
          </div>
        </div>

        {(isLoading || productIds.length === 0) && (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">{t("wishlist.empty")}</p>
            <Link to="/produits" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
              {t("cart.emptyCta")}
            </Link>
          </div>
        )}

        {products && products.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
