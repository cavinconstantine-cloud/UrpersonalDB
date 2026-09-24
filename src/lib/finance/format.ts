export function fmtRp(n: number | string | undefined | null): string {
  const num = Number(n) || 0;
  return "Rp " + Math.round(num).toLocaleString("id-ID");
}

export function fmtNumber(n: number | string | undefined | null): string {
  const num = Number(n) || 0;
  return num.toLocaleString("id-ID");
}

export function fmtPercent(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

/** Keeps digits and at most one "," or "." (decimal separator) while typing — drops any repeats. */
export function sanitizeDecimalInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9.,]/g, "");
  let seenSep = false;
  let out = "";
  for (const ch of cleaned) {
    if (ch === "." || ch === ",") {
      if (seenSep) continue;
      seenSep = true;
    }
    out += ch;
  }
  return out;
}

/** Parses a decimal string that may use "," or "." as the separator (6,75 or 6.745). */
export function parseDecimal(raw: string | number | undefined | null): number {
  return Number(String(raw ?? "").replace(",", ".")) || 0;
}

export function fmtDateLong(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function fmtMonthYear(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

/**
 * "Today"/"this month" should follow wherever this actually runs — the
 * viewer's own device timezone in the browser. Reading local Y/M/D fields
 * off `Date` (never `.toISOString()`, which converts to UTC and can shift
 * the calendar day/month backward for any timezone ahead of UTC) keeps
 * this tied to the caller's real wall-clock date instead of a fixed region.
 */
export function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function currentYm(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${mm}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}
