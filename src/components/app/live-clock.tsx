"use client";

import { useEffect, useState } from "react";

/** IANA zone -> the Indonesian abbreviation people actually recognize; Intl only ever gives back a bare "GMT+7". */
const ID_TZ_LABELS: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Pontianak": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
};

function offsetLabel(tz: string, date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value || tz;
  } catch {
    return tz;
  }
}

/**
 * Shows the visitor's own device clock/date/timezone, ticking live, so they
 * can verify it's correct at a glance. This is purely a display of the
 * browser's own time — it has no bearing on IHSG/stock market hours, which
 * always close at 15:00 WIB regardless of where the viewer is.
 */
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  const [tz, setTz] = useState<string>("");

  useEffect(() => {
    // Deferred to a callback (not called synchronously in the effect body)
    // so the very first tick works the same way as every later one, and so
    // the server-rendered placeholder always matches on hydration — the
    // server has no idea what the visitor's device clock/timezone is.
    function tick() {
      setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
      setNow(new Date());
    }
    const kickoff = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(id);
    };
  }, []);

  if (!now || !tz) {
    return (
      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-1">Waktu &amp; Zona Waktu</div>
        <div className="text-sm text-text-dim">Memuat…</div>
      </div>
    );
  }

  const timeStr = now.toLocaleTimeString("id-ID", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = now.toLocaleDateString("id-ID", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const label = ID_TZ_LABELS[tz] ?? offsetLabel(tz, now);

  return (
    <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
      <div className="serif text-[15px] mb-1">Waktu &amp; Zona Waktu</div>
      <p className="text-xs text-text-dim mb-3 leading-relaxed">
        Ini jam &amp; tanggal di perangkatmu sekarang — cek kalau sudah benar. Uangku pakai ini untuk menentukan
        &quot;hari ini&quot; di transaksi dan grafikmu.
      </p>
      <div className="serif text-[28px] tabular-nums mb-0.5">{timeStr}</div>
      <div className="text-sm text-text-dim mb-1.5">{dateStr}</div>
      <div className="text-xs text-text-muted">
        {tz} · {label}
      </div>
    </div>
  );
}
