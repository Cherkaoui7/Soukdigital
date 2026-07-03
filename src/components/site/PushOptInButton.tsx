import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  pushSupported,
  getPushSubscription,
  subscribePush,
  unsubscribePush,
  subToJSON,
} from "@/lib/push";
import { savePushSubscription, removePushSubscription } from "@/lib/push.functions";

export function PushOptInButton() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = useServerFn(savePushSubscription);
  const remove = useServerFn(removePushSubscription);

  useEffect(() => {
    if (!pushSupported()) return;
    setSupported(true);
    getPushSubscription().then((s) => setSubscribed(!!s));
  }, []);

  if (!supported) return null;

  async function toggle() {
    setBusy(true);
    try {
      if (subscribed) {
        const s = await getPushSubscription();
        if (s) {
          await remove({ data: { endpoint: s.endpoint } });
          await unsubscribePush();
        }
        setSubscribed(false);
        toast.success("Notifications désactivées");
      } else {
        const s = await subscribePush();
        const j = subToJSON(s);
        await save({
          data: {
            endpoint: j.endpoint,
            p256dh: j.p256dh,
            auth: j.auth,
            user_agent: navigator.userAgent.slice(0, 200),
            locale: (navigator.language || "fr").slice(0, 5),
          },
        });
        setSubscribed(true);
        toast.success("Notifications activées — tu recevras les promos du souk.");
      }
    } catch (e) {
      toast.error((e as Error).message || "Erreur notifications");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={subscribed ? "Désactiver les notifications" : "Activer les notifications"}
      className="inline-flex items-center gap-2 rounded-full border-2 border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50"
    >
      {subscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {subscribed ? "Notifications actives" : "Activer les notifications"}
    </button>
  );
}
