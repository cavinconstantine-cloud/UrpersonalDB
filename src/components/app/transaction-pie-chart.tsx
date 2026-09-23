import { expenseCatColorVar, expenseCatIcon } from "@/lib/finance/constants";
import { fmtRp } from "@/lib/finance/format";
import type { ExpenseCategorySlice } from "@/lib/finance/calculations";

interface RadialSlice extends ExpenseCategorySlice {
  startPct: number;
}
interface RadialLabel extends RadialSlice {
  ux: number;
  uy: number;
  dotX: number;
  dotY: number;
  edgeX: number;
  edgeY: number;
  textTop: number;
  textAlign: "left" | "right";
  side: "left" | "right";
}

/**
 * Places leader-line labels around a donut so they never collide: each
 * slice's true mid-angle picks a side (left/right of center), then labels
 * within a side are stacked at evenly spaced rows (top to bottom, by their
 * natural angle) — the leader line still starts at the slice's real edge
 * point, so it visibly bends toward the row it landed on instead of lying
 * about where the slice actually is.
 */
function computeRadialLabels(slices: RadialSlice[], cx: number, cy: number, r: number): RadialLabel[] {
  const withAngle = slices.map((s) => {
    const midPct = s.startPct + s.pct / 2;
    const rad = ((midPct * 3.6) / 180) * Math.PI;
    const ux = Math.sin(rad);
    const uy = -Math.cos(rad);
    return { ...s, ux, uy, naturalY: cy + uy * r };
  });
  const right = withAngle.filter((s) => s.ux >= 0).sort((a, b) => a.naturalY - b.naturalY);
  const left = withAngle.filter((s) => s.ux < 0).sort((a, b) => a.naturalY - b.naturalY);

  const band = 56;
  const colOffset = r + 32;

  function place(group: typeof right, sign: 1 | -1): RadialLabel[] {
    const n = group.length;
    return group.map((s, i) => {
      const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
      const dotY = Math.round(cy + t * band);
      const dotX = cx + sign * colOffset;
      const edgeX = cx + s.ux * (r + 3);
      const edgeY = cy + s.uy * (r + 3);
      const side: "left" | "right" = sign > 0 ? "right" : "left";
      return { ...s, dotX, dotY, edgeX, edgeY, textTop: dotY - 16, textAlign: side, side };
    });
  }

  return [...place(right, 1), ...place(left, -1)];
}

const CHART_W = 310;
const CHART_H = 250;
const CX = 155;
const CY = 125;
const R = 52;

export function TransactionPieChart({ slices, total }: { slices: ExpenseCategorySlice[]; total: number }) {
  if (slices.length === 0) return null;

  const withStart: RadialSlice[] = slices.map((s, i) => ({
    ...s,
    startPct: slices.slice(0, i).reduce((sum, x) => sum + x.pct, 0),
  }));
  const stops = withStart.map((s) => `${expenseCatColorVar(s.category)} ${s.startPct}% ${s.startPct + s.pct}%`).join(", ");
  const labels = computeRadialLabels(withStart, CX, CY, R);

  return (
    <div className="bg-bg-raised border border-hairline rounded-[22px] pt-4 pb-4 shadow-[var(--shadow-card)]">
      <div className="flex items-baseline justify-between px-4 mb-2">
        <span className="text-[13px] font-medium">🥧 Sebaran Pengeluaran</span>
        <span className="text-[10.5px] text-text-muted">Semua kategori</span>
      </div>
      <div className="relative mx-auto" style={{ width: CHART_W, height: CHART_H }}>
        <svg width={CHART_W} height={CHART_H} className="absolute inset-0">
          {labels.map((lb) => (
            <g key={lb.category}>
              <line
                x1={lb.edgeX}
                y1={lb.edgeY}
                x2={lb.dotX}
                y2={lb.dotY}
                style={{ stroke: "var(--hairline)" }}
                strokeWidth={1.25}
              />
              <circle cx={lb.dotX} cy={lb.dotY} r={3.5} style={{ fill: expenseCatColorVar(lb.category) }} />
            </g>
          ))}
        </svg>
        <div
          className="absolute rounded-full shadow-[var(--shadow-card)]"
          style={{ left: CX - 52, top: CY - 52, width: 104, height: 104, background: `conic-gradient(${stops})` }}
        />
        <div
          className="absolute rounded-full bg-bg-raised flex flex-col items-center justify-center"
          style={{ left: CX - 23, top: CY - 23, width: 46, height: 46 }}
        >
          <span className="text-[8px] text-text-dim">Total</span>
          <span className="text-[9.5px] font-semibold text-text whitespace-nowrap">{fmtRp(total)}</span>
        </div>
        {labels.map((lb) => (
          <div
            key={lb.category}
            className="absolute"
            style={{
              top: lb.textTop,
              width: 78,
              textAlign: lb.textAlign,
              ...(lb.side === "right" ? { left: lb.dotX + 8 } : { right: CHART_W - lb.dotX + 8 }),
            }}
          >
            <div className="text-[14px] font-bold leading-tight text-text">{Math.round(lb.pct)}%</div>
            <div className="text-[10px] text-text-dim leading-snug mt-px">
              {expenseCatIcon(lb.category)} {lb.category}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
