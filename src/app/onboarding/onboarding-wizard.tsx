"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { emptyDraft, loadDraft, saveDraft, clearDraft, type OnboardingDraft, type OnboardingStep } from "@/lib/onboarding/draft";
import { completeOnboarding } from "./actions";
import { ProgressDots } from "@/components/ui/chip";
import { AccountStep } from "./steps/account-step";
import { ProfileTypeStep } from "./steps/profile-type-step";
import { KaryawanPaydayStep } from "./steps/karyawan-payday-step";
import { PengusahaIntroStep } from "./steps/pengusaha-intro-step";
import { AssetPickStep } from "./steps/asset-pick-step";
import { AssetInputStep } from "./steps/asset-input-step";
import { LiabPickStep } from "./steps/liab-pick-step";
import { LiabInputStep } from "./steps/liab-input-step";
import { CashflowStep } from "./steps/cashflow-step";
import { GoalsStep } from "./steps/goals-step";
import type { StockPriceInfo } from "@/components/finance/saham-holding-modal";
import { ToastProvider } from "@/components/ui/toast";

const STEP_NUMBER: Record<OnboardingStep, number> = {
  account: 1,
  profileType: 2,
  karyawanPayday: 3,
  pengusahaIntro: 3,
  assetPick: 4,
  assetInput: 4,
  liabPick: 4,
  liabInput: 4,
  cashflow: 5,
  goals: 6,
};
const TOTAL_STEPS = 6;

export function OnboardingWizard({
  userId,
  initialName,
  stockPrices,
}: {
  userId: string;
  initialName: string;
  stockPrices: Record<string, StockPriceInfo>;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<OnboardingDraft>(() => {
    if (typeof window === "undefined") return emptyDraft(initialName);
    return loadDraft(userId) || emptyDraft(initialName);
  });
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [isPending, startTransition] = useTransition();
  const [finishError, setFinishError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated) saveDraft(userId, draft);
  }, [draft, hydrated, userId]);

  function update(patch: Partial<OnboardingDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function finish() {
    setFinishError(null);
    startTransition(async () => {
      try {
        await completeOnboarding(draft);
        clearDraft(userId);
        router.push("/app");
      } catch (err) {
        setFinishError(err instanceof Error ? err.message : "Gagal menyimpan — coba lagi.");
      }
    });
  }

  if (!hydrated) return null;

  return (
    <ToastProvider>
      <div className="max-w-[520px] mx-auto min-h-full px-5 py-7">
        {draft.step !== "assetInput" && draft.step !== "liabInput" && (
          <ProgressDots current={STEP_NUMBER[draft.step]} total={TOTAL_STEPS} />
        )}
        <div className="animate-fade-up" key={draft.step + draft.assetIdx + draft.liabIdx}>
          {draft.step === "account" && <AccountStep draft={draft} update={update} />}
          {draft.step === "profileType" && <ProfileTypeStep draft={draft} update={update} />}
          {draft.step === "karyawanPayday" && <KaryawanPaydayStep draft={draft} update={update} />}
          {draft.step === "pengusahaIntro" && <PengusahaIntroStep draft={draft} update={update} />}
          {draft.step === "assetPick" && <AssetPickStep draft={draft} update={update} />}
          {draft.step === "assetInput" && <AssetInputStep draft={draft} update={update} stockPrices={stockPrices} />}
          {draft.step === "liabPick" && <LiabPickStep draft={draft} update={update} />}
          {draft.step === "liabInput" && <LiabInputStep draft={draft} update={update} />}
          {draft.step === "cashflow" && <CashflowStep draft={draft} update={update} />}
          {draft.step === "goals" && (
            <GoalsStep
              draft={draft}
              update={update}
              onFinish={finish}
              finishing={isPending}
              finishError={finishError}
            />
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
