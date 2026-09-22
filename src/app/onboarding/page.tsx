import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = { title: "Mulai" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, onboarding_step")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_step === "done") redirect("/app");

  return <OnboardingWizard userId={user.id} initialName={profile?.name || ""} />;
}
