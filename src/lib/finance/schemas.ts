import { CURRENCIES, KURS_REF, STOCK_LOT_SIZE } from "./constants";
import { fmtRp } from "./format";
import type { AssetSchema, HoldingData, LiabilitySchema } from "./types";

function num(h: HoldingData, key: string): number {
  return Number(h[key]) || 0;
}
function str(h: HoldingData, key: string): string {
  return typeof h[key] === "string" ? (h[key] as string) : "";
}

const CURRENCY_FIELD = {
  key: "currency",
  label: "Mata uang",
  type: "select" as const,
  options: CURRENCIES,
  default: "IDR",
};
const RATE_FIELD = {
  key: "rate",
  label: "Kurs ke IDR (isi jika bukan Rupiah)",
  type: "number" as const,
  step: "any",
  placeholder: "mis. 17745",
};

/** 1 for IDR holdings, else the manually-entered kurs-ke-IDR rate (from field `rateKey`, default "rate"). */
function fxRate(h: HoldingData, rateKey = "rate"): number {
  const currency = str(h, "currency") || "IDR";
  return currency === "IDR" ? 1 : num(h, rateKey);
}

/** Deposito already uses the `rate` key for its bunga (%), so its kurs field lives at `fxRate` instead. */
function depositoFxRate(h: HoldingData): number {
  return fxRate(h, "fxRate");
}

/**
 * For non-IDR holdings, shows the native-currency amount next to its Rupiah
 * equivalent (using the manually-entered kurs) plus the indicative BI
 * reference rate — e.g. "USD 1.000 ≈ Rp 17.745.000 · indikasi BI 22 Sep
 * 2026: Rp17.745,00". `nativeTotal` is the holding's value in its own
 * currency, before conversion. Returns "" for IDR holdings.
 */
function fxEquivNote(nativeTotal: number, h: HoldingData, rateKey = "rate"): string {
  const currency = str(h, "currency") || "IDR";
  if (currency === "IDR") return "";
  const rate = num(h, rateKey);
  const ref = KURS_REF.rates[currency];
  let line = `${currency} ${nativeTotal.toLocaleString("id-ID")}`;
  line += rate ? ` ≈ ${fmtRp(nativeTotal * rate)}` : " (kurs belum diisi)";
  if (ref) line += ` · indikasi BI ${KURS_REF.asOf}: Rp${ref.toLocaleString("id-ID", { maximumFractionDigits: 2 })}`;
  return line;
}

export const ASSET_SCHEMAS: Record<string, AssetSchema> = {
  Cash: {
    fields: [
      { key: "label", label: "Nama rekening", type: "text", placeholder: "mis. BCA Tabungan" },
      CURRENCY_FIELD,
      { key: "amount", label: "Saldo (dalam mata uang tsb)", type: "number" },
      RATE_FIELD,
    ],
    value: (h) => num(h, "amount") * fxRate(h),
    note: (h) => fxEquivNote(num(h, "amount"), h),
  },
  Deposito: {
    fields: [
      { key: "label", label: "Bank / nama deposito", type: "text", placeholder: "mis. Deposito BCA" },
      CURRENCY_FIELD,
      { key: "amount", label: "Nominal (sesuai mata uang di atas)", type: "number" },
      { key: "rate", label: "Bunga (% p.a.)", type: "number", step: "any", placeholder: "mis. 4.75" },
      { key: "tenor", label: "Tenor (bulan)", type: "number" },
      { key: "startDate", label: "Tanggal mulai", type: "date" },
      { ...RATE_FIELD, key: "fxRate", label: "Kurs ke IDR (isi jika bukan Rupiah)" },
    ],
    value: (h) => num(h, "amount") * depositoFxRate(h),
    note: (h) => {
      const amt = num(h, "amount");
      const bunga = num(h, "rate");
      const tenor = num(h, "tenor");
      const interest = amt * (bunga / 100) * (tenor / 12) * depositoFxRate(h);
      let maturity = "";
      const startDate = str(h, "startDate");
      if (startDate && tenor) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + tenor);
        maturity = d.toISOString().slice(0, 10);
      }
      const parts = [`Estimasi bunga ${fmtRp(interest)}${maturity ? " · jatuh tempo " + maturity : ""}`];
      const fx = fxEquivNote(amt, h, "fxRate");
      if (fx) parts.push(fx);
      return parts.join(" · ");
    },
  },
  Saham: {
    fields: [
      { key: "label", label: "Nama saham", type: "text", placeholder: "mis. BBCA" },
      { key: "qty", label: "Jumlah lot (1 lot = 100 lembar)", type: "number" },
      { key: "buyPrice", label: "Harga beli /lembar (Rp)", type: "number" },
      { key: "curPrice", label: "Harga sekarang /lembar (Rp)", type: "number" },
    ],
    value: (h) => num(h, "qty") * STOCK_LOT_SIZE * num(h, "curPrice"),
    buyValue: (h) => num(h, "qty") * STOCK_LOT_SIZE * num(h, "buyPrice"),
    note: (h) => {
      const lots = num(h, "qty");
      if (!lots) return "";
      return `Setara ${(lots * STOCK_LOT_SIZE).toLocaleString("id-ID")} lembar`;
    },
  },
  Obligasi: {
    fields: [
      { key: "label", label: "Nama obligasi", type: "text", placeholder: "mis. FR0100" },
      CURRENCY_FIELD,
      { key: "nominal", label: "Nominal beli (sesuai mata uang di atas)", type: "number" },
      { key: "buyPrice", label: "Harga beli (% dari nominal)", type: "number" },
      { key: "curPrice", label: "Harga sekarang (% dari nominal)", type: "number" },
      { key: "coupon", label: "Kupon (% p.a.)", type: "number", step: "any", placeholder: "mis. 6.25" },
      { key: "maturityDate", label: "Tanggal jatuh tempo", type: "date" },
      RATE_FIELD,
    ],
    value: (h) => ((num(h, "nominal") * num(h, "curPrice")) / 100) * fxRate(h),
    buyValue: (h) => ((num(h, "nominal") * num(h, "buyPrice")) / 100) * fxRate(h),
    note: (h) => {
      const nominal = num(h, "nominal");
      const coupon = num(h, "coupon");
      const annualCoupon = nominal * (coupon / 100) * fxRate(h);
      const parts: string[] = [];
      if (coupon) parts.push(`Proyeksi kupon ${fmtRp(annualCoupon)}/tahun (${coupon}%)`);
      const maturityDate = str(h, "maturityDate");
      if (maturityDate) parts.push(`jatuh tempo ${maturityDate}`);
      const fx = fxEquivNote((nominal * num(h, "curPrice")) / 100, h);
      if (fx) parts.push(fx);
      return parts.join(" · ");
    },
  },
  Reksadana: {
    fields: [
      { key: "label", label: "Nama produk", type: "text", placeholder: "mis. Reksadana Pasar Uang X" },
      CURRENCY_FIELD,
      { key: "qty", label: "Jumlah unit", type: "number" },
      { key: "buyPrice", label: "NAB beli /unit (sesuai mata uang di atas)", type: "number" },
      { key: "curPrice", label: "NAB sekarang /unit (sesuai mata uang di atas)", type: "number" },
      RATE_FIELD,
    ],
    value: (h) => num(h, "qty") * num(h, "curPrice") * fxRate(h),
    buyValue: (h) => num(h, "qty") * num(h, "buyPrice") * fxRate(h),
    note: (h) => fxEquivNote(num(h, "qty") * num(h, "curPrice"), h),
  },
  Properti: {
    fields: [
      { key: "label", label: "Nama / alamat", type: "text", placeholder: "mis. Rumah PIK" },
      { key: "buyPrice", label: "Nilai perolehan (Rp)", type: "number" },
      { key: "curPrice", label: "Estimasi nilai sekarang (Rp)", type: "number" },
    ],
    value: (h) => num(h, "curPrice"),
    buyValue: (h) => num(h, "buyPrice"),
  },
  Kendaraan: {
    fields: [
      { key: "label", label: "Nama kendaraan", type: "text", placeholder: "mis. Toyota Alphard 2022" },
      { key: "buyPrice", label: "Nilai perolehan (Rp)", type: "number" },
      { key: "curPrice", label: "Estimasi nilai sekarang (Rp)", type: "number" },
    ],
    value: (h) => num(h, "curPrice"),
    buyValue: (h) => num(h, "buyPrice"),
  },
  Emas: {
    fields: [
      { key: "label", label: "Jenis", type: "text", placeholder: "mis. Antam 10gr" },
      { key: "qty", label: "Berat (gram)", type: "number" },
      { key: "buyPrice", label: "Harga beli /gram (Rp)", type: "number" },
      { key: "curPrice", label: "Harga sekarang /gram (Rp)", type: "number" },
    ],
    value: (h) => num(h, "qty") * num(h, "curPrice"),
    buyValue: (h) => num(h, "qty") * num(h, "buyPrice"),
  },
  "Bisnis / Investasi Pribadi": {
    fields: [
      { key: "label", label: "Nama bisnis / investasi", type: "text" },
      { key: "buyPrice", label: "Nilai investasi awal (Rp)", type: "number" },
      { key: "curPrice", label: "Estimasi nilai sekarang (Rp)", type: "number" },
    ],
    value: (h) => num(h, "curPrice"),
    buyValue: (h) => num(h, "buyPrice"),
  },
};

function kprMonthlyPayment(h: HoldingData): number {
  const P = num(h, "amount");
  const n = num(h, "tenorRemaining");
  if (!P || !n) return 0;
  const r = num(h, "rate") / 100 / 12;
  if (r === 0) return P / n;
  const pow = Math.pow(1 + r, n);
  if (!isFinite(pow) || pow === 1) return P / n;
  return (P * r * pow) / (pow - 1);
}

const BILLING_DAY_FIELD = {
  key: "billingDay",
  label: "Tanggal billing (opsional, 1-31)",
  type: "number" as const,
  placeholder: "mis. 25",
};

function billingDayNote(h: HoldingData): string {
  const day = num(h, "billingDay");
  if (!day || day < 1 || day > 31) return "";
  return `billing tgl ${day} · reminder email aktif`;
}

export const LIAB_SCHEMAS: Record<string, LiabilitySchema> = {
  KPR: {
    fields: [
      { key: "label", label: "Nama / bank KPR", type: "text", placeholder: "mis. KPR BCA" },
      { key: "amount", label: "Sisa outstanding / OS (Rp)", type: "number" },
      { key: "rate", label: "Suku bunga (% p.a.)", type: "number", step: "any", placeholder: "mis. 8.5" },
      { key: "tenorRemaining", label: "Sisa tenor (bulan)", type: "number" },
      BILLING_DAY_FIELD,
    ],
    monthlyPayment: kprMonthlyPayment,
    note: (h) => {
      const parts: string[] = [];
      const payment = kprMonthlyPayment(h);
      if (payment) parts.push(`Estimasi cicilan ${fmtRp(payment)}/bulan`);
      const m = num(h, "tenorRemaining");
      if (m) {
        const d = new Date();
        d.setMonth(d.getMonth() + m);
        parts.push(`perkiraan lunas ${d.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`);
      }
      const billing = billingDayNote(h);
      if (billing) parts.push(billing);
      return parts.join(" · ");
    },
  },
  "Kartu Kredit": {
    fields: [
      { key: "label", label: "Nama kartu", type: "text", placeholder: "mis. BCA Everyday Card" },
      { key: "amount", label: "OS sekarang (Rp)", type: "number" },
      { key: "limit", label: "Limit kartu (Rp)", type: "number" },
      { key: "installment", label: "Pembayaran bulanan (perkiraan, Rp)", type: "number" },
      BILLING_DAY_FIELD,
    ],
    monthlyPayment: (h) => num(h, "installment"),
    note: (h) => {
      const parts: string[] = [];
      const limit = num(h, "limit");
      const os = num(h, "amount");
      if (limit) parts.push(`Utilisasi ${Math.round((os / limit) * 100)}% dari limit ${fmtRp(limit)}`);
      if (num(h, "installment")) parts.push(`Pembayaran bulanan ${fmtRp(num(h, "installment"))}`);
      const billing = billingDayNote(h);
      if (billing) parts.push(billing);
      return parts.join(" · ");
    },
  },
  "Pinjaman Lainnya": {
    fields: [
      { key: "label", label: "Nama pinjaman", type: "text", placeholder: "mis. Pinjaman KTA Bank X" },
      { key: "amount", label: "Sisa pokok (Rp)", type: "number" },
      { key: "installment", label: "Cicilan bulanan (Rp)", type: "number" },
      BILLING_DAY_FIELD,
    ],
    monthlyPayment: (h) => num(h, "installment"),
    note: (h) => {
      const parts: string[] = [];
      if (num(h, "installment")) parts.push(`Cicilan bulanan ${fmtRp(num(h, "installment"))}`);
      const billing = billingDayNote(h);
      if (billing) parts.push(billing);
      return parts.join(" · ");
    },
  },
};

export function liabValue(h: HoldingData): number {
  return num(h, "amount");
}
