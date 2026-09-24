import Link from "next/link";

export function MissingAccountReminder({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <Link
      href="/app/cashflow"
      className="mx-5 mb-4 p-4 rounded-2xl border block bg-warning/10 text-sm leading-relaxed shadow-[var(--shadow-card)]"
      style={{ borderColor: "var(--warning)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">⚠️</span>
        <span className="font-medium">
          {count} item pemasukan/pengeluaran tetap belum terhubung ke rekening
        </span>
      </div>
      <p className="text-xs text-text-dim mt-1">Tap buat lengkapi di Arus Kas Tetap →</p>
    </Link>
  );
}
