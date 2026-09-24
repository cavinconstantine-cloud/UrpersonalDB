import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBillSplitByToken } from "@/app/app/split/actions";
import { fmtRp } from "@/lib/finance/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const split = await getBillSplitByToken(token);
  if (!split) return { title: "Split Bill tidak ditemukan" };

  const { result } = split;
  const names = result.perParticipant.map((p) => p.name);
  const namesLabel =
    names.length > 3 ? `${names.slice(0, 3).join(", ")}, +${names.length - 3} lainnya` : names.join(", ");

  return {
    title: `Split Bill: ${split.title} — ${fmtRp(result.grandTotal)} dibagi ${result.perParticipant.length} orang`,
    description: `${namesLabel} — cek rincian & bagian masing-masing di Uangku.`,
  };
}

export default async function SplitPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const split = await getBillSplitByToken(token);
  if (!split) notFound();

  const { result } = split;

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[480px] mx-auto px-5 py-8">
        <div className="flex items-center gap-2 mb-6">
          <span className="serif text-lg text-text">Uangku</span>
          <span className="text-[9.5px] font-bold tracking-wide text-warning bg-warning/14 border border-warning/35 rounded-full px-1.5 py-0.5">
            BETA
          </span>
        </div>

        <div className="serif text-[22px] text-text mb-1">{split.title}</div>
        <div className="text-[13px] text-text-dim mb-1">
          dikirim oleh <span className="text-text">{split.creatorName}</span>
        </div>
        <div className="text-[13px] text-text-dim mb-6">
          {new Date(split.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
          {fmtRp(result.grandTotal)}
        </div>

        <div className="flex flex-col gap-2.5 mb-6">
          {result.perParticipant.map((p) => (
            <div
              key={p.participantId}
              className={cn(
                "rounded-2xl border p-4",
                p.isCreator ? "border-good/35 bg-good/10" : "border-hairline bg-bg-raised",
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text">
                  {p.name} {p.isCreator && <span className="text-text-muted font-normal">(pembuat split)</span>}
                </span>
                <span className={cn("serif text-[17px]", p.isCreator ? "text-good" : "text-text")}>{fmtRp(p.total)}</span>
              </div>
              <div className="text-xs text-text-muted">
                {p.itemLines.length > 0 ? p.itemLines.map((l) => `${l.units} ${l.name}`).join(", ") : "tidak ada item"}
              </div>
            </div>
          ))}
        </div>

        {result.tax + result.service > 0 && (
          <div className="text-xs text-text-muted mb-8 leading-relaxed">
            💡 Pajak &amp; service ({fmtRp(result.tax + result.service)}) dibagi proporsional sesuai porsi item masing-masing — bukan rata.
          </div>
        )}

        <div className="rounded-2xl border border-brand/35 bg-brand/10 p-5 text-center">
          <div className="serif text-[16px] text-text mb-1.5">Split tagihan bareng temen jadi gampang</div>
          <div className="text-xs text-text-dim mb-4 leading-relaxed">
            Uangku bisa baca struk otomatis pakai AI, bagi item per orang, sekaligus catat pengeluaranmu sendiri — coba gratis.
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-brand text-brand-ink px-5 py-3 text-sm font-medium"
          >
            Coba Uangku →
          </Link>
        </div>
      </div>
    </div>
  );
}
