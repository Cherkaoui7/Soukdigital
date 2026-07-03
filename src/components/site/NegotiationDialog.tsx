import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Handshake, Loader2, Send, Sparkles, CheckCircle2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n, type Locale } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { startNegotiation, negotiateReply } from "@/lib/negotiation.functions";

type Msg = { role: "customer" | "merchant"; text: string; offer?: number; at: string };
type Negotiation = {
  id: string;
  status: "open" | "accepted" | "declined" | "closed";
  agreed_price_mad: number | null;
  messages: Msg[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string | null;
  };
};

export function NegotiationDialog({ open, onClose, product }: Props) {
  const { t, locale } = useI18n();
  const { add } = useCart();
  const start = useServerFn(startNegotiation);
  const reply = useServerFn(negotiateReply);

  const [neg, setNeg] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offer, setOffer] = useState<string>("");
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setNeg(null);
    setOffer("");
    setMessage("");
    setLoading(true);
    start({ data: { productId: product.id, locale: locale as Locale } })
      .then((n) => setNeg(n as unknown as Negotiation))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, product.id, locale, start]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [neg?.messages.length, loading]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!neg) return;
    const parsed = Number(offer);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(t("negotiate.invalidOffer"));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const r = await reply({
        data: { negotiationId: neg.id, userOffer: parsed, userMessage: message.trim() },
      });
      setNeg(r as unknown as Negotiation);
      setMessage("");
      setOffer("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleAcceptAndAdd() {
    if (!neg?.agreed_price_mad) return;
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(neg.agreed_price_mad),
      originalPrice: product.price,
      negotiationId: neg.id,
      image: product.image,
    });
    onClose();
  }

  const closed = neg?.status && neg.status !== "open";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 bg-card">
        <DialogHeader className="border-b border-border bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-5">
          <DialogTitle className="flex items-center gap-3 font-display text-xl">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary-foreground text-lg font-bold shadow-souk"
              style={{ background: "var(--gradient-majorelle)" }}
              aria-hidden
            >
              ⵣ
            </span>
            <span>
              <span className="block leading-tight">{t("negotiate.title")}</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Hajj Brahim · {formatPrice(product.price, locale as Locale)}
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[50vh] min-h-[280px] space-y-3 overflow-y-auto bg-moucharabieh p-5">
          {neg?.messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "customer" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  m.role === "customer"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm"
                }`}
              >
                {m.offer != null && (
                  <div
                    className={`mb-1 text-xs font-bold ${
                      m.role === "customer" ? "text-primary-foreground/80" : "text-secondary"
                    }`}
                  >
                    {m.role === "customer" ? t("negotiate.yourOffer") : t("negotiate.counterOffer")} :{" "}
                    {formatPrice(m.offer, locale as Locale)}
                  </div>
                )}
                <p className="leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("negotiate.thinking")}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="border-t border-destructive/30 bg-destructive/10 px-5 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {closed && neg?.status === "accepted" && neg.agreed_price_mad ? (
          <div className="border-t border-border bg-zellige/10 p-5">
            <div className="flex items-center gap-2 text-zellige">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-display text-lg font-bold">
                {t("negotiate.deal")} {formatPrice(Number(neg.agreed_price_mad), locale as Locale)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("negotiate.dealDesc")}</p>
            <button
              onClick={handleAcceptAndAdd}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-souk hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" /> {t("negotiate.addAtDeal")}
            </button>
          </div>
        ) : closed ? (
          <div className="border-t border-border bg-muted/40 p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="font-semibold">{t("negotiate.declined")}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t("negotiate.declinedDesc")}</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="grid gap-2 border-t border-border bg-card p-4 sm:grid-cols-[140px_1fr_auto]">
            <input
              type="number"
              min={1}
              step="1"
              inputMode="numeric"
              required
              disabled={loading || !neg}
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder={t("negotiate.offerPlaceholder")}
              className="rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <input
              type="text"
              maxLength={500}
              disabled={loading || !neg}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("negotiate.messagePlaceholder")}
              className="rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={loading || !neg}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-souk hover:opacity-90 disabled:opacity-50"
            >
              <Handshake className="h-4 w-4" />
              <span className="hidden sm:inline">{t("negotiate.send")}</span>
              <Send className="h-3.5 w-3.5 sm:hidden" />
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
