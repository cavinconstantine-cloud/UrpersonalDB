"use client";

import { useState, useTransition } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { generatePairingCode, unlinkWhatsapp } from "@/app/app/settings/whatsapp-actions";

/** wa.me only accepts digits (country code + number, no +/spaces/dashes). */
function waMeLink(number: string, prefilledText?: string) {
  const digits = number.replace(/[^0-9]/g, "");
  const text = prefilledText ? `?text=${encodeURIComponent(prefilledText)}` : "";
  return `https://wa.me/${digits}${text}`;
}

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
      <div>
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <p className="text-xs text-text-dim">
            Terhubung ke <span className="text-text font-medium">{linkedNumber}</span>
          </p>
          <Button size="sm" variant="ghost" onClick={unlink} disabled={isPending}>
            {isPending ? <Spinner size={14} /> : "Putus"}
          </Button>
        </div>
        {whatsappNumber && (
          <LinkButton
            href={waMeLink(whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="subtle"
          >
            💬 Buka Chat WhatsApp
          </LinkButton>
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-text-dim mb-3 leading-relaxed">
        Chat langsung ke nomor WhatsApp Uangku buat catat transaksi otomatis — nggak perlu buka app. Masih tahap{" "}
        <span className="font-medium text-warning">Beta</span>, jadi mungkin belum sempurna — makasih udah mau coba duluan 🙏
      </p>
      {code ? (
        <div className="bg-bg-input rounded-xl p-3 mb-3">
          <p className="text-xs text-text-dim mb-1">
            Kirim kode ini ke {whatsappNumber || "nomor WhatsApp Uangku"}:
          </p>
          <div className="serif text-2xl tracking-[0.3em] text-brand-strong">{code}</div>
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        {code && whatsappNumber ? (
          <LinkButton href={waMeLink(whatsappNumber, code)} target="_blank" rel="noopener noreferrer" size="sm">
            💬 Buka WhatsApp &amp; Kirim Kode →
          </LinkButton>
        ) : (
          <Button size="sm" onClick={generate} disabled={isPending}>
            {isPending ? <Spinner size={14} /> : "Hubungkan WhatsApp"}
          </Button>
        )}
        {code && (
          <button
            type="button"
            onClick={generate}
            disabled={isPending}
            className="text-[11px] text-text-muted self-start disabled:opacity-40"
          >
            {isPending ? "Membuat kode baru…" : "Buat kode baru"}
          </button>
        )}
      </div>
      {code && !whatsappNumber && (
        <p className="text-[11px] text-text-muted mt-2">
          Nomor WhatsApp Uangku belum diset — kirim kode di atas manual dulu ya.
        </p>
      )}
    </div>
  );
}
