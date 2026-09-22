import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ASSET_SCHEMAS } from "@/lib/finance/schemas";
import { catIcon } from "@/lib/finance/constants";
import { AssetCategoryManager } from "@/components/app/asset-category-manager";

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

  const { data } = await supabase
    .from("asset_holdings")
    .select("id, data")
    .eq("user_id", user.id)
    .eq("category", category)
    .order("created_at");

  const holdings = (data || []).map((h) => ({ id: h.id, data: (h.data as Record<string, string | number>) || {} }));

  return (
    <div className="px-5 pt-6">
      <Link href="/app" className="text-sm text-text-dim mb-4 inline-block">
        ‹ Kembali ke Dashboard
      </Link>
      <h1 className="serif text-[26px] font-medium mb-1">
        {catIcon(category)} {category}
      </h1>
      <p className="text-text-dim text-sm mb-6 leading-relaxed">
        Kamu bisa menambahkan lebih dari satu, mis. beberapa produk sekaligus.
      </p>
      <AssetCategoryManager category={category} holdings={holdings} />
    </div>
  );
}
