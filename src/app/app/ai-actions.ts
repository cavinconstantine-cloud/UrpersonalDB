"use server";

import Anthropic from "@anthropic-ai/sdk";
import { getFinancialSnapshotData } from "@/lib/data/dashboard";
import { getVisitorTimezone } from "@/lib/i18n/timezone";
import {
  cashflowNums,
  computeDBR,
  investmentIncomeMonthly,
  liquidAssets,
  monthExpenseTotal,
  monthIncomeTotal,
  netWorth,
  rollingAverageMonthlyIncome,
  totalAssets,
  totalLiabilities,
} from "@/lib/finance/calculations";
import { buildFinancialSnapshot } from "@/lib/finance/snapshot";

export interface AiInsightResult {
  ok: boolean;
  text?: string;
  error?: string;
}

export async function isAiInsightAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function generateGoalProgressInsight(
  goals: Array<{ id: string; name: string; target: number; current: number; targetDate: string }>,
  fcf: number,
  monthlyIncome: number,
  userName: string,
): Promise<AiInsightResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Fitur AI belum dikonfigurasi." };
  }

  if (!goals || goals.length === 0) {
    return { ok: false };
  }

  const goalsText = goals
    .map((g) => {
      const remaining = g.target - g.current;
      const monthsLeft = 12; // simplified, ideally calculate from targetDate
      const monthlyNeeded = remaining > 0 ? Math.ceil(remaining / monthsLeft) : 0;
      return `- ${g.name}: target Rp ${Number(g.target).toLocaleString("id-ID")}, sudah Rp ${Number(g.current).toLocaleString("id-ID")} (sisa Rp ${remaining.toLocaleString("id-ID")}, target ${g.targetDate})`;
    })
    .join("\n");

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `Anda adalah asisten keuangan pribadi berbahasa Indonesia. Analisa feasibility goals ${userName} dengan FCF & income mereka:

Goals:
${goalsText}

Kondisi Finansial:
- Free Cash Flow (FCF): Rp ${fcf.toLocaleString("id-ID")}/bulan
- Monthly Income: Rp ${monthlyIncome.toLocaleString("id-ID")}/bulan

Instruksi:
1. Hitung total monthly allocation yang dibutuhkan untuk semua goals.
2. Bandingkan dengan FCF yang tersedia.
3. Jika gap: beri rekomendasi konkret (extend target date, kurangi lifestyle expense, atau adjust goals).
4. Jika feasible: confirm dan beri tips optimization.

Format: 3-4 kalimat, actionable, spesifik dengan angka. Jangan generic.
Contoh: "Untuk mencapai semua goals tepat waktu, ${userName} perlu menabung Rp X/bulan, tapi FCF hanya Rp Y/bulan. Pertimbangkan A atau B."`,
        },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!text) return { ok: false, error: "AI tidak menghasilkan jawaban. Coba lagi." };
    return { ok: true, text };
  } catch (err) {
    console.error("generateGoalProgressInsight: Anthropic call failed:", err);
    if (err instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "ANTHROPIC_API_KEY tidak valid — cek kembali key-nya di Vercel." };
    }
    if (err instanceof Anthropic.PermissionDeniedError) {
      return {
        ok: false,
        error: "Akun Anthropic belum punya akses ke model ini, atau billing/credit belum aktif di console.anthropic.com.",
      };
    }
    if (err instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Terlalu banyak request ke AI sekaligus. Tunggu sebentar lalu coba lagi." };
    }
    if (err instanceof Anthropic.BadRequestError) {
      return { ok: false, error: `Ditolak Claude API: ${err.message}` };
    }
    if (err instanceof Error) {
      return { ok: false, error: `Terjadi kendala saat menganalisa: ${err.message}` };
    }
    return { ok: false, error: "Terjadi kendala saat menganalisa. Coba lagi sebentar lagi." };
  }
}

export async function generateAiInsight(): Promise<AiInsightResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Fitur AI belum dikonfigurasi. Tambahkan ANTHROPIC_API_KEY di environment." };
  }

  const tz = await getVisitorTimezone();
  const data = await getFinancialSnapshotData(tz);

  // Auto-generated payday transactions are excluded here — FCF is already
  // fed by the flat planning totals (cf.income/cf.fixedExpense) below, so
  // counting them again would double-count. See page.tsx for the same rule.
  // `null` ym: data.monthIncomes is already scoped to the current period
  // (payday-to-payday for Karyawan) by getFinancialSnapshotData() — see
  // page.tsx for why a calendar "YYYY-MM" filter here would be wrong.
  const monthIncomeTracked = monthIncomeTotal(
    data.monthIncomes
      .filter((i) => !i.is_auto_recurring)
      .map((i) => ({ id: i.id, date: i.income_date, category: i.category, amount: i.amount, description: i.description })),
    null,
  );
  const investIncomeMonthly = investmentIncomeMonthly(data.holdings);
  const isPengusaha = data.profile.profile_type === "pengusaha";
  const trackedIncomeForCf = isPengusaha
    ? rollingAverageMonthlyIncome(
        data.incomesLast3Months
          .filter((i) => !i.is_auto_recurring)
          .map((i) => ({ id: i.id, date: i.income_date, category: i.category, amount: i.amount, description: i.description })),
      )
    : monthIncomeTracked;

  const cf = cashflowNums(
    {
      income: Number(data.cashflow.income),
      fixedExpense: Number(data.cashflow.fixed_expense),
      lifestyleExpense: Number(data.cashflow.lifestyle_expense),
      invest: Number(data.cashflow.invest),
    },
    monthExpenseTotal(
      data.monthExpenses
        .filter((e) => !e.is_auto_recurring)
        .map((e) => ({ id: e.id, date: e.expense_date, category: e.category, amount: e.amount, description: e.description })),
      null,
    ),
    trackedIncomeForCf + investIncomeMonthly,
  );
  const dbr = computeDBR(cf, data.liabilities);
  const totalAssetsVal = totalAssets(data.profile.asset_categories, data.holdings);
  const totalLiabVal = totalLiabilities(data.liabilities);

  const snapshot = buildFinancialSnapshot({
    netWorth: netWorth(data.profile.asset_categories, data.holdings, data.liabilities),
    totalAssets: totalAssetsVal,
    totalLiabilities: totalLiabVal,
    assetCats: data.profile.asset_categories,
    liabCats: data.profile.liability_categories,
    holdings: data.holdings,
    liabRows: data.liabilities,
    cf,
    dbr,
    goals: data.goals,
    liquidAssets: liquidAssets(data.holdings),
    monthIncomeTracked,
  });

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 700,
      messages: [
        {
          role: "user",
          content: `Anda adalah asisten keuangan pribadi. Berikut ringkasan data keuangan seorang pengguna, dalam Rupiah:

${snapshot}

Tulis dalam Bahasa Indonesia, singkat dan langsung ke inti:
1. Ringkasan kondisi finansial saat ini (2-3 kalimat) — soroti hal paling penting: likuiditas, konsentrasi aset, DBR, atau progress goals.
2. 2-4 saran yang actionable dan spesifik berdasarkan angka di atas (bukan saran generik).
Jangan menyebut nama produk investasi atau saham tertentu — cukup arahan umum (mis. "tambah alokasi aset likuid", "pertimbangkan negosiasi ulang KPR"). Jangan mengulang seluruh angka mentah yang sudah ada di dashboard.`,
        },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!text) return { ok: false, error: "AI tidak menghasilkan jawaban. Coba lagi." };
    return { ok: true, text };
  } catch (err) {
    console.error("generateAiInsight: Anthropic call failed:", err);
    if (err instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "ANTHROPIC_API_KEY tidak valid — cek kembali key-nya di Vercel." };
    }
    if (err instanceof Anthropic.PermissionDeniedError) {
      return {
        ok: false,
        error: "Akun Anthropic belum punya akses ke model ini, atau billing/credit belum aktif di console.anthropic.com.",
      };
    }
    if (err instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Terlalu banyak request ke AI sekaligus. Tunggu sebentar lalu coba lagi." };
    }
    if (err instanceof Anthropic.BadRequestError) {
      return { ok: false, error: `Ditolak Claude API: ${err.message}` };
    }
    if (err instanceof Error) {
      return { ok: false, error: `Terjadi kendala saat menganalisa: ${err.message}` };
    }
    return { ok: false, error: "Terjadi kendala saat menganalisa. Coba lagi sebentar lagi." };
  }
}
