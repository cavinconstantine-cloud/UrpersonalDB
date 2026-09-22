import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LIAB_SCHEMAS } from "@/lib/finance/schemas";
import { catIcon } from "@/lib/finance/constants";
import { LiabilityCategoryManager } from "@/components/app/liability-category-manager";

export default async function LiabilityCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  const schema = LIAB_SCHEMAS[category];
  if (!schema) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("liabilities")
    .select("id, data")
    .eq("user_id", user.id)
    .eq("category", category)
    .order("created_at");

  const holdings = (data || []).map((l) => ({ id: l.id, data: (l.data as Record<string, string | number>) || {} }));

  return (
    <div className="px-5 pt-6">
      <Link href="/app" className="text-sm text-text-dim mb-4 inline-block">
        ‹ Kembali ke Dashboard
      </Link>
      <h1 className="serif text-[26px] font-medium mb-1">
        {catIcon(category)} {category}
      </h1>
      <p className="text-text-dim text-sm mb-6 leading-relaxed">
        Kamu bisa menambahkan lebih dari satu, mis. beberapa kartu kredit sekaligus.
      </p>
      <LiabilityCategoryManager category={category} holdings={holdings} />
    </div>
  );
}
