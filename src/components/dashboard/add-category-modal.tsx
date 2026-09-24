"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Chip } from "@/components/ui/chip";
import { Spinner } from "@/components/ui/spinner";
import { catIcon } from "@/lib/finance/constants";
import { addCategory } from "@/app/app/categories-actions";

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  kind: "asset" | "liability";
  remaining: string[];
}

export function AddCategoryModal({ open, onClose, kind, remaining }: AddCategoryModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingCat, setPendingCat] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pick(cat: string) {
    setError(null);
    setPendingCat(cat);
    startTransition(async () => {
      try {
        await addCategory(kind, cat);
        onClose();
        router.push(kind === "asset" ? `/app/assets/${encodeURIComponent(cat)}` : `/app/liabilities/${encodeURIComponent(cat)}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menambah kategori — coba lagi.");
        setPendingCat(null);
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={kind === "asset" ? "Tambah kategori aset" : "Tambah kategori utang"}>
      <p className="text-sm text-text-dim mb-4 leading-relaxed">
        Belum melapor sebelumnya? Pilih kategori baru untuk mulai mencatatnya sekarang.
      </p>
      {error && (
        <div className="mb-3 text-[12.5px] text-critical bg-critical/10 border border-critical/30 rounded-lg px-3 py-2.5 leading-relaxed">
          ⚠️ {error}
        </div>
      )}
      {remaining.length === 0 ? (
        <div className="text-sm text-text-dim">Semua kategori sudah ditambahkan.</div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {remaining.map((c) => (
            <Chip key={c} onClick={() => pick(c)} disabled={isPending && pendingCat !== c}>
              {catIcon(c)} {c}
              {isPending && pendingCat === c && <Spinner size={12} className="inline ml-1" />}
            </Chip>
          ))}
        </div>
      )}
    </Modal>
  );
}
