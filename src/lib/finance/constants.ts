import type { FieldOption } from "./types";

export const ASSET_CATS = [
  "Cash",
  "Deposito",
  "Saham",
  "Obligasi",
  "Reksadana",
  "Properti",
  "Kendaraan",
  "Emas",
  "Bisnis / Investasi Pribadi",
] as const;

export const LIAB_CATS = ["KPR", "Kartu Kredit", "Pinjaman Lainnya"] as const;

export const EXPENSE_CATS = [
  "Makan & Minum",
  "Transportasi",
  "Belanja",
  "Hiburan",
  "Tagihan",
  "Kesehatan",
  "Lainnya",
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  Cash: "💵",
  Deposito: "🏦",
  Saham: "📈",
  Obligasi: "📜",
  Reksadana: "🧺",
  Properti: "🏠",
  Kendaraan: "🚗",
  Emas: "🪙",
  "Bisnis / Investasi Pribadi": "💼",
  KPR: "🏡",
  "Kartu Kredit": "💳",
  "Pinjaman Lainnya": "📄",
};

export const EXPENSE_CAT_ICONS: Record<string, string> = {
  "Makan & Minum": "🍽️",
  Transportasi: "🚕",
  Belanja: "🛍️",
  Hiburan: "🎬",
  Tagihan: "🧾",
  Kesehatan: "💊",
  Lainnya: "✨",
};

/**
 * Fixed categorical hue order (dataviz palette, series-1..8) plus one distinct
 * extra hue for the 9th asset category. Assigned in this exact order so the
 * same category always reads as the same color across the app — never cycled
 * or re-derived per render.
 */
export const CATEGORY_COLOR_VARS: Record<string, string> = {
  Cash: "var(--series-1)",
  Deposito: "var(--series-3)",
  Saham: "var(--series-2)",
  Obligasi: "var(--series-7)",
  Reksadana: "var(--series-4)",
  Properti: "var(--series-5)",
  Kendaraan: "var(--series-6)",
  Emas: "var(--series-8)",
  "Bisnis / Investasi Pribadi": "#8b6a3f",
  KPR: "var(--series-7)",
  "Kartu Kredit": "var(--series-2)",
  "Pinjaman Lainnya": "var(--series-8)",
};

export const EXPENSE_CATEGORY_COLOR_VARS: Record<string, string> = {
  "Makan & Minum": "var(--series-2)",
  Transportasi: "var(--series-1)",
  Belanja: "var(--series-5)",
  Hiburan: "var(--series-7)",
  Tagihan: "var(--series-4)",
  Kesehatan: "var(--series-3)",
  Lainnya: "var(--series-8)",
};

export function catIcon(cat: string): string {
  return CATEGORY_ICONS[cat] || "•";
}
export function expenseCatIcon(cat: string): string {
  return EXPENSE_CAT_ICONS[cat] || "💸";
}
export function catColorVar(cat: string): string {
  return CATEGORY_COLOR_VARS[cat] || "var(--text-muted)";
}
export function expenseCatColorVar(cat: string): string {
  return EXPENSE_CATEGORY_COLOR_VARS[cat] || "var(--text-muted)";
}

export const CURRENCIES: FieldOption[] = [
  { value: "IDR", label: "IDR — Rupiah" },
  { value: "USD", label: "USD — Dolar AS" },
  { value: "SGD", label: "SGD — Dolar Singapura" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "JPY", label: "JPY — Yen Jepang" },
  { value: "CNY", label: "CNY — Yuan China" },
  { value: "AUD", label: "AUD — Dolar Australia" },
];

/**
 * Indicative mid-rate (kurs tengah) reference, IDR per 1 unit of foreign
 * currency. Static snapshot — NOT live. Refresh this block periodically, or
 * wire it to a live FX API for a production deployment.
 */
export const KURS_REF = {
  asOf: "22 Sep 2026",
  source: "kurs tengah transaksi Bank Indonesia",
  rates: { USD: 17745.0, SGD: 13901.3, EUR: 20381.03, JPY: 112.6703, CNY: 2649.5, AUD: 12640.66 } as Record<
    string,
    number
  >,
};

/** IDX (Bursa Efek Indonesia) standard lot size: 1 lot = 100 lembar saham. */
export const STOCK_LOT_SIZE = 100;

export const GOAL_PRESETS = [
  "Dana Darurat",
  "Pernikahan",
  "Rumah",
  "Pendidikan Anak",
  "Pensiun",
  "Liburan",
  "Kendaraan",
];
