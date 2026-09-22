import type { Goal, HoldingData } from "@/lib/finance/types";

export type OnboardingStep = "account" | "assetPick" | "assetInput" | "liabPick" | "liabInput" | "cashflow" | "goals";

export interface OnboardingDraft {
  step: OnboardingStep;
  name: string;
  assetCats: string[];
  assetHoldings: Record<string, HoldingData[]>;
  assetIdx: number;
  liabCats: string[];
  liabData: Record<string, HoldingData>;
  liabIdx: number;
  cashflow: { income: string; fixedExpense: string; lifestyleExpense: string; invest: string };
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
    liabData: {},
    liabIdx: 0,
    cashflow: { income: "", fixedExpense: "", lifestyleExpense: "", invest: "" },
    goals: [],
  };
}

function key(userId: string) {
  return `uangku_onboarding_draft_${userId}`;
}

export function loadDraft(userId: string): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as OnboardingDraft) : null;
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
