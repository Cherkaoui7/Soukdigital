import { Link, useRouter } from "@tanstack/react-router";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useI18n, type Locale } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/use-admin";

const locales: { code: Locale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "ar", label: "ع" },
  { code: "en", label: "EN" },
];

export function SiteHeader() {
  const { t, locale, setLocale } = useI18n();
  const { count } = useCart();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.invalidate();
  }

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/40 shadow-[0_1px_24px_0_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground font-display text-lg font-bold shadow-glow-gold group-hover:scale-110 transition-transform duration-300"
            style={{ background: "var(--gradient-majorelle)" }}
          >
            ⵣ
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-primary">
            Souk<span className="text-secondary">Digital</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            to="/"
            className="relative text-foreground/80 hover:text-primary transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
          >
            {t("nav.home")}
          </Link>
          <Link
            to="/produits"
            className="relative text-foreground/80 hover:text-primary transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
          >
            {t("nav.products")}
          </Link>
          <Link
            to="/artisans"
            className="relative text-foreground/80 hover:text-primary transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
          >
            {t("nav.artisans")}
          </Link>
          <Link
            to="/ai-studio"
            className="relative font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary hover:opacity-80 transition-opacity after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-gradient-to-r after:from-primary after:to-secondary after:transition-all after:duration-300"
          >
            AI Studio ✨
          </Link>
          <a
            href="/#categories"
            className="relative text-foreground/80 hover:text-primary transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
          >
            {t("nav.categories")}
          </a>
          {user && (
            <Link
              to="/favoris"
              className="relative text-foreground/80 hover:text-secondary transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
            >
              {t("nav.wishlist")}
            </Link>
          )}
          {user && (
            <Link
              to="/fidelite"
              className="relative text-secondary hover:text-secondary/80 transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
            >
              {t("nav.loyalty")}
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className="relative text-primary hover:text-primary/80 transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <div className="hidden sm:flex items-center rounded-full border border-border bg-card p-0.5">
            {locales.map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
                  locale === l.code
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={locale === l.code}
              >
                {l.label}
              </button>
            ))}
          </div>

          {user ? (
            <Link
              to="/compte"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
              aria-label={t("nav.account")}
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">{t("nav.account")}</span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">{t("nav.signIn")}</span>
            </Link>
          )}

          <Link
            to="/panier"
            className="relative inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground shadow-souk hover:opacity-90 transition-opacity hover:scale-105 transition-transform"
            aria-label={t("nav.cart")}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden md:inline">{t("nav.cart")}</span>
            {count > 0 && (
              <span className="absolute -top-1.5 -end-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {count}
              </span>
            )}
          </Link>

          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-border"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3 animate-souk-in">
          <Link to="/" onClick={() => setOpen(false)} className="block text-sm font-medium">
            {t("nav.home")}
          </Link>
          <Link to="/produits" onClick={() => setOpen(false)} className="block text-sm font-medium">
            {t("nav.products")}
          </Link>
          <Link to="/artisans" onClick={() => setOpen(false)} className="block text-sm font-medium">
            {t("nav.artisans")}
          </Link>
          <Link to="/ai-studio" onClick={() => setOpen(false)} className="block text-sm font-bold text-primary">
            AI Studio ✨
          </Link>
          {user ? (
            <>
              <Link
                to="/compte"
                onClick={() => setOpen(false)}
                className="block text-sm font-medium"
              >
                {t("nav.account")}
              </Link>
              <Link
                to="/favoris"
                onClick={() => setOpen(false)}
                className="block text-sm font-medium"
              >
                {t("nav.wishlist")}
              </Link>
              <Link
                to="/fidelite"
                onClick={() => setOpen(false)}
                className="block text-sm font-medium text-secondary"
              >
                {t("nav.loyalty")}
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="block text-sm font-medium text-primary"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="block text-sm font-medium text-destructive"
              >
                {t("nav.signOut")}
              </button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setOpen(false)} className="block text-sm font-medium">
              {t("nav.signIn")}
            </Link>
          )}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            {locales.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLocale(l.code);
                  setOpen(false);
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                  locale === l.code
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
