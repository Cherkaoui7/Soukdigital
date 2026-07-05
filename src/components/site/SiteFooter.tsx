import { useI18n } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Send } from "lucide-react";
import React from "react";

export function SiteFooter() {
  const { t } = useI18n();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Merci pour votre inscription ! Vous recevrez bientôt nos actualités artisanales.");
  };

  return (
    <footer className="mt-24 border-t border-border bg-card">
      {/* Upper Footer: Logo, Columns & Contact */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Column 1: Brand details */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground font-display text-xl font-bold transition-transform hover:rotate-12 duration-300"
                style={{ background: "var(--gradient-majorelle)" }}
              >
                ⵣ
              </span>
              <span className="font-display text-2xl font-bold text-primary">
                Souk<span className="text-secondary">Digital</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("brand.tagline") || "La première plateforme marocaine dédiée à l'artisanat authentique et au savoir-faire local."}
            </p>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground/80">
              Souk Digital est la vitrine numérique de nos maâlems. Chaque pièce raconte une histoire et chaque achat soutient directement une coopérative locale.
            </p>
            <div className="mt-6 h-2 rounded-full zellige-border" />
            
            {/* Social Links */}
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="Facebook"
              >
                <Facebook className="h-4.5 w-4.5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-4.5 w-4.5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                aria-label="YouTube"
              >
                <Youtube className="h-4.5 w-4.5" />
              </a>
              <a
                href="https://wa.me/212612345678"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-emerald-600 hover:text-white transition-all duration-300"
                aria-label="WhatsApp"
              >
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.736.001-2.599-1.01-5.048-2.844-6.886-1.836-1.837-4.282-2.85-6.883-2.851-5.442 0-9.866 4.371-9.87 9.739 0 1.742.476 3.442 1.378 4.96L1.93 21.054l4.717-1.9zm12.303-7.227c-.33-.165-1.951-.951-2.252-1.06-.3-.11-.518-.165-.736.165-.218.33-.846 1.06-.103 1.171.18.06.6.22 1.1.28.33.06.66.06.9-.11.33-.22 1.1-.73 1.1-.95z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Marketplace */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-foreground/90">
              Notre marketplace
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/produits" className="hover:text-primary transition-colors">Tous les produits</Link>
              </li>
              <li>
                <Link to="/artisans" className="hover:text-primary transition-colors">Nos artisans</Link>
              </li>
              <li>
                <a href="#explore-regions" className="hover:text-primary transition-colors">Nos régions</a>
              </li>
              <li>
                <Link to="/ai-studio" className="hover:text-primary transition-colors">AI Studio ✨</Link>
              </li>
              <li>
                <Link to="/fidelite" className="hover:text-primary transition-colors">Carte Zellige</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: À propos & Support */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-foreground/90">
              À propos & Aide
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href="#about" className="hover:text-primary transition-colors">Notre histoire</a>
              </li>
              <li>
                <a href="#why-us" className="hover:text-primary transition-colors">Nos valeurs</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
              </li>
              <li>
                <a href="#shipping" className="hover:text-primary transition-colors">Livraison & retours</a>
              </li>
              <li>
                <a href="#cgu" className="hover:text-primary transition-colors">CGU / Mentions légales</a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Coordinates */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-foreground/90">
              Contactez-nous
            </h4>
            <ul className="mt-4 space-y-3.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 mt-0.5 text-secondary shrink-0" />
                <span className="leading-tight">+212 6 12 34 56 78</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 mt-0.5 text-secondary shrink-0" />
                <span className="leading-tight break-all">contact@soukdigital.ma</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-0.5 text-secondary shrink-0" />
                <span className="leading-tight">Casablanca, Maroc</span>
              </li>
              
              {/* Quick Newsletter embed in column */}
              <li className="pt-2">
                <form onSubmit={handleSubscribe} className="flex max-w-[240px] items-center rounded-lg border border-input bg-background/50 p-1">
                  <input
                    type="email"
                    required
                    placeholder="Votre email..."
                    className="w-full bg-transparent px-2.5 py-1 text-xs outline-none"
                  />
                  <button
                    type="submit"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/95 transition-colors"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </div>

        {/* Lower Footer */}
        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Souk Digital · {t("footer.madeIn") || "Fabriqué avec ❤️ au Maroc"}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="#cgu" className="hover:text-primary transition-colors">CGU</a>
            <a href="#privacy" className="hover:text-primary transition-colors">Confidentialité</a>
            <a href="#support" className="hover:text-primary transition-colors">Support 7j/7</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
