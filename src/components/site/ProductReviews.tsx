import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Review = {
  id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export function ProductReviews({ productId }: { productId: string }) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["reviews", productId, user?.id],
    queryFn: async () => {
      // Public approved reviews (no user_id exposed)
      const { data: pub, error: pErr } = await supabase
        .from("public_product_reviews")
        .select("id,rating,title,body,created_at")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;
      const approved: Review[] = (pub ?? [])
        .filter((r) => r.id && r.rating != null)
        .map((r) => ({
          id: r.id as string,
          rating: r.rating as number,
          title: r.title,
          body: r.body,
          created_at: r.created_at ?? new Date().toISOString(),
          user_id: "",
          status: "approved",
        }));
      // The signed-in user can see their own review (any status)
      if (user) {
        const { data: mine } = await supabase
          .from("product_reviews")
          .select("id,user_id,rating,title,body,status,created_at")
          .eq("product_id", productId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (mine && !approved.find((r) => r.id === mine.id)) {
          return [mine as Review, ...approved];
        }
      }
      return approved;
    },
  });

  const approved = (data ?? []).filter((r) => r.status === "approved");
  const myReview = user ? (data ?? []).find((r) => r.user_id === user.id) : null;
  const avg =
    approved.length > 0
      ? approved.reduce((s, r) => s + r.rating, 0) / approved.length
      : 0;

  const [rating, setRating] = useState(myReview?.rating ?? 5);
  const [title, setTitle] = useState(myReview?.title ?? "");
  const [body, setBody] = useState(myReview?.body ?? "");

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const payload = {
        product_id: productId,
        user_id: user.id,
        rating,
        title: title.trim() || null,
        body: body.trim() || null,
      };
      const { error } = await supabase
        .from("product_reviews")
        .upsert(payload, { onConflict: "product_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("reviews.submitted"));
      qc.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">{t("reviews.title")}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Stars value={avg} />
              <span className="font-semibold">
                {avg.toFixed(1)} / 5
              </span>
              <span className="text-muted-foreground">
                · {approved.length} {t("reviews.count")}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-5">
          {!user ? (
            <p className="text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary underline">{t("auth.signInAction")}</Link>{" "}
              {t("reviews.signInHint")}
            </p>
          ) : (
            <>
              <p className="font-medium text-sm">
                {myReview ? t("reviews.editYours") : t("reviews.writeYours")}
                {myReview?.status === "pending" && (
                  <span className="ms-2 rounded-full bg-accent/30 px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                    {t("reviews.pending")}
                  </span>
                )}
              </p>
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="p-1"
                    aria-label={`${n} / 5`}
                  >
                    <Star className={cn("h-6 w-6", n <= rating ? "fill-secondary text-secondary" : "text-muted-foreground")} />
                  </button>
                ))}
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder={t("reviews.titlePlaceholder")}
                className="mt-3 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={800}
                rows={3}
                placeholder={t("reviews.bodyPlaceholder")}
                className="mt-3 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={() => submit.mutate()}
                disabled={submit.isPending}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-souk hover:opacity-90 disabled:opacity-50"
              >
                {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {myReview ? t("reviews.update") : t("reviews.publish")}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">{t("reviews.moderationNote")}</p>
            </>
          )}
        </div>

        {/* List */}
        <ul className="mt-8 space-y-4">
          {approved.length === 0 && (
            <li className="text-sm text-muted-foreground">{t("reviews.empty")}</li>
          )}
          {approved.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} />
                <time className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString(
                    locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA",
                    { day: "numeric", month: "short", year: "numeric" },
                  )}
                </time>
              </div>
              {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
              {r.body && <p className="mt-1 text-sm text-foreground/85 whitespace-pre-line">{r.body}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-4 w-4",
            n <= Math.round(value) ? "fill-secondary text-secondary" : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}
