"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Camera, Image as ImageIcon, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { NumberInput } from "@/components/ui/number-field";
import { fmtRp, nameOrKamu } from "@/lib/finance/format";
import { cn } from "@/lib/utils";
import {
  allocateSplit,
  assignedUnits,
  isFullyAssigned,
  type SplitAssignments,
  type SplitItem,
  type SplitParticipant,
  type SplitSharedMode,
  type SplitSharedWith,
} from "@/lib/finance/split";
import { createBillSplit, extractReceipt, reportMisread, type ExtractedReceipt } from "@/app/app/split/actions";
import type { CashAccount } from "@/components/app/transaction-modal";

type Step = "photo" | "review" | "assign" | "result" | "shared";

interface SplitBillFlowProps {
  cashAccounts: CashAccount[];
  userName?: string | null;
  onDone: () => void;
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

const AVATAR_COLORS = ["bg-good", "bg-brand", "bg-warning", "bg-critical", "bg-text-muted"];

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * A phone camera photo is easily 3-8MB — way past both Next.js's Server
 * Action body limit and Vercel's platform request-size ceiling, so sending
 * it straight to `extractReceipt` fails the POST itself (shows up as a raw
 * browser "server error" page, not our in-app error UI). Downscaling to a
 * sane max dimension and re-encoding as JPEG keeps it consistently small —
 * receipts are text, not photography, so this costs nothing extraction can
 * actually use, and it makes the vision call faster too.
 */
async function readFileAsBase64(file: File): Promise<{ base64: string; mediaType: string }> {
  const dataUrl = await readFileAsDataUrl(file);
  try {
    const img = new Image();
    const loaded: HTMLImageElement = await new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
    const scale = Math.min(1, MAX_DIMENSION / Math.max(loaded.width, loaded.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(loaded.width * scale);
    canvas.height = Math.round(loaded.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas context");
    ctx.drawImage(loaded, 0, 0, canvas.width, canvas.height);
    const resizedDataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    return { base64: resizedDataUrl.split(",")[1] ?? "", mediaType: "image/jpeg" };
  } catch {
    // Resize failed (e.g. HEIC the browser can't decode into <img>) — fall
    // back to the original file as-is rather than blocking the upload.
    return { base64: dataUrl.split(",")[1] ?? "", mediaType: file.type || "image/jpeg" };
  }
}

export function SplitBillFlow({ cashAccounts, userName, onDone }: SplitBillFlowProps) {
  const [step, setStep] = useState<Step>("photo");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [imagePath, setImagePath] = useState<string | null>(null);
  const [misreadSent, setMisreadSent] = useState(false);

  const [title, setTitle] = useState("");
  const [items, setItems] = useState<SplitItem[]>([]);
  const [tax, setTax] = useState(0);
  const [service, setService] = useState(0);

  const [participants, setParticipants] = useState<SplitParticipant[]>([
    { id: "creator", name: userName?.trim() || "Kamu", isCreator: true },
  ]);
  const [newParticipantName, setNewParticipantName] = useState("");

  const [assignments, setAssignments] = useState<SplitAssignments>({});
  const [sharedMode, setSharedMode] = useState<SplitSharedMode>({});
  const [sharedWith, setSharedWith] = useState<SplitSharedWith>({});
  const [accountHoldingId, setAccountHoldingId] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Revoke the object URL whenever it's replaced or the component unmounts —
  // otherwise each photo picked leaks the previous preview's memory.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const result = useMemo(
    () => allocateSplit(items, participants, assignments, tax, service, sharedMode, sharedWith),
    [items, participants, assignments, tax, service, sharedMode, sharedWith],
  );
  const fullyAssigned = useMemo(
    () => isFullyAssigned(items, assignments, sharedMode, sharedWith),
    [items, assignments, sharedMode, sharedWith],
  );

  function applyExtraction(extraction: ExtractedReceipt) {
    setTitle(extraction.merchant || "Struk Belanja");
    setItems(extraction.items.map((it) => ({ id: newId(), name: it.name, qty: it.qty, unitPrice: it.unitPrice })));
    setTax(extraction.tax);
    setService(extraction.service);
    setStep("review");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setPreviewUrl(URL.createObjectURL(file));
    startTransition(async () => {
      const { base64, mediaType } = await readFileAsBase64(file);
      const res = await extractReceipt(base64, mediaType);
      setImagePath(res.imagePath ?? null);
      if (res.ok && res.extraction) {
        applyExtraction(res.extraction);
      } else {
        setError(res.error || "Gagal membaca struk.");
      }
    });
  }

  function skipToManual() {
    setError("");
    setTitle("");
    setItems([]);
    setTax(0);
    setService(0);
    setStep("review");
  }

  function sendMisreadReport() {
    startTransition(async () => {
      await reportMisread(imagePath, `Gagal/salah baca struk untuk: ${title || "(tanpa nama)"}`);
      setMisreadSent(true);
    });
  }

  function updateItem(id: string, patch: Partial<SplitItem>) {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function removeItem(id: string) {
    setItems((list) => list.filter((it) => it.id !== id));
    setAssignments((a) => {
      const next = { ...a };
      delete next[id];
      return next;
    });
    setSharedMode((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
    setSharedWith((w) => {
      const next = { ...w };
      delete next[id];
      return next;
    });
  }
  function addItem() {
    setItems((list) => [...list, { id: newId(), name: "", qty: 1, unitPrice: 0 }]);
  }

  function addParticipant() {
    const name = newParticipantName.trim();
    if (!name) return;
    setParticipants((list) => [...list, { id: newId(), name, isCreator: false }]);
    setNewParticipantName("");
  }
  function removeParticipant(id: string) {
    setParticipants((list) => list.filter((p) => p.id !== id));
    setAssignments((a) => {
      const next: SplitAssignments = {};
      for (const [itemId, byParticipant] of Object.entries(a)) {
        const rest = { ...byParticipant };
        delete rest[id];
        next[itemId] = rest;
      }
      return next;
    });
    setSharedWith((w) => {
      const next: SplitSharedWith = {};
      for (const [itemId, people] of Object.entries(w)) {
        next[itemId] = people.filter((pid) => pid !== id);
      }
      return next;
    });
  }

  function tapAssign(item: SplitItem, participantId: string) {
    setAssignments((a) => {
      const forItem = { ...(a[item.id] ?? {}) };
      const totalAssigned = Object.values(forItem).reduce((s, n) => s + n, 0);
      if (totalAssigned >= item.qty) return a;
      forItem[participantId] = (forItem[participantId] ?? 0) + 1;
      return { ...a, [item.id]: forItem };
    });
  }
  function unassign(item: SplitItem, participantId: string) {
    setAssignments((a) => {
      const forItem = { ...(a[item.id] ?? {}) };
      if (!forItem[participantId]) return a;
      forItem[participantId] = Math.max(0, forItem[participantId] - 1);
      return { ...a, [item.id]: forItem };
    });
  }
  function resetItemAssignment(itemId: string) {
    setAssignments((a) => ({ ...a, [itemId]: {} }));
  }
  function assignAllToOne(item: SplitItem, participantId: string) {
    setAssignments((a) => ({ ...a, [item.id]: { [participantId]: item.qty } }));
  }

  /** Switching an item's mode clears the other mode's data for it, so stale state can't leak in. */
  function setItemMode(itemId: string, shared: boolean) {
    setSharedMode((m) => ({ ...m, [itemId]: shared }));
    if (shared) {
      setAssignments((a) => ({ ...a, [itemId]: {} }));
    } else {
      setSharedWith((w) => ({ ...w, [itemId]: [] }));
    }
  }
  function toggleSharedParticipant(itemId: string, participantId: string) {
    setSharedWith((w) => {
      const current = w[itemId] ?? [];
      const next = current.includes(participantId) ? current.filter((id) => id !== participantId) : [...current, participantId];
      return { ...w, [itemId]: next };
    });
  }

  function goToAssign() {
    if (items.length === 0) {
      setError("Tambahkan minimal satu item dulu.");
      return;
    }
    if (items.some((it) => !it.name.trim())) {
      setError("Isi nama semua item dulu.");
      return;
    }
    setError("");
    setStep("assign");
  }

  function handleCreate() {
    setError("");
    startTransition(async () => {
      const res = await createBillSplit({
        title: title || "Split Tagihan",
        merchant: title || null,
        receiptImagePath: imagePath,
        items,
        participants,
        assignments,
        sharedMode,
        sharedWith,
        tax,
        service,
        accountHoldingId,
      });
      if (res.ok && res.shareToken) {
        setShareToken(res.shareToken);
        setStep("shared");
      } else {
        setError(res.error || "Gagal membuat split.");
      }
    });
  }

  const shareUrl = shareToken && typeof window !== "undefined" ? `${window.location.origin}/split/${shareToken}` : "";

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-bold tracking-wide text-warning bg-warning/14 border border-warning/35 rounded-full px-2 py-0.5">
          BETA
        </span>
        <span className="text-xs text-text-dim">Split Bill — masih tahap belajar AI-nya</span>
      </div>

      {step === "photo" && (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-text-dim leading-relaxed mb-1">
            Foto atau upload struknya, Uangku baca item &amp; harganya otomatis. Hasilnya tetap bisa kamu koreksi sebelum disimpan.
          </p>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          {isPending && previewUrl ? (
            <div className="relative rounded-2xl border-[1.5px] border-brand overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element -- transient client-side object URL, not a served asset */}
              <img src={previewUrl} alt="Struk yang sedang dipindai" className="w-full max-h-72 object-contain bg-bg-sunken" />
              <div className="absolute inset-0 bg-brand/10" />
              <div
                className="absolute inset-x-0 h-1/3 animate-scan-sweep pointer-events-none"
                style={{ background: "linear-gradient(180deg, transparent, rgba(124,110,242,0.55), transparent)" }}
              />
              <div className="absolute inset-0 flex items-end justify-center pb-4">
                <span className="flex items-center gap-2 rounded-full bg-bg/90 border border-brand/40 px-3.5 py-1.5 text-xs font-medium text-brand-strong animate-scan-pulse">
                  <Camera size={13} /> Membaca struk…
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-brand bg-bg-raised py-7 px-3 disabled:opacity-60"
              >
                <span className="w-12 h-12 rounded-full bg-brand/14 flex items-center justify-center">
                  <Camera size={22} className="text-brand-strong" />
                </span>
                <span className="text-sm font-medium text-text">Ambil Foto</span>
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-brand bg-bg-raised py-7 px-3 disabled:opacity-60"
              >
                <span className="w-12 h-12 rounded-full bg-brand/14 flex items-center justify-center">
                  <ImageIcon size={22} className="text-brand-strong" />
                </span>
                <span className="text-sm font-medium text-text">Upload dari Galeri</span>
              </button>
            </div>
          )}

          {error && <div className="text-xs text-critical">{error}</div>}
          {!isPending && (
            <button type="button" onClick={skipToManual} className="text-xs text-text-dim underline self-center mt-1">
              Isi manual tanpa foto
            </button>
          )}
        </div>
      )}

      {step === "review" && (
        <div>
          <TextField label="Untuk apa?" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mis. Dinner di Sushi Tei" />

          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs text-text-dim">Item</span>
          </div>
          <div className="flex flex-col gap-2 mb-3">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-1.5">
                <input
                  value={it.name}
                  onChange={(e) => updateItem(it.id, { name: e.target.value })}
                  placeholder="Nama item"
                  className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-hairline bg-bg-input text-text text-[13px]"
                />
                <NumberInput
                  value={it.qty}
                  onValueChange={(n) => updateItem(it.id, { qty: Math.max(1, n) })}
                  className="w-12 px-1.5 py-2 rounded-lg border border-hairline bg-bg-input text-text text-[13px] text-center"
                />
                <NumberInput
                  value={it.unitPrice}
                  onValueChange={(n) => updateItem(it.id, { unitPrice: n })}
                  className="w-24 px-2 py-2 rounded-lg border border-hairline bg-bg-input text-text text-[13px] text-right"
                />
                <button type="button" onClick={() => removeItem(it.id)} className="p-1.5 text-text-muted">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem} className="text-xs text-brand-strong mb-4">
            + Tambah item
          </button>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-text-dim mb-1.5">Pajak (Rp)</label>
              <NumberInput
                value={tax}
                onValueChange={setTax}
                className="w-full px-3 py-2.5 rounded-lg border border-hairline bg-bg-input text-text text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-text-dim mb-1.5">Service (Rp)</label>
              <NumberInput
                value={service}
                onValueChange={setService}
                className="w-full px-3 py-2.5 rounded-lg border border-hairline bg-bg-input text-text text-sm"
              />
            </div>
          </div>

          <div className="mb-4">
            <span className="text-xs text-text-dim mb-1.5 block">Siapa aja yang ikut?</span>
            <div className="flex flex-wrap gap-2">
              {participants.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-hairline bg-bg-raised text-text"
                >
                  {p.name} {p.isCreator && <span className="text-text-muted">(kamu)</span>}
                  {!p.isCreator && (
                    <button type="button" onClick={() => removeParticipant(p.id)} className="text-text-muted">
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addParticipant()}
                placeholder="Nama orang baru"
                className="flex-1 px-3 py-2 rounded-lg border border-hairline bg-bg-input text-text text-sm"
              />
              <Button size="sm" variant="ghost" onClick={addParticipant}>
                Tambah
              </Button>
            </div>
          </div>

          {!misreadSent ? (
            <button type="button" onClick={sendMisreadReport} disabled={isPending} className="text-xs text-critical mb-3">
              🚩 Ada yang salah baca? Laporkan
            </button>
          ) : (
            <div className="text-xs text-good mb-3">✓ Laporan terkirim, makasih!</div>
          )}

          {error && <div className="mb-3 text-xs text-critical">{error}</div>}
          <Button fullWidth onClick={goToAssign}>
            Lanjut: Assign Item →
          </Button>
        </div>
      )}

      {step === "assign" && (
        <div>
          <p className="text-[13px] text-text-dim leading-relaxed mb-3">
            Tap avatar buat assign tiap unit item ke orangnya. Item yang dipesan bareng (menu tengah)? Ganti ke &quot;Bagi Rata&quot; dan pilih siapa aja yang ikut patungan.
          </p>
          <div className="flex flex-col gap-3 mb-4">
            {items.map((item) => {
              const shared = sharedMode[item.id] ?? false;
              const sharers = sharedWith[item.id] ?? [];
              const assigned = assignedUnits(item, assignments);
              const complete = shared ? sharers.length > 0 : assigned === item.qty;
              const lineTotal = item.qty * item.unitPrice;
              const perHead = sharers.length > 0 ? Math.floor(lineTotal / sharers.length) : 0;
              return (
                <div key={item.id} className={cn("rounded-xl border p-3", complete ? "border-good/35 bg-good/10" : "border-hairline bg-bg-raised")}>
                  <div className="flex rounded-lg bg-bg-input p-0.5 mb-2.5 w-fit">
                    <button
                      type="button"
                      onClick={() => setItemMode(item.id, false)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium",
                        !shared ? "bg-bg-raised text-text shadow-sm" : "text-text-dim",
                      )}
                    >
                      Per Orang
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemMode(item.id, true)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-medium",
                        shared ? "bg-brand text-brand-ink shadow-sm" : "text-text-dim",
                      )}
                    >
                      Bagi Rata
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-medium text-text">
                      {item.name} <span className="text-text-muted">× {item.qty}</span>
                    </span>
                    <span className={cn("text-[11px] font-medium", complete ? "text-good" : "text-warning")}>
                      {shared ? `Dibagi ${sharers.length} orang` : `Terisi ${assigned} dari ${item.qty}`}
                    </span>
                  </div>

                  {shared ? (
                    <>
                      <div className="flex flex-wrap gap-3 mb-1.5">
                        {participants.map((p, i) => {
                          const picked = sharers.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => toggleSharedParticipant(item.id, p.id)}
                              title={`${picked ? "Keluarkan" : "Ikutkan"} ${p.name} dari patungan ${item.name}`}
                              className="flex flex-col items-center gap-1"
                            >
                              <span className="relative">
                                <span
                                  className={cn(
                                    "w-7 h-7 rounded-full text-white text-[11px] font-semibold flex items-center justify-center",
                                    AVATAR_COLORS[i % AVATAR_COLORS.length],
                                    !picked && "opacity-35",
                                  )}
                                >
                                  {p.name.slice(0, 1).toUpperCase()}
                                </span>
                                {picked && (
                                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-good text-white text-[8px] flex items-center justify-center">
                                    ✓
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-text-muted">{picked ? fmtRp(perHead) : "—"}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="text-[10.5px] text-text-muted">
                        Pilih siapa aja yang ikut patungan — nggak harus semua orang.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2 mb-1.5">
                        {participants.map((p, i) => {
                          const units = assignments[item.id]?.[p.id] ?? 0;
                          return (
                            <div key={p.id} className="flex items-center gap-1 rounded-full border border-hairline bg-bg-input pl-1 pr-1.5 py-1">
                              <button
                                type="button"
                                onClick={() => tapAssign(item, p.id)}
                                title={`Assign 1 ${item.name} ke ${p.name}`}
                                className={cn(
                                  "w-6 h-6 rounded-full text-white text-[10px] font-semibold flex items-center justify-center",
                                  AVATAR_COLORS[i % AVATAR_COLORS.length],
                                )}
                              >
                                {p.name.slice(0, 1).toUpperCase()}
                              </button>
                              <span className="text-[11px] text-text w-3 text-center">{units}</span>
                              {units > 0 && (
                                <button type="button" onClick={() => unassign(item, p.id)} className="text-text-muted">
                                  <Minus size={11} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => resetItemAssignment(item.id)} className="text-[11px] text-text-muted">
                          Reset
                        </button>
                        {participants.length > 0 && (
                          <button
                            type="button"
                            onClick={() => assignAllToOne(item, participants[0].id)}
                            className="text-[11px] text-brand-strong"
                          >
                            Semua ke {participants[0].name}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <Button fullWidth disabled={!fullyAssigned} onClick={() => setStep("result")}>
            {fullyAssigned ? "Lihat Hasil Split →" : "Assign semua item dulu"}
          </Button>
          <Button fullWidth variant="ghost" className="mt-2.5" onClick={() => setStep("review")}>
            ‹ Kembali
          </Button>
        </div>
      )}

      {step === "result" && (
        <div>
          <div className="text-[13px] text-text-dim mb-3">
            {title} · {fmtRp(result.grandTotal)} · pajak &amp; service dibagi proporsional sesuai porsi masing-masing.
          </div>
          <div className="flex flex-col gap-2 mb-4">
            {result.perParticipant.map((p) => (
              <div
                key={p.participantId}
                className={cn("rounded-xl border p-3", p.isCreator ? "border-good/35 bg-good/10" : "border-hairline bg-bg-raised")}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-text">
                    {p.name} {p.isCreator && <span className="text-text-muted">(kamu)</span>}
                  </span>
                  <span className={cn("serif text-[15px]", p.isCreator ? "text-good" : "text-text")}>{fmtRp(p.total)}</span>
                </div>
                <div className="text-[11px] text-text-muted">
                  {p.itemLines.length > 0 ? p.itemLines.map((l) => `${l.units} ${l.name}`).join(", ") : "tidak ada item"}
                </div>
                {p.sharedLines.length > 0 && (
                  <div className="text-[11px] text-good mt-0.5">
                    {p.sharedLines.map((l) => `Patungan: ${l.name} (${fmtRp(l.amount)})`).join(", ")}
                  </div>
                )}
                {p.isCreator && cashAccounts.length > 0 && (
                  <div className="mt-2.5">
                    <div className="text-[10.5px] text-text-muted mb-1.5">🔗 Sumber Dana — didebit dari mana?</div>
                    <div className="flex flex-wrap gap-1.5">
                      {cashAccounts.map((a) => (
                        <Chip key={a.id} active={accountHoldingId === a.id} onClick={() => setAccountHoldingId(accountHoldingId === a.id ? null : a.id)}>
                          🏦 {a.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {result.tax + result.service > 0 && (
            <div className="text-[10.5px] text-text-muted border-t border-hairline pt-2.5 mb-3">
              💡 Pajak &amp; service ({fmtRp(result.tax + result.service)}) dibagi proporsional sesuai porsi masing-masing — bukan rata.
            </div>
          )}
          <div className="text-[11px] text-text-dim leading-relaxed mb-3">
            Cuma <b className="text-good">bagian {nameOrKamu(userName)} ({fmtRp(result.perParticipant.find((p) => p.isCreator)?.total ?? 0)})</b> yang tercatat sebagai
            pengeluaranmu. Bagian orang lain tidak mengurangi saldo/aset {nameOrKamu(userName)}.
          </div>
          {error && <div className="mb-3 text-xs text-critical">{error}</div>}
          <Button fullWidth onClick={handleCreate} disabled={isPending}>
            {isPending ? "Membuat…" : "Buat & Bagikan →"}
          </Button>
          <Button fullWidth variant="ghost" className="mt-2.5" onClick={() => setStep("assign")}>
            ‹ Kembali
          </Button>
        </div>
      )}

      {step === "shared" && (
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <span className="w-12 h-12 rounded-full bg-good/14 flex items-center justify-center text-good text-xl">✓</span>
          <div className="serif text-[17px] text-text">Split berhasil dibuat!</div>
          <div className="text-[13px] text-text-dim">Bagikan link ini ke teman-temanmu biar mereka tahu bagian masing-masing.</div>
          <div className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-hairline bg-bg-input text-xs text-text-dim break-all">
            {shareUrl}
          </div>
          <Button
            fullWidth
            onClick={() => {
              if (shareUrl && navigator.share) {
                navigator.share({ title, url: shareUrl }).catch(() => {});
              } else if (shareUrl) {
                navigator.clipboard?.writeText(shareUrl).catch(() => {});
              }
            }}
          >
            <ImageIcon size={16} /> Salin / Bagikan Link
          </Button>
          <Button fullWidth variant="ghost" onClick={onDone}>
            Selesai
          </Button>
        </div>
      )}
    </div>
  );
}
