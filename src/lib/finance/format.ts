export function fmtRp(n: number | string | undefined | null): string {
  const num = Number(n) || 0;
  return "Rp " + Math.round(num).toLocaleString("id-ID");
}

/**
 * Compact English K/M/B form (Rp1.28B, Rp42.5M, Rp800K) — the international
 * convention, as opposed to Indonesian "rb/jt" shorthand. Used on the English
 * dashboard cards where space is tight; full fmtRp() is still used wherever
 * precision matters more than density (transaction lists, per-category detail).
 */
export function fmtRpCompact(n: number | string | undefined | null): string {
  const num = Number(n) || 0;
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  const trim = (s: string) => s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  if (abs >= 1_000_000_000) return `${sign}Rp${trim((abs / 1_000_000_000).toFixed(2))}B`;
  if (abs >= 1_000_000) return `${sign}Rp${trim((abs / 1_000_000).toFixed(2))}M`;
  if (abs >= 1_000) return `${sign}Rp${Math.round(abs / 1_000)}K`;
  return `${sign}Rp${Math.round(abs)}`;
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

/**
 * True only when `updatedAtIso` is no more than `maxMinutes` old (default
 * 40 — a safety buffer above the ~30-minute intraday price-refresh
 * interval). A window this tight can never actually span into a prior
 * trading day, so no separate "is it still today" check is needed. Gates
 * any "diperbarui X menit lalu" style copy so it can never claim a price
 * is current when the background refresh actually failed, hasn't run yet
 * (e.g. a weekend or a missed beat from the external scheduler), or the
 * caller simply doesn't have a timestamp — always falls back to `false`
 * (never claims freshness) when unsure. Timezone-agnostic (a plain
 * duration check), so it's safe to call from a client component too.
 */
export function isFreshStockPrice(updatedAtIso: string | null | undefined, maxMinutes = 40): boolean {
  if (!updatedAtIso) return false;
  const updated = new Date(updatedAtIso);
  if (isNaN(updated.getTime())) return false;
  const ageMinutes = (Date.now() - updated.getTime()) / 60000;
  return ageMinutes >= -5 && ageMinutes <= maxMinutes; // small allowance for clock drift
}

/** "Diperbarui 12 menit lalu" — pairs with isFreshStockPrice(), never called unless that already returned true. */
export function fmtMinutesAgo(updatedAtIso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(updatedAtIso).getTime()) / 60000));
  if (mins < 1) return "Diperbarui baru saja";
  if (mins === 1) return "Diperbarui 1 menit lalu";
  return `Diperbarui ${mins} menit lalu`;
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

function daysInMonthUtc(year: number, month1Indexed: number): number {
  return new Date(Date.UTC(year, month1Indexed, 0)).getUTCDate();
}

/**
 * Start of the user's "current period" — for a Karyawan, this is their
 * payday_day (clamped to the month's real day count, e.g. 31 in February
 * lands on the 28th/29th) instead of the 1st of the calendar month, so a
 * bill charged right on payday doesn't get lumped into the tail end of the
 * *previous* period. Falls back to the plain calendar month when
 * `paydayDay` is null (Pengusaha, or no payday set yet).
 */
export function currentPeriodStartIsoInTz(tz: string, paydayDay: number | null | undefined): string {
  if (!paydayDay) return firstOfMonthIsoInTz(tz);

  const { y, m, d } = ymdInTz(new Date(), tz);
  const year = Number(y);
  const month = Number(m); // 1-indexed
  const day = Number(d);

  const effectiveDayThisMonth = Math.min(paydayDay, daysInMonthUtc(year, month));
  if (day >= effectiveDayThisMonth) {
    return `${y}-${m}-${String(effectiveDayThisMonth).padStart(2, "0")}`;
  }

  const prevMonthFirst = new Date(Date.UTC(year, month - 2, 1));
  const prevYear = prevMonthFirst.getUTCFullYear();
  const prevMonth = prevMonthFirst.getUTCMonth() + 1;
  const effectiveDayPrevMonth = Math.min(paydayDay, daysInMonthUtc(prevYear, prevMonth));
  return `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(effectiveDayPrevMonth).padStart(2, "0")}`;
}

/**
 * The payday-aligned date range for a given "YYYY-MM" label — a period is
 * labeled by the calendar month it *starts* in (so "September" with
 * payday_day=25 means Sep 25 → Oct 24, matching currentPeriodStartIsoInTz
 * and how recordFcfSnapshot keys its rows). `paydayDay` null/undefined
 * falls back to the plain calendar month (1st to last day). Pure date math,
 * no ambient timezone needed — safe to call from client components too.
 */
export function periodRangeForYm(ym: string, paydayDay: number | null | undefined): { start: string; end: string } {
  const [y, m] = ym.split("-").map(Number);

  if (!paydayDay) {
    const lastDay = daysInMonthUtc(y, m);
    return { start: `${ym}-01`, end: `${ym}-${String(lastDay).padStart(2, "0")}` };
  }

  const effectiveDayThisMonth = Math.min(paydayDay, daysInMonthUtc(y, m));
  const start = `${y}-${String(m).padStart(2, "0")}-${String(effectiveDayThisMonth).padStart(2, "0")}`;

  const nextMonthFirst = new Date(Date.UTC(y, m, 1)); // m is 1-indexed, so this IS next month's 1st
  const nextYear = nextMonthFirst.getUTCFullYear();
  const nextMonth = nextMonthFirst.getUTCMonth() + 1;
  const effectiveDayNextMonth = Math.min(paydayDay, daysInMonthUtc(nextYear, nextMonth));
  const endDate = new Date(Date.UTC(nextYear, nextMonth - 1, effectiveDayNextMonth));
  endDate.setUTCDate(endDate.getUTCDate() - 1);
  const end = `${endDate.getUTCFullYear()}-${String(endDate.getUTCMonth() + 1).padStart(2, "0")}-${String(endDate.getUTCDate()).padStart(2, "0")}`;

  return { start, end };
}
