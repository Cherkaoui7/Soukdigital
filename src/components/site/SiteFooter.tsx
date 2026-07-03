import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();

  const columns = [
    {
      title: t("footer.about"),
      links: [
        { label: t("hero.ctaSecondary"), href: "/#artisans" },
        { label: t("nav.about"), href: "/#about" },
      ],
    },
    {
      title: t("footer.services"),
      links: [
        { label: "Livraison Amana / Aramex", href: "/#" },
        { label: "Retours 30 jours", href: "/#" },
      ],
    },
    {
      title: t("footer.community"),
      links: [
        { label: "Blog & recettes", href: "/#" },
        { label: "Instagram", href: "https://instagram.com" },
        { label: "TikTok", href: "https://tiktok.com" },
      ],
    },
    {
      title: t("footer.security"),
      links: [
        { label: "CMI · Paiement sécurisé", href: "/#" },
        { label: "Loi 09-08 · RGPD", href: "/#" },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-lg text-primary-foreground font-display text-xl font-bold"
                style={{ background: "var(--gradient-majorelle)" }}
              >
                ⵣ
              </span>
              <span className="font-display text-2xl font-bold text-primary">
                Souk<span className="text-secondary">Digital</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              {t("brand.tagline")}
            </p>
            <div className="mt-6 h-2 rounded-full zellige-border" />
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground/80">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="hover:text-primary transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Souk Digital · {t("footer.madeIn")}</p>
          <p>Casablanca · Rabat · Marrakech · Fès</p>
        </div>
      </div>
    </footer>
  );
}
