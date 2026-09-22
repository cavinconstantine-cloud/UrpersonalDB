"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { AddCategoryModal } from "@/components/dashboard/add-category-modal";
import { LIAB_CATS, catColorVar, catIcon } from "@/lib/finance/constants";
import { LIAB_SCHEMAS, liabValue } from "@/lib/finance/schemas";
import type { HoldingRow } from "@/lib/finance/calculations";
import { fmtRp } from "@/lib/finance/format";

export function LiabilitySection({ liabCats, liabilities }: { liabCats: string[]; liabilities: HoldingRow[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const remaining = LIAB_CATS.filter((c) => !liabCats.includes(c));
  const byCat = Object.fromEntries(liabilities.map((l) => [l.category, l.data]));

  return (
    <>
      <SectionCard
        title="📌 Rincian Utang"
        action={
          <button
            className="text-xs text-brand-strong bg-brand/10 rounded-full px-3 py-1.5 font-medium shrink-0"
            onClick={() => setModalOpen(true)}
          >
            + Tambah kategori
          </button>
        }
      >
        {liabCats.length === 0 ? (
          <div className="text-sm text-text-dim py-2 pb-4">Belum ada utang tercatat.</div>
        ) : (
          liabCats.map((c) => {
            const data = byCat[c] || {};
            const schema = LIAB_SCHEMAS[c];
            const note = schema?.note?.(data) || "";
            return (
              <Link
                key={c}
                href={`/app/liabilities/${encodeURIComponent(c)}`}
                className="flex items-center justify-between gap-3 py-[11px] border-b border-hairline last:border-b-0 text-sm"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-base shrink-0"
                    style={{ background: `color-mix(in srgb, ${catColorVar(c)} 16%, transparent)` }}
                  >
                    {catIcon(c)}
                  </div>
                  <div className="min-w-0">
                    <div>{c}</div>
                    {note && <div className="text-xs text-text-dim">{note}</div>}
                  </div>
                </div>
                <div className="shrink-0">{fmtRp(liabValue(data))} ›</div>
              </Link>
            );
          })
        )}
      </SectionCard>
      <AddCategoryModal open={modalOpen} onClose={() => setModalOpen(false)} kind="liability" remaining={remaining} />
    </>
  );
}
