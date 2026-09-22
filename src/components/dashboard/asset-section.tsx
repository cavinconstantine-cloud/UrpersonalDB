"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { AllocationBar } from "@/components/dashboard/allocation-bar";
import { AddCategoryModal } from "@/components/dashboard/add-category-modal";
import { ASSET_CATS, catColorVar, catIcon } from "@/lib/finance/constants";
import { catBuyValue, catValue, totalAssets, type HoldingRow } from "@/lib/finance/calculations";
import { fmtRp } from "@/lib/finance/format";

export function AssetSection({ assetCats, holdings }: { assetCats: string[]; holdings: HoldingRow[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const remaining = ASSET_CATS.filter((c) => !assetCats.includes(c));
  const total = totalAssets(assetCats, holdings);
  const slices = assetCats.map((c) => ({ category: c, value: Math.max(0, catValue(c, holdings)) }));

  return (
    <>
      <SectionCard
        title="📁 Rincian Aset"
        action={
          <button
            className="text-xs text-brand-strong bg-brand/10 rounded-full px-3 py-1.5 font-medium shrink-0"
            onClick={() => setModalOpen(true)}
          >
            + Tambah kategori
          </button>
        }
      >
        <AllocationBar slices={slices} total={total} />
        {assetCats.length === 0 ? (
          <div className="text-sm text-text-dim py-2 pb-4">Belum ada kategori aset.</div>
        ) : (
          assetCats.map((c) => {
            const val = catValue(c, holdings);
            const bv = catBuyValue(c, holdings);
            const gain = bv !== null ? val - bv : null;
            return (
              <Link
                key={c}
                href={`/app/assets/${encodeURIComponent(c)}`}
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
                    {gain !== null && (
                      <div className="text-xs" style={{ color: gain >= 0 ? "var(--good)" : "var(--critical)" }}>
                        {gain >= 0 ? "+" : ""}
                        {fmtRp(gain)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0">{fmtRp(val)} ›</div>
              </Link>
            );
          })
        )}
      </SectionCard>
      <AddCategoryModal open={modalOpen} onClose={() => setModalOpen(false)} kind="asset" remaining={remaining} />
    </>
  );
}
