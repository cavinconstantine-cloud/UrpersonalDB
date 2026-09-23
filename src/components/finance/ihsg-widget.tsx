function fmtAsOf(asOf: string): string {
  try {
    return new Date(asOf).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return asOf;
  }
}

export function IhsgWidget({ price, changePct, asOf }: { price: number; changePct: number; asOf: string }) {
  const up = changePct >= 0;
  return (
    <div
      className="rounded-[18px] p-4 mb-4"
      style={{
        background: "linear-gradient(135deg, rgba(124,110,242,0.16), rgba(124,110,242,0.04))",
        border: "1px solid rgba(124,110,242,0.3)",
      }}
    >
      <div className="flex justify-between items-start mb-1.5">
        <div>
          <div className="text-[11px] text-text-dim mb-0.5">🇮🇩 IHSG — Indeks Harga Saham Gabungan</div>
          <div className="serif text-[22px]">{price.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</div>
        </div>
        <span
          className="text-xs font-semibold rounded-lg px-2.5 py-1"
          style={{
            color: up ? "var(--good)" : "var(--critical)",
            background: up ? "rgba(63,191,114,0.14)" : "rgba(230,113,106,0.14)",
          }}
        >
          {up ? "+" : ""}
          {changePct.toFixed(2)}%
        </span>
      </div>
      <div className="text-[10px] text-text-muted">Tutup {fmtAsOf(asOf)}</div>
    </div>
  );
}
