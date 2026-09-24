"use client";

import { useMemo, useState } from "react";
import { fmtRp, currentYm } from "@/lib/finance/format";

export interface FcfMonthPoint {
  month: string; // ISO date, 1st of month
  fcf: number;
}

// timeZone: "UTC" — these month strings are calendar labels ("2026-09-01"),
// not real instants; parsing+formatting them in the viewer's local timezone
// can shift the displayed label a day/month off from what was stored.
const MONTH_LABEL = new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" });

function monthLabel(iso: string): string {
  return MONTH_LABEL.format(new Date(iso));
}

export function FcfTrend({ points, current }: { points: FcfMonthPoint[]; current: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // currentYm() reads the viewer's own local device date (see format.ts),
  // matching the "this month" a stored fcf_snapshots row would use.
  const series = useMemo(() => {
    const thisMonth = `${currentYm()}-01`;
    const withoutThisMonth = points.filter((p) => p.month !== thisMonth);
    return [...withoutThisMonth, { month: thisMonth, fcf: current }].sort((a, b) => a.month.localeCompare(b.month));
  }, [points, current]);

  if (series.length < 2) {
    return (
      <div className="mx-5 mb-4 p-4 rounded-2xl border border-hairline bg-bg-raised text-xs text-text-dim leading-relaxed shadow-[var(--shadow-card)]">
        Tren FCF bulanan akan muncul di sini setelah kamu membuka dashboard di lebih dari satu bulan kalender.
      </div>
    );
  }

  const maxAbs = Math.max(...series.map((p) => Math.abs(p.fcf)), 1);
  const active = hoverIdx !== null ? series[hoverIdx] : series[series.length - 1];

  return (
    <div className="mx-5 mb-4 p-4 rounded-2xl border border-hairline bg-bg-raised shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs text-text-dim">Free Cash Flow · {series.length} bulan terakhir</div>
        {active && (
          <div className="text-xs font-medium" style={{ color: active.fcf >= 0 ? "var(--good)" : "var(--critical)" }}>
            {fmtRp(active.fcf)}
          </div>
        )}
      </div>
      <div className="flex items-end gap-1.5 h-[72px]">
        {series.map((p, i) => {
          const heightPct = Math.max(4, (Math.abs(p.fcf) / maxAbs) * 100);
          const positive = p.fcf >= 0;
          return (
            <button
              key={p.month}
              type="button"
              className="flex-1 h-full flex flex-col justify-end items-center group"
              onPointerEnter={() => setHoverIdx(i)}
              onPointerLeave={() => setHoverIdx(null)}
              onClick={() => setHoverIdx(i)}
            >
              <div
                className="w-full rounded-[3px] transition-opacity"
                style={{
                  height: `${heightPct}%`,
                  background: positive ? "var(--good)" : "var(--critical)",
                  opacity: hoverIdx === null || hoverIdx === i ? 1 : 0.35,
                }}
              />
            </button>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {series.map((p) => (
          <div key={p.month} className="flex-1 text-center text-[10px] text-text-muted">
            {monthLabel(p.month)}
          </div>
        ))}
      </div>
    </div>
  );
}
