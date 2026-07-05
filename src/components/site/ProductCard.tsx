import React from "react";
import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/format";
import { useI18n, localizedField, type Locale } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { ShoppingBag, MapPin, User, Clock, Tag } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { WishlistButton } from "@/components/site/WishlistButton";

type Product = Tables<"products">;

interface ProductStory {
  badge: string;
  badgeBg: string;
  materials: string;
  manufacturingTime: string;
  artisan: string;
}

function getProductStory(productName: string, originCity: string | null = null, artisanName: string | null = null): ProductStory {
  const name = productName.toLowerCase();
  
  let badge = "Fait main";
  let badgeBg = "bg-amber-50 text-amber-800 border border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50";
  let materials = "Matières naturelles";
  let manufacturingTime = "12h";
  let artisan = artisanName || "Maâlem certifié";

  if (name.includes("tapis") || name.includes("tissage") || name.includes("berbère") || name.includes("ouarain") || name.includes("azilal")) {
    badge = "Tissé main";
    badgeBg = "bg-purple-50 text-purple-800 border border-purple-200/50 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/50";
    materials = "Laine pure";
    manufacturingTime = "48h";
    artisan = artisan || "Fatima";
  } else if (name.includes("cuir") || name.includes("babouche") || name.includes("sac") || name.includes("chaussure")) {
    badge = "Cuir véritable";
    badgeBg = "bg-amber-50 text-amber-900 border border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50";
    materials = "Cuir naturel";
    manufacturingTime = "8h";
    artisan = artisan || "Youssef";
  } else if (name.includes("argan") || name.includes("huile") || name.includes("cosmétique") || name.includes("sérum")) {
    badge = "Bio 🌿";
    badgeBg = "bg-emerald-50 text-emerald-800 border border-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50";
    materials = "Argan bio";
    manufacturingTime = "4h";
    artisan = artisan || "Coopérative Essaouira";
  } else if (name.includes("lanterne") || name.includes("bougeoir") || name.includes("métal") || name.includes("cuivre") || name.includes("ajourée")) {
    badge = "Laiton ciselé";
    badgeBg = "bg-amber-50 text-amber-800 border border-amber-200/50 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50";
    materials = "Laiton ciselé";
    manufacturingTime = "16h";
    artisan = artisan || "Ahmed";
  } else if (name.includes("poterie") || name.includes("plat") || name.includes("tajine") || name.includes("céramique")) {
    badge = "Coopérative 🏆";
    badgeBg = "bg-blue-50 text-blue-800 border border-blue-200/50 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50";
    materials = "Argile de Safi";
    manufacturingTime = "14h";
    artisan = artisan || "Mourad";
  } else if (name.includes("caftan") || name.includes("broderie") || name.includes("tunique") || name.includes("robe")) {
    badge = "Édition limitée";
    badgeBg = "bg-rose-50 text-rose-800 border border-rose-200/50 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50";
    materials = "Soie & fil d'or";
    manufacturingTime = "24h";
    artisan = artisan || "Amina";
  }
  
  return { badge, badgeBg, materials, manufacturingTime, artisan };
}

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
  if (n.includes("amlou")) return "/images/amlou_miel.jpg";
  return "/images/product-placeholder.svg";
};

export function ProductCard({ product }: { product: Product }) {
  const { t, locale } = useI18n();
  const { add } = useCart();
  const name = localizedField(product, locale as Locale, "name");
  const outOfStock = product.stock <= 0;

  const story = getProductStory(name, product.origin_city, product.artisan_name);
  
  const fallbackSrc = getLocalFallback(name);
  const initialSrc = name.toLowerCase().includes("amlou") ? fallbackSrc : (product.image_url || fallbackSrc);
  const [imgSrc, setImgSrc] = React.useState(initialSrc);

  React.useEffect(() => {
    setImgSrc(name.toLowerCase().includes("amlou") ? fallbackSrc : (product.image_url || fallbackSrc));
  }, [product.image_url, fallbackSrc, name]);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-card border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-souk">
      <div className="relative block aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={imgSrc}
          alt={name}
          onError={() => {
            if (imgSrc !== fallbackSrc) {
              setImgSrc(fallbackSrc);
            }
          }}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Dynamic Story Badge */}
        <span className={`absolute top-3 start-3 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide backdrop-blur-sm shadow-sm ${story.badgeBg}`}>
          {story.badge}
        </span>

        {product.old_price_mad && (
          <span className="absolute bottom-3 start-3 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground shadow-sm">
            -
            {Math.round(
              ((Number(product.old_price_mad) - Number(product.price_mad)) /
                Number(product.old_price_mad)) *
                100,
            )}
            %
          </span>
        )}
        
        <WishlistButton productId={product.id} className="absolute top-3 end-3 z-20" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Origin / City Tag */}
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-secondary">
          <MapPin className="h-3 w-3" />
          <span>{product.origin_city || "Maroc"}</span>
        </div>

        <Link
          to="/produits/$slug"
          params={{ slug: product.slug }}
          className="mt-2 font-display text-lg font-bold leading-tight text-foreground hover:text-primary transition-colors line-clamp-2 before:absolute before:inset-0 before:content-[''] before:z-10"
        >
          {name}
        </Link>

        {/* Product Story details */}
        <div className="mt-3 grid grid-cols-2 gap-y-1.5 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0 text-amber-500/80" />
            <span className="truncate">👤 {story.artisan}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500/80" />
            <span className="truncate">🕐 {story.manufacturingTime}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <Tag className="h-3.5 w-3.5 shrink-0 text-amber-500/80" />
            <span className="truncate">{story.materials}</span>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between pt-4 border-t border-border/30 mt-4">
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
            className="relative z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-110 hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            aria-label={outOfStock ? t("product.outOfStock") : t("product.addToCart")}
          >
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
