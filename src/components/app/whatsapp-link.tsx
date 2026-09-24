"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { generatePairingCode, unlinkWhatsapp } from "@/app/app/settings/whatsapp-actions";

export function WhatsappLink({
  linkedNumber,
  pairingCode,
  whatsappNumber,
}: {
  linkedNumber: string | null;
  pairingCode: string | null;
  whatsappNumber?: string | null;
}) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState(pairingCode);

  function generate() {
    startTransition(async () => {
      try {
        const newCode = await generatePairingCode();
        setCode(newCode);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal membuat kode.");
      }
    });
  }

  function unlink() {
    startTransition(async () => {
      try {
        await unlinkWhatsapp();
        setCode(null);
        toast.success("WhatsApp diputus.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Gagal memutus hubungan.");
      }
    });
  }

  if (linkedNumber) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-text-dim">
          Terhubung ke <span className="text-text font-medium">{linkedNumber}</span>
        </p>
        <Button size="sm" variant="ghost" onClick={unlink} disabled={isPending}>
          {isPending ? <Spinner size={14} /> : "Putus"}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-text-dim mb-3 leading-relaxed">
        Chat langsung ke nomor WhatsApp Uangku buat catat transaksi otomatis — nggak perlu buka app.
      </p>
      {code ? (
        <div className="bg-bg-input rounded-xl p-3 mb-3">
          <p className="text-xs text-text-dim mb-1">
            Kirim kode ini ke {whatsappNumber || "nomor WhatsApp Uangku"}:
          </p>
          <div className="serif text-2xl tracking-[0.3em] text-brand-strong">{code}</div>
        </div>
      ) : null}
      <Button size="sm" onClick={generate} disabled={isPending}>
        {isPending ? <Spinner size={14} /> : code ? "Buat kode baru" : "Hubungkan WhatsApp"}
      </Button>
    </div>
  );
}
