// Server-only helpers: rate limiting (Postgres-backed) + in-memory circuit breaker.
// Do NOT import this file from client code — it uses the service-role Supabase client.

type BreakerState = { failures: number; openedAt: number | null };
const breakers = new Map<string, BreakerState>();

const BREAKER_THRESHOLD = 5;        // consecutive failures before opening
const BREAKER_COOLDOWN_MS = 30_000; // 30s cooldown before half-open probe

export class RateLimitError extends Error {
  status = 429;
  retryAfter: number;
  constructor(retryAfter: number) {
    super("Rate limit exceeded");
    this.retryAfter = retryAfter;
  }
}

export class CircuitOpenError extends Error {
  status = 503;
  constructor(service: string) {
    super(`Service temporarily unavailable: ${service}`);
  }
}

/**
 * Enforce a rate limit using the Postgres `check_rate_limit` RPC.
 * Throws RateLimitError when the caller exceeds `maxRequests` in `windowSeconds`.
 */
export async function enforceRateLimit(
  bucket: string,
  identifier: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
    _bucket: bucket,
    _identifier: identifier,
    _max_requests: maxRequests,
    _window_seconds: windowSeconds,
  });
  if (error) {
    // Fail open on infrastructure errors — don't take the whole app down.
    console.warn("[rate-limit] check failed, allowing:", error.message);
    return;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (row && row.allowed === false) {
    throw new RateLimitError(row.retry_after ?? windowSeconds);
  }
}

/**
 * Simple in-memory circuit breaker. State is per-worker (best-effort on Cloudflare),
 * good enough to shed load when an upstream (Gemini, Resend, etc.) is failing.
 */
export async function withBreaker<T>(
  service: string,
  fn: () => Promise<T>,
  fallback?: () => Promise<T> | T,
): Promise<T> {
  const state = breakers.get(service) ?? { failures: 0, openedAt: null };
  const now = Date.now();

  if (state.openedAt !== null && now - state.openedAt < BREAKER_COOLDOWN_MS) {
    if (fallback) return await fallback();
    throw new CircuitOpenError(service);
  }

  try {
    const result = await fn();
    // Success — reset breaker.
    if (state.failures > 0 || state.openedAt !== null) {
      breakers.set(service, { failures: 0, openedAt: null });
    }
    return result;
  } catch (err) {
    const failures = state.failures + 1;
    const openedAt = failures >= BREAKER_THRESHOLD ? now : state.openedAt;
    breakers.set(service, { failures, openedAt });
    if (fallback) return await fallback();
    throw err;
  }
}

/** Best-effort client identifier for anonymous rate limiting. */
export function getClientIdentifier(request: Request, userId?: string | null): string {
  if (userId) return `u:${userId}`;
  const fwd = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? request.headers.get("x-real-ip");
  return `ip:${fwd ?? "unknown"}`;
}
