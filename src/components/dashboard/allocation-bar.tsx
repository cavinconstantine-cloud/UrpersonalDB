import { catColorVar } from "@/lib/finance/constants";

export interface AllocationSlice {
  category: string;
  value: number;
}

export function AllocationBar({ slices, total }: { slices: AllocationSlice[]; total: number }) {
  const parts = slices.filter((s) => s.value > 0);
  if (parts.length === 0 || total <= 0) return null;

  return (
    <div className="pb-3.5">
      <div className="flex h-2.5 rounded-full overflow-hidden bg-hairline gap-[2px] mb-3">
        {parts.map((p) => (
          <div
            key={p.category}
            style={{ width: `${(p.value / total) * 100}%`, background: catColorVar(p.category) }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-text-dim">
        {parts.map((p) => (
          <div key={p.category} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: catColorVar(p.category) }} />
            {p.category} · {Math.round((p.value / total) * 100)}%
          </div>
        ))}
      </div>
    </div>
  );
}
