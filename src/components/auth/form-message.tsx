export function FormMessage({ error, info }: { error?: string; info?: string }) {
  if (!error && !info) return null;
  return (
    <div
      className={
        error
          ? "mb-4 rounded-lg border border-critical/40 bg-critical-wash px-3.5 py-3 text-[13px] text-critical leading-relaxed"
          : "mb-4 rounded-lg border border-good/40 bg-good-wash px-3.5 py-3 text-[13px] text-good leading-relaxed"
      }
    >
      {error || info}
    </div>
  );
}
