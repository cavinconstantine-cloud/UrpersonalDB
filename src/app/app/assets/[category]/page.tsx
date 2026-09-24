import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ASSET_SCHEMAS } from "@/lib/finance/schemas";
import { catIcon } from "@/lib/finance/constants";
import { AssetCategoryManager } from "@/components/app/asset-category-manager";
import { IhsgWidget } from "@/components/finance/ihsg-widget";
import type { StockPriceInfo } from "@/components/finance/saham-holding-modal";

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default async function AssetCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  const schema = ASSET_SCHEMAS[category];
  if (!schema) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data }, { data: snapshotData }, { data: goalsData }, stockPricesRes] = await Promise.all([
    supabase
      .from("asset_holdings")
      .select("id, data, goal_id")
      .eq("user_id", user.id)
      .eq("category", category)
      .order("created_at"),
    supabase
      .from("asset_holding_snapshots")
      .select("snapshot_date, holding_id, category, label, value")
      .eq("user_id", user.id)
      .eq("category", category)
      .gte("snapshot_date", daysAgoIso(4)),
    supabase.from("goals").select("id, name").eq("user_id", user.id).order("created_at"),
    category === "Saham" ? supabase.from("stock_prices").select("*") : Promise.resolve({ data: null }),
  ]);

  const stockPrices: Record<string, StockPriceInfo> = {};
  let ihsg: StockPriceInfo | null = null;
  for (const row of stockPricesRes.data || []) {
    const info: StockPriceInfo = {
      companyName: row.company_name,
      price: Number(row.price),
      changePct: Number(row.change_pct),
      asOf: row.as_of,
    };
    if (row.ticker === "^JKSE") ihsg = info;
    else stockPrices[row.ticker] = info;
  }

  const holdings = (data || []).map((h) => ({
    id: h.id,
    data: (h.data as Record<string, string | number>) || {},
    goalId: h.goal_id,
  }));
  const snapshots = (snapshotData || []).map((s) => ({
    date: s.snapshot_date,
    holdingId: s.holding_id,
    category: s.category,
    label: s.label,
    value: Number(s.value),
  }));
  const goals = goalsData || [];

  return (
    <div className="px-5 pt-6">
      <Link href="/app" className="text-sm text-text-dim mb-4 inline-block">
        ‹ Kembali ke Dashboard
      </Link>
      <h1 className="serif text-[26px] font-medium mb-1">
        {catIcon(category)} {category}
      </h1>
      <p className="text-text-dim text-sm mb-6 leading-relaxed">
        {category === "Saham"
          ? "Harga saham & IHSG di sini adalah harga penutupan hari sebelumnya (H-1), diperbarui otomatis tiap hari kerja — bukan harga real-time/live. Kamu tinggal isi jumlah lot & harga beli."
          : "Kamu bisa menambahkan lebih dari satu, mis. beberapa produk sekaligus."}
      </p>
      {category === "Saham" && ihsg && (
        <>
          <IhsgWidget price={ihsg.price} asOf={ihsg.asOf} />
          <div className="text-xs font-medium text-text-dim mb-2.5">📊 Portofolio Saham Kamu</div>
        </>
      )}
      <AssetCategoryManager
        category={category}
        holdings={holdings}
        snapshots={snapshots}
        goals={goals}
        stockPrices={stockPrices}
      />
    </div>
  );
}
