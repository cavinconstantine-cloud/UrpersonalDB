"use client";

import { useState, useTransition } from "react";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { updateProfileType } from "@/app/app/settings/actions";
import type { ProfileType } from "@/lib/onboarding/draft";

interface ProfileTypeSettingsProps {
  initialProfileType: ProfileType;
  initialPaydayDay: number | null;
}

export function ProfileTypeSettings({ initialProfileType, initialPaydayDay }: ProfileTypeSettingsProps) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [profileType, setProfileType] = useState<ProfileType>(initialProfileType);
  const [paydayDay, setPaydayDay] = useState(initialPaydayDay ?? 25);
  const [saved, setSaved] = useState(false);

  function save() {
    if (!profileType) return;
    startTransition(async () => {
      try {
        await updateProfileType({ profileType, paydayDay: profileType === "karyawan" ? paydayDay : null });
        setSaved(true);
        // No router.refresh() needed — this action's revalidatePath() calls
        // already cause Next.js to re-render the affected server segments
        // once the transition settles.
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal menyimpan — coba lagi.");
      }
    });
  }

  return (
    <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
      <div className="serif text-[15px] mb-1">Tipe Profil</div>
      <p className="text-xs text-text-dim mb-3 leading-relaxed">
        Nentuin cara Uangku ngitung arus kas bulananmu — gaji tetap atau pendapatan yang naik-turun.
      </p>

      <div className="flex gap-2 mb-3">
        <Chip active={profileType === "karyawan"} onClick={() => setProfileType("karyawan")}>
          💼 Karyawan
        </Chip>
        <Chip active={profileType === "pengusaha"} onClick={() => setProfileType("pengusaha")}>
          📈 Pengusaha &amp; Freelancer
        </Chip>
      </div>

      {profileType === "karyawan" && (
        <div className="mb-3">
          <div className="text-xs text-text-dim mb-1.5">Tanggal gajian</div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPaydayDay(n)}
                className={cn(
                  "aspect-square rounded-lg text-xs font-medium border transition duration-150 active:scale-95",
                  n === paydayDay
                    ? "bg-brand/18 text-brand-strong border-brand"
                    : "bg-bg-input text-text-dim border-hairline",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button size="sm" onClick={save} disabled={isPending || !profileType}>
        {isPending ? <Spinner size={14} /> : saved ? "Tersimpan" : "Simpan"}
      </Button>
    </div>
  );
}
