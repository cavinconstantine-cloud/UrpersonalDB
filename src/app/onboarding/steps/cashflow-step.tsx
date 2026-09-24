"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { NumberField, NumberInput } from "@/components/ui/number-field";
import { fmtRp } from "@/lib/finance/format";
import type { OnboardingDraft } from "@/lib/onboarding/draft";

export function CashflowStep({
  draft,
  update,
}: {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState(0);
  const [newAccountIdx, setNewAccountIdx] = useState<number | null>(null);

  function set(key: "income", value: number) {
    update({ cashflow: { ...draft.cashflow, [key]: value ? String(value) : "" } });
  }

  const cashHoldings = draft.assetHoldings["Cash"] || [];
  const hasCash = cashHoldings.length > 0;
  const fixedTotal = draft.fixedExpenseItems.reduce((s, it) => s + it.amount, 0);
  const isPengusaha = draft.profileType === "pengusaha";
  const income = Number(draft.cashflow.income) || 0;
  const canProceed = isPengusaha || income === 0 || draft.incomeAccountIdx !== null;

  function goAddCashAccount() {
    const idx = draft.assetCats.indexOf("Cash");
    if (idx >= 0) {
      update({ step: "assetInput", assetIdx: idx });
      return;
    }
    const nextCats = [...draft.assetCats, "Cash"];
    update({ assetCats: nextCats, step: "assetInput", assetIdx: nextCats.length - 1 });
  }

  function addItem() {
    const label = newLabel.trim();
    if (!label || newAmount <= 0 || newAccountIdx === null) return;
    update({
      fixedExpenseItems: [
        ...draft.fixedExpenseItems,
        { id: crypto.randomUUID(), label, amount: newAmount, accountIdx: newAccountIdx },
      ],
    });
    setNewLabel("");
    setNewAmount(0);
    setNewAccountIdx(null);
  }

  function removeItem(id: string) {
    update({ fixedExpenseItems: draft.fixedExpenseItems.filter((it) => it.id !== id) });
  }

  function back() {
    if (draft.liabCats.length === 0) {
      update({ step: "liabPick" });
      return;
    }
    update({ step: "liabInput", liabIdx: draft.liabCats.length - 1 });
  }

  const noCashNotice = (
    <div className="flex gap-2 bg-warning/10 border border-warning/30 rounded-xl px-3 py-2.5">
      <span className="text-sm shrink-0">⚠️</span>
      <div className="text-xs text-text-dim leading-relaxed">
        Belum ada rekening. Tiap gaji &amp; pengeluaran tetap harus terhubung ke satu rekening.
        <button onClick={goAddCashAccount} className="block mt-1.5 text-brand-strong font-medium underline">
          + Tambah rekening dulu
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h1 className="serif text-[26px] font-medium">Arus kas bulanan</h1>
        <span
          className={
            isPengusaha
              ? "text-[9px] font-bold tracking-wide text-good bg-good/14 border border-good/35 rounded-full px-[7px] py-0.5"
              : "text-[9px] font-bold tracking-wide text-brand-strong bg-brand/14 border border-brand/35 rounded-full px-[7px] py-0.5"
          }
        >
          {isPengusaha ? "PENGUSAHA" : "KARYAWAN"}
        </span>
      </div>
      <p className="text-text-dim text-sm mb-4 leading-relaxed">
        {isPengusaha
          ? "Fixed cost rutinmu aja yang diisi di sini — pendapatan usaha dihitung otomatis dari transaksi yang kamu catat."
          : "Angka rata-rata per bulan cukup. Kamu bisa perbarui kapan saja."}
      </p>

      {isPengusaha ? (
        <div className="border border-dashed border-brand/40 rounded-2xl p-3.5 mb-[18px]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm">📊</span>
            <span className="text-[12.5px] font-medium">Pendapatan (dihitung otomatis)</span>
          </div>
          <div className="text-[11.5px] text-text-dim leading-relaxed">
            Nggak perlu diisi manual — begitu kamu mulai catat pendapatan usaha, Uangku pakai rata-rata rolling 3
            bulan terakhir buat hitung Free Cash Flow kamu.
          </div>
        </div>
      ) : (
        <>
          {draft.paydayDay != null && (
            <div className="flex gap-2 bg-good/10 border border-good/30 rounded-2xl px-3.5 py-3 mb-[18px]">
              <span className="text-sm">🗓️</span>
              <span className="text-xs text-text-dim leading-relaxed">
                Gajian &amp; fixed expense kamu otomatis jalan tanggal{" "}
                <b className="text-good">{draft.paydayDay}</b> tiap bulan (dari langkah sebelumnya) — bisa diubah
                lagi nanti di Pengaturan.
              </span>
            </div>
          )}
          <div className="flex gap-2.5 bg-brand/10 border border-brand/20 rounded-2xl p-3.5 mb-6">
            <span className="text-base leading-tight">💡</span>
            <p className="text-xs text-text-dim leading-relaxed">
              Kenapa ini ditanya? Income dikurangi semua pengeluaran dan investasi rutin ={" "}
              <span className="text-text font-medium">Free Cash Flow</span> bulananmu — angka utama yang dipakai di
              seluruh dashboard, termasuk saving rate dan progress goals. Fixed expense sekarang bisa dirinci per
              item — data yang sama dipakai di halaman <span className="text-text font-medium">Arus Kas Tetap</span>,
              jadi tidak perlu diisi dua kali nanti.
            </p>
          </div>

          <NumberField
            label="Income (Rp/bulan)"
            placeholder="0"
            value={income}
            onValueChange={(n) => set("income", n)}
          />

          {income > 0 && (
            <div className="mb-[18px] -mt-2">
              <label className="text-xs text-text-dim mb-1.5 block">Gaji masuk ke rekening mana?</label>
              {hasCash ? (
                <div className="flex flex-wrap gap-2">
                  {cashHoldings.map((h, i) => (
                    <Chip
                      key={i}
                      active={draft.incomeAccountIdx === i}
                      onClick={() => update({ incomeAccountIdx: draft.incomeAccountIdx === i ? null : i })}
                    >
                      🏦 {String(h.label || "Rekening")}
                    </Chip>
                  ))}
                </div>
              ) : (
                noCashNotice
              )}
            </div>
          )}
        </>
      )}

      <div className="mb-[18px]">
        <div className="flex justify-between items-baseline mb-1.5">
          <label className="text-xs text-text-dim">Fixed expense — cicilan, sewa, sekolah</label>
          <span className="text-xs text-brand-strong font-medium">{fmtRp(fixedTotal)}/bln</span>
        </div>
        <div className="border border-hairline rounded-lg bg-bg-input p-2.5">
          {draft.fixedExpenseItems.length === 0 ? (
            <div className="text-xs text-text-dim py-1.5 px-1">Belum ada item.</div>
          ) : (
            draft.fixedExpenseItems.map((it) => (
              <div key={it.id} className="flex items-center gap-2 py-1.5 border-b border-hairline last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{it.label}</div>
                  {it.accountIdx !== null && cashHoldings[it.accountIdx] && (
                    <div className="text-[10.5px] text-text-dim">
                      🏦 {String(cashHoldings[it.accountIdx].label || "Rekening")}
                    </div>
                  )}
                </div>
                <span className="text-sm text-text-dim shrink-0">{fmtRp(it.amount)}</span>
                <button
                  onClick={() => removeItem(it.id)}
                  className="text-xs text-critical bg-critical/10 rounded-full px-2.5 py-1 shrink-0"
                >
                  Hapus
                </button>
              </div>
            ))
          )}
          {hasCash ? (
            <>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="mis. Cicilan mobil"
                  className="flex-1 min-w-0 text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg text-text"
                />
                <NumberInput
                  value={newAmount}
                  onValueChange={setNewAmount}
                  placeholder="Rp"
                  className="w-[110px] text-sm px-2.5 py-2 rounded-md border border-hairline bg-bg text-text"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {cashHoldings.map((h, i) => (
                  <Chip
                    key={i}
                    active={newAccountIdx === i}
                    className="px-2.5 py-1 text-[11px]"
                    onClick={() => setNewAccountIdx(newAccountIdx === i ? null : i)}
                  >
                    🏦 {String(h.label || "Rekening")}
                  </Chip>
                ))}
              </div>
              <button
                onClick={addItem}
                disabled={!newLabel.trim() || newAmount <= 0 || newAccountIdx === null}
                className="w-full mt-2 text-sm text-text-dim border border-dashed border-hairline rounded-md py-2 disabled:opacity-40"
              >
                + Tambah item
              </button>
            </>
          ) : (
            <div className="mt-2">{noCashNotice}</div>
          )}
        </div>
      </div>

      {!canProceed && (
        <p className="text-xs text-critical mb-2 leading-relaxed">Pilih dulu rekening tujuan gaji sebelum lanjut.</p>
      )}
      <div className="flex gap-2.5 mt-2">
        <Button variant="ghost" onClick={back} className="w-[90px] flex-none">
          Kembali
        </Button>
        <Button onClick={() => update({ step: "goals" })} className="flex-1" disabled={!canProceed}>
          Lanjut
        </Button>
      </div>
    </div>
  );
}
