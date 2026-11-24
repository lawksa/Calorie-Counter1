import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type PushConfig = { enabled: boolean; publicKey: string | null };
export type PushState = "unsupported" | "server-off" | "denied" | "off" | "on" | "loading";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const supported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/** Whether this device receives reminders while the app is closed, and a way to turn that on/off. */
export function usePushNotifications() {
  const { data: config } = useQuery<PushConfig>({ queryKey: ["/api/push/config"] });
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported()) return setSubscribed(false);
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => setSubscribed(false));
  }, []);

  const state: PushState = !supported()
    ? "unsupported"
    : !config || subscribed === null || busy
      ? "loading"
      : !config.enabled
        ? "server-off"
        : Notification.permission === "denied"
          ? "denied"
          : subscribed
            ? "on"
            : "off";

  const enable = useCallback(async () => {
    if (!config?.publicKey) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.publicKey),
        }));
      await apiRequest("POST", "/api/push/subscribe", sub.toJSON());
      setSubscribed(true);
    } finally {
      setBusy(false);
    }
  }, [config]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiRequest("POST", "/api/push/unsubscribe", { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, []);

  const test = useCallback(async () => {
    const res = await apiRequest("POST", "/api/push/test");
    return (await res.json()) as { sent: number; devices: number };
  }, []);

  return { state, enable, disable, test };
}
