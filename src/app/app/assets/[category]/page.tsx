import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ASSET_SCHEMAS } from "@/lib/finance/schemas";
import { catIcon } from "@/lib/finance/constants";
import { AssetCategoryManager } from "@/components/app/asset-category-manager";
import { IhsgWidget } from "@/components/finance/ihsg-widget";
import type { StockPriceInfo } from "@/components/finance/saham-holding-modal";
import { capNameOrKamu, nameOrKamu } from "@/lib/finance/format";
import { getProfile } from "@/lib/data/shared";

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

  const [{ data }, { data: snapshotData }, { data: goalsData }, stockPricesRes, { data: profile }] = await Promise.all([
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
      // 35 days back, not 4 — movement badges now compare against ~a month
      // ago (see monthlyMovementByHolding), not day-over-day.
      .gte("snapshot_date", daysAgoIso(35)),
    supabase.from("goals").select("id, name").eq("user_id", user.id).order("created_at"),
    category === "Saham" ? supabase.from("stock_prices").select("*") : Promise.resolve({ data: null }),
    getProfile(user.id),
  ]);

  const stockPrices: Record<string, StockPriceInfo> = {};
  let ihsg: StockPriceInfo | null = null;
  for (const row of stockPricesRes.data || []) {
    const info: StockPriceInfo = {
      companyName: row.company_name,
      price: Number(row.price),
      changePct: Number(row.change_pct),
      asOf: row.as_of,
      updatedAt: row.updated_at,
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
          ? `Harga saham & IHSG diperbarui berkala saat jam bursa buka (09.00–16.00 WIB) — bukan streaming real-time seperti aplikasi trading. ${capNameOrKamu(profile?.name)} tinggal isi jumlah lot & harga beli.`
          : `${capNameOrKamu(profile?.name)} bisa menambahkan lebih dari satu, mis. beberapa produk sekaligus.`}
      </p>
      {category === "Saham" && ihsg && (
        <>
          <IhsgWidget price={ihsg.price} asOf={ihsg.asOf} updatedAt={ihsg.updatedAt} />
          <div className="text-xs font-medium text-text-dim mb-2.5">📊 Portofolio Saham {capNameOrKamu(profile?.name)}</div>
        </>
      )}
      <AssetCategoryManager
        category={category}
        holdings={holdings}
        snapshots={snapshots}
        goals={goals}
        stockPrices={stockPrices}
        userName={nameOrKamu(profile?.name)}
      />
    </div>
  );
}
