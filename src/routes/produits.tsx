import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductGridSkeleton } from "@/components/site/ProductSkeleton";
import { useI18n, localizedField, type Locale } from "@/lib/i18n";
import { matches } from "@/lib/translit";

const searchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  city: z.string().optional(),
  artisan: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  sort: z.enum(["new", "price-asc", "price-desc"]).optional(),
});

export const Route = createFileRoute("/produits")({
  component: ProductsPage,
  ssr: false,
  validateSearch: (s) => searchSchema.parse(s),
});

function ProductsPage() {
  const { t, locale } = useI18n();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort");
      if (error) throw error;
      return data;
    },
  });

  const productsQuery = useQuery({
    queryKey: ["products", search.category ?? "all"],
    queryFn: async () => {
      let q = supabase.from("products").select("*, categories(slug)").order("created_at", { ascending: false });
      if (search.category) {
        const cat = categoriesQuery.data?.find((c) => c.slug === search.category);
        if (cat) q = q.eq("category_id", cat.id);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !search.category || !!categoriesQuery.data,
  });

  const cities = useMemo(() => {
    const set = new Set<string>();
    productsQuery.data?.forEach((p) => p.origin_city && set.add(p.origin_city));
    return Array.from(set).sort();
  }, [productsQuery.data]);

  const artisans = useMemo(() => {
    const set = new Set<string>();
    productsQuery.data?.forEach((p) => p.artisan_name && set.add(p.artisan_name));
    return Array.from(set).sort();
  }, [productsQuery.data]);

  const filtered = useMemo(() => {
    if (!productsQuery.data) return [];
    return productsQuery.data
      .filter((p) => (search.city ? p.origin_city === search.city : true))
      .filter((p) => (search.artisan ? p.artisan_name === search.artisan : true))
      .filter((p) => (search.min != null ? Number(p.price_mad) >= search.min : true))
      .filter((p) => (search.max != null ? Number(p.price_mad) <= search.max : true))
      .filter((p) =>
        search.q
          ? matches(search.q, p.name_fr, p.name_ar, p.name_en, p.origin_city, p.artisan_name, p.description_fr, p.description_ar, p.description_en)
          : true,
      )
      .sort((a, b) => {
        if (search.sort === "price-asc") return Number(a.price_mad) - Number(b.price_mad);
        if (search.sort === "price-desc") return Number(b.price_mad) - Number(a.price_mad);
        return 0;
      });
  }, [productsQuery.data, search]);

  type Search = z.infer<typeof searchSchema>;
  function update(patch: Partial<Search>) {
    navigate({ search: (prev: Search) => ({ ...prev, ...patch }) });
  }
  const activeFilters = [search.q, search.city, search.artisan, search.min, search.max].some((v) => v != null && v !== "");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <nav className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">{t("nav.home")}</Link>
            <span className="text-accent">✦</span>
            <span className="text-foreground">{t("nav.products")}</span>
          </nav>
          <h1 className="mt-3 font-display text-4xl font-bold text-foreground">{t("nav.products")}</h1>
          <p className="mt-2 text-muted-foreground">{t("filters.hint")}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search.q ?? ""}
                onChange={(e) => update({ q: e.target.value || undefined })}
                placeholder={t("filters.searchPlaceholder")}
                className="w-full rounded-full border border-input bg-background ps-10 pe-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <select
              value={search.sort ?? "new"}
              onChange={(e) => update({ sort: e.target.value === "new" ? undefined : (e.target.value as "price-asc" | "price-desc") })}
              className="rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="new">{t("filters.sort.new")}</option>
              <option value="price-asc">{t("filters.sort.priceAsc")}</option>
              <option value="price-desc">{t("filters.sort.priceDesc")}</option>
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <div>
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("nav.categories")}</h3>
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
              <button
                onClick={() => update({ category: undefined })}
                className={`rounded-full border px-3 py-1.5 text-sm text-start ${!search.category ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:border-primary/40"}`}
              >
                {t("common.all")}
              </button>
              {categoriesQuery.data?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => update({ category: cat.slug })}
                  className={`rounded-full border px-3 py-1.5 text-sm text-start ${search.category === cat.slug ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card hover:border-primary/40"}`}
                >
                  {localizedField(cat, locale as Locale, "name")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("filters.city")}</h3>
            <select
              value={search.city ?? ""}
              onChange={(e) => update({ city: e.target.value || undefined })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">{t("common.all")}</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("filters.artisan")}</h3>
            <select
              value={search.artisan ?? ""}
              onChange={(e) => update({ artisan: e.target.value || undefined })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">{t("common.all")}</option>
              {artisans.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">{t("filters.price")}</h3>
            <div className="flex items-center gap-2">
              <input type="number" min={0} placeholder="Min" value={search.min ?? ""} onChange={(e) => update({ min: e.target.value ? Number(e.target.value) : undefined })} className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm" />
              <span className="text-muted-foreground">–</span>
              <input type="number" min={0} placeholder="Max" value={search.max ?? ""} onChange={(e) => update({ max: e.target.value ? Number(e.target.value) : undefined })} className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm" />
            </div>
          </div>

          {activeFilters && (
            <button
              onClick={() => navigate({ search: { category: search.category } })}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <X className="h-3.5 w-3.5" /> {t("filters.reset")}
            </button>
          )}
        </aside>

        <div>
          {productsQuery.isLoading && <ProductGridSkeleton count={9} />}
          {productsQuery.data && filtered.length === 0 && (
            <p className="text-muted-foreground">{t("filters.noResults")}</p>
          )}
          {productsQuery.data && filtered.length > 0 && (
            <>
              <p className="mb-4 text-sm text-muted-foreground">{filtered.length} {t("filters.results")}</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {filtered.map((p, i) => (
                  <div key={p.id} className="animate-souk-in" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
