"use client";

import { useMemo, useRef, useState } from "react";
import { fmtRp, fmtDateLong } from "@/lib/finance/format";

export interface TrendPoint {
  date: string;
  netWorth: number;
}

const WIDTH = 100; // viewBox units — scales responsively
const HEIGHT = 44;
const PAD_Y = 4;

export function NetWorthTrend({ points, current }: { points: TrendPoint[]; current: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Always include "today" as the last point so the line reaches the current value.
  const series = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const withoutToday = points.filter((p) => p.date !== today);
    return [...withoutToday, { date: today, netWorth: current }];
  }, [points, current]);

  const { path, coords, min, max } = useMemo(() => {
    if (series.length < 2) return { path: "", coords: [] as { x: number; y: number }[], min: 0, max: 0 };
    const values = series.map((p) => p.netWorth);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const coords = series.map((p, i) => {
      const x = (i / (series.length - 1)) * WIDTH;
      const y = HEIGHT - PAD_Y - ((p.netWorth - min) / span) * (HEIGHT - PAD_Y * 2);
      return { x, y };
    });
    const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ");
    return { path, coords, min, max };
  }, [series]);

  if (series.length < 2) {
    return (
      <div className="mx-5 mb-4 p-4 rounded-2xl border border-hairline bg-bg-raised text-xs text-text-dim leading-relaxed shadow-[var(--shadow-card)]">
        Grafik tren net worth akan muncul di sini setelah kamu membuka dashboard beberapa hari berturut-turut.
      </div>
    );
  }

  const first = series[0].netWorth;
  const delta = current - first;
  const deltaPositive = delta >= 0;

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - relX);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    });
    setHoverIdx(nearest);
  }

  const active = hoverIdx !== null ? series[hoverIdx] : null;
  const activeCoord = hoverIdx !== null ? coords[hoverIdx] : null;

  return (
    <div className="mx-5 mb-4 p-4 rounded-2xl border border-hairline bg-bg-raised shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs text-text-dim">Net worth · {series.length} hari terakhir</div>
        <div className="text-xs font-medium" style={{ color: deltaPositive ? "var(--good)" : "var(--critical)" }}>
          {deltaPositive ? "+" : ""}
          {fmtRp(delta)}
        </div>
      </div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="w-full h-[72px] touch-none"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIdx(null)}
        >
          <line x1="0" y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} stroke="var(--hairline)" strokeWidth="0.3" />
          <path
            d={path}
            fill="none"
            stroke="var(--series-1)"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {activeCoord && (
            <>
              <line
                x1={activeCoord.x}
                y1="0"
                x2={activeCoord.x}
                y2={HEIGHT}
                stroke="var(--hairline)"
                strokeWidth="0.4"
              />
              <circle cx={activeCoord.x} cy={activeCoord.y} r="1.6" fill="var(--series-1)" />
            </>
          )}
        </svg>
        {active && activeCoord && (
          <div
            className="pointer-events-none absolute -top-1 -translate-x-1/2 -translate-y-full rounded-lg border border-hairline bg-bg px-2.5 py-1.5 text-[11px] shadow-[var(--shadow-pop)] whitespace-nowrap"
            style={{ left: `${(activeCoord.x / WIDTH) * 100}%` }}
          >
            <div className="text-text-dim">{fmtDateLong(active.date)}</div>
            <div className="font-medium">{fmtRp(active.netWorth)}</div>
          </div>
        )}
      </div>
      <div className="flex justify-between text-[11px] text-text-muted mt-1">
        <span>{fmtRp(min)}</span>
        <span>{fmtRp(max)}</span>
      </div>
    </div>
  );
}
