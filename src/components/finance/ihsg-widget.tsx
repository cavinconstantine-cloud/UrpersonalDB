import { fmtMinutesAgo, isFreshStockPrice } from "@/lib/finance/format";

function fmtAsOf(asOf: string): string {
  try {
    return new Date(asOf).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return asOf;
  }
}

export function IhsgWidget({ price, asOf, updatedAt }: { price: number; asOf: string; updatedAt?: string }) {
  const fresh = isFreshStockPrice(updatedAt);
  return (
    <div
      className="rounded-[18px] p-4 mb-4"
      style={{
        background: "linear-gradient(135deg, rgba(124,110,242,0.16), rgba(124,110,242,0.04))",
        border: "1px solid rgba(124,110,242,0.3)",
      }}
    >
      <div className="mb-1.5">
        <div className="text-[11px] text-text-dim mb-0.5">🇮🇩 IHSG — Indeks Harga Saham Gabungan</div>
        <div className="serif text-[22px]">{price.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</div>
      </div>
      <div className="text-[10px] text-text-muted">
        {fresh ? `${fmtMinutesAgo(updatedAt!)} — diperbarui berkala saat jam bursa` : `Tutup ${fmtAsOf(asOf)} — bukan harga real-time`}
      </div>
    </div>
  );
}
