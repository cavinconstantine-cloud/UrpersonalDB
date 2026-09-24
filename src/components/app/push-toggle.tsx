"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { subscribePush, unsubscribePush } from "@/app/app/settings/push-actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushToggle({ initialEnabled, vapidPublicKey }: { initialEnabled: boolean; vapidPublicKey: string | null }) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Feature-detected after mount (not in a lazy initializer) so the first
    // client render matches the server-rendered default and avoids a
    // hydration mismatch — same pattern as ThemeToggle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported("serviceWorker" in navigator && "PushManager" in window && Boolean(vapidPublicKey));
  }, [vapidPublicKey]);

  function enable() {
    if (!vapidPublicKey) return;
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Izin notifikasi ditolak — aktifkan lewat pengaturan browser kalau berubah pikiran.");
          return;
        }
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
        const json = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
        await subscribePush({ endpoint: json.endpoint, keys: json.keys });
        setEnabled(true);
        toast.success("Notifikasi aktif.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mengaktifkan notifikasi.");
      }
    });
  }

  function disable() {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js");
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          await unsubscribePush(subscription.endpoint);
          await subscription.unsubscribe();
        }
        setEnabled(false);
        toast.success("Notifikasi dimatikan.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal mematikan notifikasi.");
      }
    });
  }

  if (!supported) {
    return <p className="text-xs text-text-muted">Browser ini belum mendukung notifikasi push.</p>;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-text-dim leading-relaxed">
        Reminder harian kalau belum catat transaksi, plus peringatan budget & streak.
      </p>
      <Button size="sm" variant={enabled ? "ghost" : "primary"} onClick={enabled ? disable : enable} disabled={isPending}>
        {isPending ? <Spinner size={14} /> : enabled ? "Matikan" : "Aktifkan"}
      </Button>
    </div>
  );
}
