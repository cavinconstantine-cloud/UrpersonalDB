"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TZ_COOKIE } from "@/lib/i18n/timezone-cookie";

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * No UI — just keeps the `uangku_tz` cookie in sync with the browser's own
 * IANA timezone, so server-rendered "today"/"this month" boundaries follow
 * wherever the visitor actually is instead of the server's own clock. Only
 * refreshes when the detected zone actually changed (new device, or the
 * visitor traveled), so this isn't a refresh on every load.
 */
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!detected) return;
      if (readCookie(TZ_COOKIE) === detected) return;
      document.cookie = `${TZ_COOKIE}=${detected}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      router.refresh();
    } catch {
      // Intl.DateTimeFormat unsupported or blocked — server keeps using its default (Asia/Jakarta).
    }
  }, [router]);

  return null;
}
