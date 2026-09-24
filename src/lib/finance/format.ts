export function fmtRp(n: number | string | undefined | null): string {
  const num = Number(n) || 0;
  return "Rp " + Math.round(num).toLocaleString("id-ID");
}

/** Mid-sentence address — the user's name, or lowercase "kamu" when none is set yet. */
export function nameOrKamu(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed || "kamu";
}

/** Sentence-start address — the user's name, or capitalized "Kamu" when none is set yet. */
export function capNameOrKamu(name: string | null | undefined): string {
  const label = nameOrKamu(name);
  return label === "kamu" ? "Kamu" : label;
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

function ymdInTz(date: Date, tz: string): { y: string; m: string; d: string } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(
    date,
  );
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** Same as todayIso(), but for a request that has no ambient timezone of its own (a server render) and needs to follow a specific visitor's instead — see getVisitorTimezone(). */
export function todayIsoInTz(tz: string): string {
  const { y, m, d } = ymdInTz(new Date(), tz);
  return `${y}-${m}-${d}`;
}

/** Same as currentYm(), but for a given IANA timezone (see todayIsoInTz). */
export function currentYmInTz(tz: string): string {
  const { y, m } = ymdInTz(new Date(), tz);
  return `${y}-${m}`;
}

export function firstOfMonthIsoInTz(tz: string): string {
  const { y, m } = ymdInTz(new Date(), tz);
  return `${y}-${m}-01`;
}

/** `days` ago as a calendar date in `tz` — computed off that day's own Y/M/D so it isn't sensitive to DST shifts landing exactly on a day boundary. */
export function daysAgoIsoInTz(days: number, tz: string): string {
  const { y, m, d } = ymdInTz(new Date(), tz);
  const base = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  base.setUTCDate(base.getUTCDate() - days);
  const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(base.getUTCDate()).padStart(2, "0");
  return `${base.getUTCFullYear()}-${mm}-${dd}`;
}

export function monthsAgoFirstOfMonthIsoInTz(months: number, tz: string): string {
  const { y, m } = ymdInTz(new Date(), tz);
  const base = new Date(Date.UTC(Number(y), Number(m) - 1 - months, 1));
  const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
  return `${base.getUTCFullYear()}-${mm}-01`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}
