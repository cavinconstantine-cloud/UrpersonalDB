import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { listMarketNews } from "./actions";
import { MarketNewsAdminForm } from "@/components/app/market-news-admin-form";

export const metadata: Metadata = { title: "Kelola Berita Pasar" };

export default async function MarketNewsAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/app");

  const news = await listMarketNews();

  return (
    <div className="px-5 pt-6 pb-10">
      <Link href="/app" className="text-sm text-text-dim mb-4 inline-block">
        ‹ Kembali ke Dashboard
      </Link>
      <h1 className="serif text-[24px] font-medium mb-1">🌐 Kelola Berita Pasar</h1>
      <p className="text-sm text-text-dim mb-6 leading-relaxed">
        Drop berita/isu yang sudah kamu pilih, AI bantu tulis judul &amp; analisa dampaknya ke pasar Indonesia. Tidak
        ada pencarian otomatis — sumbernya selalu dari yang kamu masukkan sendiri.
      </p>
      <MarketNewsAdminForm initialNews={news} />
    </div>
  );
}
