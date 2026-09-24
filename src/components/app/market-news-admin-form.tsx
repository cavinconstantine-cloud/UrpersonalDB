"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField, TextareaField } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { fmtDateLong } from "@/lib/finance/format";
import { deleteMarketNews, submitMarketNews, type MarketNewsRow } from "@/app/app/admin/market-news/actions";

export function MarketNewsAdminForm({ initialNews }: { initialNews: MarketNewsRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [rawContent, setRawContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourcePublisher, setSourcePublisher] = useState("");

  function submit() {
    startTransition(async () => {
      const res = await submitMarketNews({ rawContent, sourceUrl, sourceTitle, sourcePublisher });
      if (res.ok) {
        toast.success("Berita disimpan — langsung tampil di dashboard.");
        setRawContent("");
        setSourceUrl("");
        setSourceTitle("");
        setSourcePublisher("");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menyimpan berita.");
      }
    });
  }

  function remove(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteMarketNews(id);
      if (res.ok) {
        toast.success("Berita dihapus.");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus berita.");
      }
      setDeletingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-3">Drop berita baru</div>
        <TextareaField
          label="Isi berita / ringkasan isu"
          value={rawContent}
          onChange={(e) => setRawContent(e.target.value)}
          placeholder="Paste isi artikel, atau tulis ringkasan singkat isunya di sini..."
          rows={6}
        />
        <TextField
          label="Link sumber"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://..."
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Judul artikel asli (opsional)"
            value={sourceTitle}
            onChange={(e) => setSourceTitle(e.target.value)}
          />
          <TextField
            label="Nama media (opsional)"
            value={sourcePublisher}
            onChange={(e) => setSourcePublisher(e.target.value)}
            placeholder="mis. Kontan"
          />
        </div>
        <Button onClick={submit} disabled={isPending} fullWidth>
          {isPending && deletingId === null ? <Spinner size={14} /> : "Analisa & Publish"}
        </Button>
      </div>

      <div>
        <div className="text-xs font-medium text-text-dim mb-2.5 px-1">
          Berita aktif ({initialNews.length})
        </div>
        {initialNews.length === 0 ? (
          <div className="text-sm text-text-dim px-1">Belum ada berita.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {initialNews.map((item) => (
              <div
                key={item.id}
                className="bg-bg-raised border border-hairline rounded-2xl p-3.5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-sm font-medium leading-snug">{item.headline}</div>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    disabled={isPending}
                    className="p-1 text-text-muted shrink-0 disabled:opacity-40"
                    aria-label="Hapus berita"
                  >
                    {isPending && deletingId === item.id ? <Spinner size={14} /> : <Trash2 size={15} />}
                  </button>
                </div>
                <p className="text-[13px] text-text-dim leading-relaxed mb-1.5">{item.summary}</p>
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span>{fmtDateLong(item.publishedAt)}</span>
                  {item.sources[0] && (
                    <a
                      href={item.sources[0].url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-brand-strong truncate max-w-[200px]"
                    >
                      {item.sources[0].publisher || item.sources[0].title} ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
