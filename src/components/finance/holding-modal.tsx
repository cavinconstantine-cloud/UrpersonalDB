"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SchemaForm } from "./schema-form";
import type { HoldingData, SchemaField } from "@/lib/finance/types";

export interface GoalOption {
  id: string;
  name: string;
}

interface HoldingModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: SchemaField[];
  initial?: HoldingData;
  note?: (h: HoldingData) => string;
  onSave: (data: HoldingData, goalId: string | null) => void;
  onDelete?: () => void;
  /** Cash/Deposito/Obligasi/Reksadana only — the goals this holding can be linked to. Omitted/empty hides the picker. */
  goals?: GoalOption[];
  initialGoalId?: string | null;
}

export function HoldingModal({
  open,
  onClose,
  title,
  fields,
  initial,
  note,
  onSave,
  onDelete,
  goals,
  initialGoalId,
}: HoldingModalProps) {
  const [values, setValues] = useState<HoldingData>(initial || {});
  const [goalId, setGoalId] = useState<string | null>(initialGoalId ?? null);

  function onChange(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function save() {
    const normalized: HoldingData = {};
    fields.forEach((f) => {
      const raw = values[f.key] ?? f.default ?? "";
      normalized[f.key] = f.type === "number" ? Number(raw) || 0 : raw;
    });
    onSave(normalized, goalId);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <SchemaForm fields={fields} values={values} onChange={onChange} noteText={note?.(values)} />
      {goals && goals.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm font-medium">🔗 Hubungkan ke Goal</span>
            <span className="text-xs text-text-muted">(opsional)</span>
          </div>
          <p className="text-xs text-text-muted mb-2.5 leading-relaxed">
            Nilai (dan bunga/kupon bulanannya, kalau ada) otomatis masuk ke progress goal yang dipilih. Satu aset hanya
            bisa terhubung ke satu goal.
          </p>
          <div className="flex flex-wrap gap-2">
            {goals.map((g) => (
              <Chip key={g.id} active={goalId === g.id} onClick={() => setGoalId(goalId === g.id ? null : g.id)}>
                {g.name}
              </Chip>
            ))}
          </div>
        </div>
      )}
      <Button fullWidth onClick={save}>
        Simpan
      </Button>
      {onDelete && (
        <Button
          fullWidth
          variant="ghost"
          className="mt-2.5 text-critical"
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          Hapus
        </Button>
      )}
      <Button fullWidth variant="ghost" className="mt-2.5" onClick={onClose}>
        Batal
      </Button>
    </Modal>
  );
}
