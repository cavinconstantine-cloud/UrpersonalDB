"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { updateProfileName, updateCashflow } from "@/app/app/settings/actions";

interface SettingsFormProps {
  initialName: string;
  initialCashflow: { income: number; fixedExpense: number; lifestyleExpense: number; invest: number };
}

export function SettingsForm({ initialName, initialCashflow }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [cf, setCf] = useState(initialCashflow);
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
        <div className="serif text-[15px] mb-3">Arus kas bulanan</div>
        <TextField
          label="Income (Rp/bulan)"
          type="number"
          inputMode="numeric"
          value={cf.income}
          onChange={(e) => setCf((v) => ({ ...v, income: Number(e.target.value) || 0 }))}
        />
        <TextField
          label="Fixed expense (Rp/bulan)"
          type="number"
          inputMode="numeric"
          value={cf.fixedExpense}
          onChange={(e) => setCf((v) => ({ ...v, fixedExpense: Number(e.target.value) || 0 }))}
        />
        <TextField
          label="Lifestyle expense (Rp/bulan)"
          type="number"
          inputMode="numeric"
          value={cf.lifestyleExpense}
          onChange={(e) => setCf((v) => ({ ...v, lifestyleExpense: Number(e.target.value) || 0 }))}
        />
        <TextField
          label="Investasi rutin (Rp/bulan)"
          type="number"
          inputMode="numeric"
          value={cf.invest}
          onChange={(e) => setCf((v) => ({ ...v, invest: Number(e.target.value) || 0 }))}
        />
        <Button size="sm" onClick={saveCashflow} disabled={isPending}>
          {saved === "cashflow" ? "Tersimpan ✓" : "Simpan arus kas"}
        </Button>
      </div>
    </div>
  );
}
