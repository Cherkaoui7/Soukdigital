import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  ssr: false,
  validateSearch: (s) => searchSchema.parse(s),
});

function AuthPage() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (redirect === "/commande") navigate({ to: "/commande" });
      else navigate({ to: "/compte" });
    }
  }, [user, loading, navigate, redirect]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: fullName },
        },
      });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setBusy(false);
  }

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError(String(result.error));
  }

  const input = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="mx-auto flex max-w-md flex-col px-4 sm:px-6 py-16">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-souk">
          <h1 className="font-display text-3xl font-bold text-foreground">
            {mode === "signin" ? t("auth.signIn") : t("auth.signUp")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("brand.tagline")}</p>

          <div className="mt-6 flex rounded-full border border-border bg-background p-1">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${mode === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {t("auth.signInAction")}
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {t("auth.signUpAction")}
            </button>
          </div>

          <button
            onClick={handleGoogle}
            type="button"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-4.9 3.4-8.4z"/><path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.7v3C3.6 21.4 7.5 24 12 24z"/><path fill="#FBBC04" d="M5.6 14.8c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2v-3H1.7C.9 8.9.5 10.4.5 12s.4 3.1 1.2 4.6l3.9-1.8z"/><path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.2 15.1 0 12 0 7.5 0 3.6 2.6 1.7 6.4l3.9 3c.9-2.7 3.4-4.6 6.4-4.6z"/></svg>
            {t("auth.google")}
          </button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("auth.or")}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="text-sm font-medium">{t("checkout.fullName")}</span>
                <input required className={`mt-1 ${input}`} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </label>
            )}
            <label className="block">
              <span className="text-sm font-medium">{t("auth.email")}</span>
              <input required type="email" className={`mt-1 ${input}`} value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-medium">{t("auth.password")}</span>
              <input required type="password" minLength={6} className={`mt-1 ${input}`} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>

            {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busy ? t("common.loading") : mode === "signin" ? t("auth.signInAction") : t("auth.signUpAction")}
            </button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
