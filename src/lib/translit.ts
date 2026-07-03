// Tolerant search helpers: Arabic <-> Latin transliteration + accent-insensitive matching.
// Used to make the Souk search understand Darija written in either script.

const AR_TO_LAT: Record<string, string> = {
  "ا": "a", "أ": "a", "إ": "i", "آ": "a", "ب": "b", "ت": "t", "ث": "th",
  "ج": "j", "ح": "h", "خ": "kh", "د": "d", "ذ": "dh", "ر": "r", "ز": "z",
  "س": "s", "ش": "ch", "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "ع": "a",
  "غ": "gh", "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n",
  "ه": "h", "و": "w", "ي": "y", "ى": "a", "ة": "a", "ء": "", "ئ": "y", "ؤ": "w",
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

// Common Darija latin variants collapsed to one canonical form.
const LATIN_ALIASES: Array<[RegExp, string]> = [
  [/ch/g, "ch"], [/sh/g, "ch"],
  [/kh/g, "kh"], [/gh/g, "gh"],
  [/ou/g, "w"], [/aa/g, "a"], [/ee/g, "i"], [/9/g, "q"], [/7/g, "h"], [/3/g, "a"],
];

export function normalize(input: string | null | undefined): string {
  if (!input) return "";
  let out = "";
  for (const ch of input) out += AR_TO_LAT[ch] ?? ch;
  out = out
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ");
  for (const [re, rep] of LATIN_ALIASES) out = out.replace(re, rep);
  return out.replace(/\s+/g, " ").trim();
}

export function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = normalize(query);
  if (!q) return true;
  const hay = fields.map(normalize).join(" ");
  return q.split(" ").every((tok) => hay.includes(tok));
}
