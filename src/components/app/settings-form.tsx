"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/ui/field";
import { NumberField } from "@/components/ui/number-field";
import { Button } from "@/components/ui/button";
import { updateProfileName, updateCashflow } from "@/app/app/settings/actions";

interface SettingsFormProps {
  initialName: string;
  initialOtherCashflow: { lifestyleExpense: number; invest: number };
}

export function SettingsForm({ initialName, initialOtherCashflow }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [cf, setCf] = useState(initialOtherCashflow);
  const [saved, setSaved] = useState<string | null>(null);

  function saveProfile() {
    startTransition(async () => {
      await updateProfileName(name);
      setSaved("profile");
      router.refresh();
      setTimeout(() => setSaved(null), 2000);
    });
  }

  function saveCashflow() {
    startTransition(async () => {
      await updateCashflow(cf);
      setSaved("cashflow");
      router.refresh();
      setTimeout(() => setSaved(null), 2000);
    });
  }

  return (
    <div>
      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-3">Profil</div>
        <TextField label="Nama" value={name} onChange={(e) => setName(e.target.value)} />
        <Button size="sm" onClick={saveProfile} disabled={isPending}>
          {saved === "profile" ? "Tersimpan ✓" : "Simpan nama"}
        </Button>
      </div>

      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-3">Arus kas lainnya</div>
        <NumberField
          label="Lifestyle expense (Rp/bulan)"
          value={cf.lifestyleExpense}
          onValueChange={(n) => setCf((v) => ({ ...v, lifestyleExpense: n }))}
          placeholder="0"
        />
        <NumberField
          label="Investasi rutin (Rp/bulan)"
          value={cf.invest}
          onValueChange={(n) => setCf((v) => ({ ...v, invest: n }))}
          placeholder="0"
        />
        <Button size="sm" onClick={saveCashflow} disabled={isPending}>
          {saved === "cashflow" ? "Tersimpan ✓" : "Simpan"}
        </Button>
      </div>
    </div>
  );
}
