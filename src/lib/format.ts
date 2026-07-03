import type { Locale } from "./i18n";

const localeMap: Record<Locale, string> = {
  fr: "fr-MA",
  ar: "ar-MA",
  en: "en-MA",
};

export function formatPrice(amount: number, locale: Locale = "fr"): string {
  try {
    return new Intl.NumberFormat(localeMap[locale], {
      style: "currency",
      currency: "MAD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount)} MAD`;
  }
}
