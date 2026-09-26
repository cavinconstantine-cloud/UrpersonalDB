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
          {count} recurring income/expense item{count === 1 ? "" : "s"} not linked to an account
        </span>
      </div>
      <p className="text-xs text-text-dim mt-1">Tap to complete it in Cash Flow →</p>
    </Link>
  );
}
