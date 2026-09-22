"use server";

import Anthropic from "@anthropic-ai/sdk";
import { getDashboardData } from "@/lib/data/dashboard";
import {
  cashflowNums,
  computeDBR,
  liquidAssets,
  monthExpenseTotal,
  monthIncomeTotal,
  netWorth,
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

export async function generateAiInsight(): Promise<AiInsightResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Fitur AI belum dikonfigurasi. Tambahkan ANTHROPIC_API_KEY di environment." };
  }

  const data = await getDashboardData();

  const cf = cashflowNums(
    {
      income: Number(data.cashflow.income),
      fixedExpense: Number(data.cashflow.fixed_expense),
      lifestyleExpense: Number(data.cashflow.lifestyle_expense),
      invest: Number(data.cashflow.invest),
    },
    monthExpenseTotal(
      data.monthExpenses.map((e) => ({ id: e.id, date: e.expense_date, category: e.category, amount: e.amount, description: e.description })),
    ),
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
    monthIncomeTracked: monthIncomeTotal(
      data.monthIncomes.map((i) => ({ id: i.id, date: i.income_date, category: i.category, amount: i.amount, description: i.description })),
    ),
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
  } catch {
    return { ok: false, error: "Terjadi kendala saat menganalisa. Coba lagi sebentar lagi." };
  }
}
