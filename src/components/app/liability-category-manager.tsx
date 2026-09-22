"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SchemaForm } from "@/components/finance/schema-form";
import { LIAB_SCHEMAS } from "@/lib/finance/schemas";
import { saveLiability, removeLiabilityCategory } from "@/app/app/liabilities/actions";
import type { HoldingData } from "@/lib/finance/types";

export function LiabilityCategoryManager({ category, initial }: { category: string; initial: HoldingData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<HoldingData>(initial);
  const schema = LIAB_SCHEMAS[category];

  function onChange(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function save() {
    const normalized: HoldingData = {};
    schema.fields.forEach((f) => {
      normalized[f.key] = Number(values[f.key]) || 0;
    });
    startTransition(async () => {
      await saveLiability(category, normalized);
      router.refresh();
    });
  }

  function removeCategory() {
    if (!confirm(`Hapus kategori "${category}" beserta datanya?`)) return;
    startTransition(async () => {
      await removeLiabilityCategory(category);
      router.push("/app");
    });
  }

  return (
    <div>
      <SchemaForm fields={schema.fields} values={values} onChange={onChange} noteText={schema.note?.(values)} />
      <Button fullWidth onClick={save} disabled={isPending}>
        {isPending ? "Menyimpan…" : "Simpan"}
      </Button>
      <Button variant="danger" fullWidth className="mt-2.5" onClick={removeCategory} disabled={isPending}>
        Hapus kategori ini
      </Button>
    </div>
  );
}
