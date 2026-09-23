import type { Goal, HoldingData } from "@/lib/finance/types";

export type OnboardingStep = "account" | "assetPick" | "assetInput" | "liabPick" | "liabInput" | "cashflow" | "goals";

export interface FixedExpenseItem {
  id: string;
  label: string;
  amount: number;
}

export interface OnboardingDraft {
  step: OnboardingStep;
  name: string;
  assetCats: string[];
  assetHoldings: Record<string, HoldingData[]>;
  assetIdx: number;
  liabCats: string[];
  liabHoldings: Record<string, HoldingData[]>;
  liabIdx: number;
  cashflow: { income: string; lifestyleExpense: string; invest: string };
  fixedExpenseItems: FixedExpenseItem[];
  goals: Goal[];
}

export function emptyDraft(name = ""): OnboardingDraft {
  return {
    step: "account",
    name,
    assetCats: [],
    assetHoldings: {},
    assetIdx: 0,
    liabCats: [],
    liabHoldings: {},
    liabIdx: 0,
    cashflow: { income: "", lifestyleExpense: "", invest: "" },
    fixedExpenseItems: [],
    goals: [],
  };
}

function key(userId: string) {
  return `uangku_onboarding_draft_${userId}`;
}

export function loadDraft(userId: string): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnboardingDraft & { liabData?: Record<string, HoldingData> };
    // Defensive fallback for a draft saved before fixedExpenseItems existed.
    if (!parsed.fixedExpenseItems) parsed.fixedExpenseItems = [];
    // Defensive fallback for a draft saved before liabilities became
    // multi-holding: the old shape was `liabData: Record<string,
    // HoldingData>` (one holding per category), renamed to `liabHoldings:
    // Record<string, HoldingData[]>`. Without this, a returning user with a
    // pre-migration draft hits `draft.liabHoldings[cat]` on `undefined` the
    // moment they reach the liability input step, crashing onboarding.
    if (!parsed.liabHoldings) {
      parsed.liabHoldings = {};
      if (parsed.liabData) {
        for (const [cat, holding] of Object.entries(parsed.liabData)) {
          parsed.liabHoldings[cat] = [holding];
        }
      }
    }
    delete parsed.liabData;
    if (!parsed.assetHoldings) parsed.assetHoldings = {};
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(userId: string, draft: OnboardingDraft) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(draft));
  } catch {
    // best-effort only — final submit always writes to Supabase
  }
}

export function clearDraft(userId: string) {
  try {
    localStorage.removeItem(key(userId));
  } catch {
    // ignore
  }
}
