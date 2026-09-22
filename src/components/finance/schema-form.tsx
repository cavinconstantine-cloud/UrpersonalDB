"use client";

import { TextField, SelectField } from "@/components/ui/field";
import { NumberField } from "@/components/ui/number-field";
import { KURS_REF } from "@/lib/finance/constants";
import type { HoldingData, SchemaField } from "@/lib/finance/types";

interface SchemaFormProps {
  fields: SchemaField[];
  values: HoldingData;
  onChange: (key: string, value: string) => void;
  noteText?: string;
}

export function SchemaForm({ fields, values, onChange, noteText }: SchemaFormProps) {
  const showKursHint = fields.some((f) => f.key === "currency");
  const currency = String(values.currency || "IDR");
  const kursRef = KURS_REF.rates[currency];

  return (
    <div>
      {fields.map((f) => {
        const val = values[f.key] ?? f.default ?? "";
        if (f.type === "select") {
          return (
            <SelectField
              key={f.key}
              label={f.label}
              value={String(val)}
              options={f.options || []}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          );
        }
        if (f.type === "number" && f.grouped) {
          return (
            <div key={f.key}>
              <NumberField
                label={f.label}
                placeholder={f.placeholder}
                value={Number(val) || 0}
                onValueChange={(n) => onChange(f.key, String(n))}
              />
            </div>
          );
        }
        return (
          <div key={f.key}>
            <TextField
              label={f.label}
              type={f.type}
              inputMode={f.type === "number" ? "decimal" : undefined}
              step={f.step}
              placeholder={f.placeholder}
              value={String(val)}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
            {showKursHint && (f.key === "rate" || f.key === "fxRate") && currency !== "IDR" && kursRef ? (
              <div className="-mt-3 mb-4 text-xs text-text-dim leading-relaxed">
                Kurs indikasi {KURS_REF.source} ({KURS_REF.asOf}):{" "}
                <strong className="text-text">
                  Rp{kursRef.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                </strong>{" "}
                —{" "}
                <button
                  type="button"
                  className="text-brand-strong hover:underline"
                  onClick={() => onChange(f.key, String(kursRef))}
                >
                  gunakan kurs ini
                </button>
                . Bukan kurs real-time, hanya pembanding.
              </div>
            ) : null}
          </div>
        );
      })}
      {noteText ? <div className="-mt-2 mb-4 text-xs text-text-dim leading-relaxed">{noteText}</div> : null}
    </div>
  );
}
