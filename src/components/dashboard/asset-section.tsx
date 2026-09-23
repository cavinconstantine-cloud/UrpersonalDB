"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { AllocationBar } from "@/components/dashboard/allocation-bar";
import { AddCategoryModal } from "@/components/dashboard/add-category-modal";
import { MovementBadge } from "@/components/ui/movement-badge";
import { ASSET_CATS, catColorVar, catIcon } from "@/lib/finance/constants";
import {
  catBuyValue,
  catValue,
  categoryDailyMovement,
  dailyMovementByHolding,
  holdingValue,
  totalAssets,
  type AssetSnapshotRow,
  type HoldingRowWithId,
} from "@/lib/finance/calculations";
import { fmtRp } from "@/lib/finance/format";

export function AssetSection({
  assetCats,
  holdings,
  snapshots,
}: {
  assetCats: string[];
  holdings: HoldingRowWithId[];
  snapshots: AssetSnapshotRow[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const remaining = ASSET_CATS.filter((c) => !assetCats.includes(c));
  const total = totalAssets(assetCats, holdings);
  const slices = assetCats.map((c) => ({ category: c, value: Math.max(0, catValue(c, holdings)) }));

  const movementByHolding = dailyMovementByHolding(snapshots, holdings);
  const cashAccounts = holdings
    .filter((h) => h.category === "Cash")
    .map((h) => ({
      id: h.id,
      label: typeof h.data.label === "string" && h.data.label ? h.data.label : "Rekening",
      value: holdingValue(h.category, h.data),
      movement: movementByHolding.get(h.id) ?? null,
    }))
    .sort((a, b) => (a.movement?.pctChange ?? Infinity) - (b.movement?.pctChange ?? Infinity));

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
            const movement = categoryDailyMovement(c, snapshots, holdings);
            const isCash = c === "Cash";
            return (
              <div key={c} className="border-b border-hairline last:border-b-0">
                <Link
                  href={`/app/assets/${encodeURIComponent(c)}`}
                  className="flex items-center justify-between gap-3 py-[11px] text-sm"
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
                  <div className="flex items-center gap-2 shrink-0">
                    {!isCash && <MovementBadge movement={movement} />}
                    <span>{fmtRp(val)} ›</span>
                  </div>
                </Link>
                {isCash && cashAccounts.length > 0 && (
                  <div className="flex flex-col gap-2 pl-[44px] pb-3">
                    {cashAccounts.map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-text-dim truncate">{acc.label}</span>
                          <MovementBadge movement={acc.movement} />
                        </div>
                        <div className="text-text-dim shrink-0">{fmtRp(acc.value)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </SectionCard>
      <AddCategoryModal open={modalOpen} onClose={() => setModalOpen(false)} kind="asset" remaining={remaining} />
    </>
  );
}
