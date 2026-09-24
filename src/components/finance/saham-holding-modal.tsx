"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { TextField } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { fmtRp, nameOrKamu } from "@/lib/finance/format";
import { STOCK_LOT_SIZE } from "@/lib/finance/constants";
import { IDX_TICKERS, searchIdxTickers } from "@/lib/finance/idx-tickers";
import type { HoldingData } from "@/lib/finance/types";

export interface StockPriceInfo {
  companyName: string;
  price: number;
  changePct: number;
  asOf: string;
}

interface SahamHoldingModalProps {
  open: boolean;
  onClose: () => void;
  initial?: HoldingData;
  /** Ticker -> latest price info, from the daily stock-prices cron. */
  stockPrices: Record<string, StockPriceInfo>;
  onSave: (data: HoldingData, goalId: null) => Promise<void>;
  onDelete?: () => Promise<void>;
  userName?: string;
}

function fmtAsOf(asOf: string): string {
  try {
    return new Date(asOf).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return asOf;
  }
}

export function SahamHoldingModal({ open, onClose, initial, stockPrices, onSave, onDelete, userName }: SahamHoldingModalProps) {
  const who = nameOrKamu(userName);
  // Holdings added before ticker search existed only ever stored a free-text
  // `label` (the old field was literally "mis. BBCA") — no `ticker` key at
  // all. Recover it from the label so those users never have to re-enter
  // data: if it matches a known code exactly, treat that as the ticker.
  const initialLabel = typeof initial?.label === "string" ? initial.label.trim().toUpperCase() : "";
  const labelAsTicker = initialLabel && IDX_TICKERS.some((t) => t.ticker === initialLabel) ? initialLabel : null;
  const initialTicker = (typeof initial?.ticker === "string" ? initial.ticker : null) ?? labelAsTicker;
  const initialHasKnownTicker = Boolean(initialTicker && stockPrices[initialTicker]);

  const [step, setStep] = useState<"search" | "form">(initial ? "form" : "search");
  const [query, setQuery] = useState("");
  const [ticker, setTicker] = useState<string | null>(initialTicker);
  const [manualMode, setManualMode] = useState(Boolean(initial) && !initialHasKnownTicker);
  const [manualLabel, setManualLabel] = useState(typeof initial?.label === "string" ? initial.label : "");
  const [manualPrice, setManualPrice] = useState(Number(initial?.curPrice) || 0);
  const [lots, setLots] = useState(Number(initial?.qty) || 0);
  const [buyPrice, setBuyPrice] = useState(Number(initial?.buyPrice) || 0);
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const results = searchIdxTickers(query);
  const picked = ticker ? stockPrices[ticker] : null;
  const curPrice = manualMode ? manualPrice : (picked?.price ?? 0);
  const nilaiSekarang = lots * STOCK_LOT_SIZE * curPrice;
  const nilaiBeli = lots * STOCK_LOT_SIZE * buyPrice;
  const gain = nilaiSekarang - nilaiBeli;
  const gainPct = nilaiBeli > 0 ? (gain / nilaiBeli) * 100 : 0;

  function pickTicker(t: string) {
    setTicker(t);
    setManualMode(false);
    setStep("form");
  }

  function goManual() {
    setTicker(null);
    setManualMode(true);
    setManualLabel(query || "");
    setStep("form");
  }

  async function save() {
    const label = manualMode ? manualLabel.trim() || "Saham" : ticker || "";
    const data: HoldingData = {
      label,
      qty: lots,
      buyPrice,
      curPrice,
    };
    if (!manualMode && ticker) {
      data.ticker = ticker;
      data.priceAsOf = picked?.asOf ?? "";
    }
    setError(null);
    setPending("save");
    try {
      await onSave(data, null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan — coba lagi.");
    } finally {
      setPending(null);
    }
  }

  async function remove() {
    if (!onDelete) return;
    setError(null);
    setPending("delete");
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus — coba lagi.");
    } finally {
      setPending(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Saham">
      {step === "search" ? (
        <div>
          <TextField
            label="Cari kode saham atau nama perusahaan"
            placeholder="mis. BBCA atau Bank Central Asia"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <div className="max-h-[320px] overflow-y-auto -mx-1 px-1 mb-3">
            {results.map((r) => {
              const price = stockPrices[r.ticker];
              return (
                <button
                  key={r.ticker}
                  onClick={() => pickTicker(r.ticker)}
                  className="w-full flex items-center gap-3 text-left bg-bg-raised border border-hairline rounded-2xl px-3.5 py-3 mb-2"
                >
                  <span className="w-9 h-9 rounded-lg bg-brand/14 text-brand-strong flex items-center justify-center text-[10px] font-bold shrink-0">
                    {r.ticker.slice(0, 4)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-semibold">{r.ticker}</span>
                    <span className="block text-[11px] text-text-dim truncate">{r.name}</span>
                  </span>
                  {price && (
                    <span className="text-right shrink-0">
                      <span className="serif block text-[13px]">{fmtRp(price.price)}</span>
                      <span
                        className="block text-[10.5px] font-medium"
                        style={{ color: price.changePct >= 0 ? "var(--good)" : "var(--critical)" }}
                      >
                        {price.changePct >= 0 ? "+" : ""}
                        {price.changePct.toFixed(2)}%
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
            {results.length === 0 && (
              <div className="text-sm text-text-dim py-3 text-center">Tidak ada hasil untuk &quot;{query}&quot;.</div>
            )}
          </div>
          <button onClick={goManual} className="w-full text-center text-xs text-text-muted underline mb-3">
            Kode sahamnya nggak ketemu? Isi manual
          </button>
          <div className="flex gap-2 bg-brand/10 border border-brand/25 rounded-xl px-3 py-2.5 mb-4">
            <span className="text-xs shrink-0">💡</span>
            <span className="text-[11px] text-text-dim leading-relaxed">
              Harga yang ditampilkan adalah <b className="text-text">harga penutupan hari sebelumnya (H-1)</b>,
              diperbarui otomatis tiap hari kerja — bukan harga real-time/live.
            </span>
          </div>
          <Button fullWidth variant="ghost" onClick={onClose}>
            Batal
          </Button>
        </div>
      ) : (
        <div>
          {!manualMode && ticker && (
            <>
              <button onClick={() => setStep("search")} className="text-xs text-text-dim mb-3.5 block">
                ‹ Ganti saham
              </button>
              <div className="flex items-center gap-3 bg-bg-raised border border-hairline rounded-2xl p-3.5 mb-4">
                <span className="w-11 h-11 rounded-xl bg-brand/14 text-brand-strong flex items-center justify-center text-[11px] font-bold shrink-0">
                  {ticker.slice(0, 4)}
                </span>
                <div className="flex-1">
                  <div className="text-[15px] font-semibold">{ticker}</div>
                  <div className="text-[11.5px] text-text-dim">{picked?.companyName ?? ""}</div>
                </div>
                {picked && (
                  <div className="text-right">
                    <div className="serif text-[16px]">{fmtRp(picked.price)}</div>
                    <div className="text-[11px] font-medium" style={{ color: picked.changePct >= 0 ? "var(--good)" : "var(--critical)" }}>
                      {picked.changePct >= 0 ? "+" : ""}
                      {picked.changePct.toFixed(2)}% hari ini
                    </div>
                  </div>
                )}
              </div>
              {picked && (
                <div className="flex gap-2 bg-good/10 border border-good/30 rounded-xl px-3 py-2.5 mb-5">
                  <span className="text-xs shrink-0">🕒</span>
                  <span className="text-[11.5px] text-text-dim leading-relaxed">
                    Harga penutupan <b className="text-text">{fmtAsOf(picked.asOf)}</b> — <b className="text-text">bukan harga real-time/live</b>,
                    cuma diperbarui tiap hari kerja. {who[0].toUpperCase() + who.slice(1)} nggak perlu update manual.
                  </span>
                </div>
              )}
            </>
          )}

          {manualMode && (
            <>
              <button onClick={() => setStep("search")} className="text-xs text-text-dim mb-3.5 block">
                ‹ Cari lagi
              </button>
              <div className="flex gap-2.5 bg-warning/10 border border-warning/30 rounded-2xl p-3.5 mb-4">
                <span className="text-base leading-tight shrink-0">⚠️</span>
                <p className="text-xs text-text-dim leading-relaxed">
                  Harga otomatis nggak ketemu buat kode ini &mdash; mungkin belum ada di daftar kami. Isi harga
                  manual di bawah; kalau nanti kodenya kedetek otomatis {who} bisa ganti lewat &quot;Cari lagi&quot;.
                </p>
              </div>
              <TextField label="Nama saham" value={manualLabel} onChange={(e) => setManualLabel(e.target.value)} />
            </>
          )}

          <NumberField
            label="Jumlah Lot (1 lot = 100 lembar)"
            placeholder="0"
            value={lots}
            onValueChange={setLots}
            hint={`Setara ${(lots * STOCK_LOT_SIZE).toLocaleString("id-ID")} lembar`}
          />
          <NumberField label="Harga Beli /lembar (Rp)" placeholder="0" value={buyPrice} onValueChange={setBuyPrice} />

          {manualMode && (
            <NumberField
              label="Harga Sekarang /lembar (Rp) — manual"
              placeholder="0"
              value={manualPrice}
              onValueChange={setManualPrice}
            />
          )}

          {lots > 0 && (
            <div className="bg-bg-raised border border-hairline rounded-2xl p-3.5 mb-4">
              <div className="flex justify-between text-[13px] mb-2">
                <span className="text-text-dim">Nilai sekarang</span>
                <span className="serif">{fmtRp(nilaiSekarang)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-text-dim">Gain / loss</span>
                <span className="serif" style={{ color: gain >= 0 ? "var(--good)" : "var(--critical)" }}>
                  {gain >= 0 ? "+" : ""}
                  {fmtRp(gain)} ({gain >= 0 ? "+" : ""}
                  {gainPct.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-3 text-[12.5px] text-critical bg-critical/10 border border-critical/30 rounded-lg px-3 py-2.5 leading-relaxed">
              ⚠️ {error}
            </div>
          )}
          <Button fullWidth onClick={save} className="mt-1" disabled={pending !== null}>
            {pending === "save" ? (
              <>
                <Spinner size={14} /> Menyimpan…
              </>
            ) : (
              "Simpan"
            )}
          </Button>
          {onDelete && (
            <Button fullWidth variant="ghost" className="mt-2.5 text-critical" onClick={remove} disabled={pending !== null}>
              {pending === "delete" ? (
                <>
                  <Spinner size={14} /> Menghapus…
                </>
              ) : (
                "Hapus"
              )}
            </Button>
          )}
          <Button fullWidth variant="ghost" className="mt-2.5" onClick={onClose} disabled={pending !== null}>
            Batal
          </Button>
        </div>
      )}
    </Modal>
  );
}
