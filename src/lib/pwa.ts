// Register the service worker only in production browsers (never in dev / Lovable preview / SSR)
export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;
  const host = window.location.hostname;
  if (host.includes("lovable.app") || host.includes("lovableproject.com") || host === "localhost" || host === "127.0.0.1") return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  });
}
