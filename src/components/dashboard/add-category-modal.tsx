"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Chip } from "@/components/ui/chip";
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

  function pick(cat: string) {
    setPendingCat(cat);
    startTransition(async () => {
      await addCategory(kind, cat);
      onClose();
      router.push(kind === "asset" ? `/app/assets/${encodeURIComponent(cat)}` : `/app/liabilities/${encodeURIComponent(cat)}`);
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={kind === "asset" ? "Tambah kategori aset" : "Tambah kategori utang"}>
      <p className="text-sm text-text-dim mb-4 leading-relaxed">
        Belum melapor sebelumnya? Pilih kategori baru untuk mulai mencatatnya sekarang.
      </p>
      {remaining.length === 0 ? (
        <div className="text-sm text-text-dim">Semua kategori sudah ditambahkan.</div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {remaining.map((c) => (
            <Chip key={c} onClick={() => pick(c)} disabled={isPending && pendingCat !== c}>
              {catIcon(c)} {c}
              {isPending && pendingCat === c ? "…" : ""}
            </Chip>
          ))}
        </div>
      )}
    </Modal>
  );
}
