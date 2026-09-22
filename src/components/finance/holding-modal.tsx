"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { SchemaForm } from "./schema-form";
import type { HoldingData, SchemaField } from "@/lib/finance/types";

interface HoldingModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: SchemaField[];
  initial?: HoldingData;
  note?: (h: HoldingData) => string;
  onSave: (data: HoldingData) => void;
  onDelete?: () => void;
}

export function HoldingModal({ open, onClose, title, fields, initial, note, onSave, onDelete }: HoldingModalProps) {
  const [values, setValues] = useState<HoldingData>(initial || {});

  function onChange(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function save() {
    const normalized: HoldingData = {};
    fields.forEach((f) => {
      const raw = values[f.key] ?? f.default ?? "";
      normalized[f.key] = f.type === "number" ? Number(raw) || 0 : raw;
    });
    onSave(normalized);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <SchemaForm fields={fields} values={values} onChange={onChange} noteText={note?.(values)} />
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
