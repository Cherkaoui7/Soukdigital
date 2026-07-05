import React, { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Sparkles, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductReviews } from "@/components/site/ProductReviews";
import { ProductRecommendations } from "@/components/site/ProductRecommendations";
import { WishlistButton } from "@/components/site/WishlistButton";
import { useI18n, localizedField, type Locale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

const getLocalFallback = (productName: string) => {
  const n = productName.toLowerCase();
  if (n.includes("tapis")) return "/images/product-tapis.svg";
  if (n.includes("caftan")) return "/images/product-caftan.svg";
  if (n.includes("collier") || n.includes("bijou") || n.includes("bracelet")) return "/images/product-collier.svg";
  if (n.includes("lanterne") || n.includes("bougie") || n.includes("lustre")) return "/images/product-lanterne.svg";
  if (n.includes("babouche") || n.includes("chaussure")) return "/images/product-babouche.svg";
  if (n.includes("argan") || n.includes("cosmétique")) return "/images/product-argan.svg";
  if (n.includes("thé") || n.includes("théière") || n.includes("verre")) return "/images/product-teapot.svg";
  if (n.includes("zellige") || n.includes("carreau")) return "/images/product-zellige.svg";
  if (n.includes("pouf")) return "/images/product-pouf.svg";
  if (n.includes("safran")) return "/images/product-safran.svg";
  if (n.includes("amlou")) return "/images/product-amlou.svg";
  return "/images/product-placeholder.svg";
};

export const Route = createFileRoute("/produits/$slug")({
  component: ProductDetail,
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("products")
      .select("slug, name_fr, name_ar, name_en, description_fr, description_ar, description_en, image_url, price_mad, origin_city, stock")
      .eq("slug", params.slug)
      .maybeSingle();
    return { product: data };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.product;
    const title = p ? `${p.name_fr} · Souk Digital` : "Produit · Souk Digital";
    const rawDesc = p?.description_fr ?? "Artisanat marocain authentique sélectionné dans les souks du royaume.";
    const desc = rawDesc.length > 155 ? `${rawDesc.slice(0, 152)}…` : rawDesc;
    const ogImg = `/api/og/product/${params.slug}.png`;
    const img = p?.image_url ?? undefined;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "product" },
      { property: "og:url", content: `/produits/${params.slug}` },
      { property: "product:price:amount", content: p ? String(p.price_mad) : "" },
      { property: "product:price:currency", content: "MAD" },
      { property: "og:image", content: ogImg },
      { property: "og:image:width", content: "1536" },
      { property: "og:image:height", content: "1024" },
      { property: "og:image:alt", content: title },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: desc },
      { name: "twitter:image", content: ogImg },
    ];
    if (img) meta.push({ property: "og:image:secondary", content: img });
    return {
      meta,
      links: [{ rel: "canonical", href: `/produits/${params.slug}` }],
    };
  },
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { t, locale } = useI18n();
  const { add } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, artisan:artisans(id, slug, name, city)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
          <p className="text-muted-foreground">Produit introuvable.</p>
          <Link to="/produits" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("product.backToShop")}
          </Link>
        </div>
      </div>
    );
  }

  const name = localizedField(product, locale as Locale, "name");
  const description = localizedField(product, locale as Locale, "description");
  const outOfStock = product.stock <= 0;

  const fallbackSrc = getLocalFallback(name);
  const [imgSrc, setImgSrc] = useState(product.image_url || fallbackSrc);

  useEffect(() => {
    setImgSrc(product.image_url || fallbackSrc);
  }, [product.image_url, fallbackSrc]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: imgSrc ? [imgSrc] : undefined,
    brand: { "@type": "Brand", name: product.artisan?.name ?? "Souk Digital" },
    offers: {
      "@type": "Offer",
      priceCurrency: "MAD",
      price: Number(product.price_mad),
      availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Link to="/produits" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t("product.backToShop")}
        </Link>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 pb-16 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl bg-card border border-border">
          <img
            src={imgSrc}
            alt={name}
            onError={() => {
              if (imgSrc !== fallbackSrc) {
                setImgSrc(fallbackSrc);
              }
            }}
            className="w-full object-cover"
          />
          {product.old_price_mad && (
            <span className="absolute top-5 start-5 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
              PROMO
            </span>
          )}
        </div>

        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-secondary">
            <Sparkles className="h-3.5 w-3.5" /> {product.origin_city}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-foreground">{name}</h1>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold text-primary">
              {formatPrice(Number(product.price_mad), locale as Locale)}
            </span>
            {product.old_price_mad && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(Number(product.old_price_mad), locale as Locale)}
              </span>
            )}
          </div>

          <p className="mt-6 leading-relaxed text-foreground/85">{description}</p>

          <dl className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-card p-5 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t("product.origin")}</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-medium text-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" /> {product.origin_city}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t("product.artisan")}</dt>
              <dd className="mt-1 font-medium text-foreground">
                {product.artisan ? (
                  <Link
                    to="/artisans/$slug"
                    params={{ slug: product.artisan.slug }}
                    className="text-primary hover:underline"
                  >
                    {product.artisan.name}
                  </Link>
                ) : (
                  product.artisan_name
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">{t("product.stock")}</dt>
              <dd className={`mt-1 font-medium ${outOfStock ? "text-destructive" : "text-zellige"}`}>
                {outOfStock ? t("product.outOfStock") : `${product.stock} ${t("product.stock").toLowerCase()}`}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              disabled={outOfStock}
              onClick={() =>
                add({
                  productId: product.id,
                  slug: product.slug,
                  name,
                  price: Number(product.price_mad),
                  image: product.image_url,
                })
              }
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-souk hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              <ShoppingBag className="h-4 w-4" /> {t("product.addToCart")}
            </button>
            <button
              disabled={outOfStock}
              onClick={() => {
                add({
                  productId: product.id,
                  slug: product.slug,
                  name,
                  price: Number(product.price_mad),
                  image: product.image_url,
                });
                navigate({ to: "/panier" });
              }}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-glow-gold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {t("product.buyNow")}
            </button>
            <WishlistButton productId={product.id} variant="pill" />
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />
      <ProductRecommendations productId={product.id} />

      <SiteFooter />
    </div>
  );
}
