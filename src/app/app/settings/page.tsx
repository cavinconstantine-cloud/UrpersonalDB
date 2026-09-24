import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/(auth)/actions";
import { SettingsForm } from "@/components/app/settings-form";
import { ProfileTypeSettings } from "@/components/app/profile-type-settings";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { LanguageToggle } from "@/components/app/language-toggle";
import { LiveClock } from "@/components/app/live-clock";
import { PushToggle } from "@/components/app/push-toggle";
import { WhatsappLink } from "@/components/app/whatsapp-link";
import { Button } from "@/components/ui/button";
import { getLang } from "@/lib/i18n/lang";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isAdminEmail } from "@/lib/admin";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profileRes = await supabase
    .from("profiles")
    .select("name, profile_type, payday_day, whatsapp_number, whatsapp_pairing_code, push_enabled")
    .eq("id", user.id)
    .single();

  const lang = await getLang();
  const dict = getDictionary(lang);

  return (
    <div className="px-5 pt-6">
      <h1 className="serif text-[24px] font-medium mb-6">{dict.settings.title}</h1>

      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-3">{dict.theme.title}</div>
        <ThemeToggle />
      </div>

      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-3">{dict.language.title}</div>
        <LanguageToggle />
      </div>

      <LiveClock />

      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-3">🔔 Notifikasi</div>
        <PushToggle
          initialEnabled={profileRes.data?.push_enabled || false}
          vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null}
        />
      </div>

      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-3">💬 Catat via WhatsApp</div>
        <WhatsappLink
          linkedNumber={profileRes.data?.whatsapp_number || null}
          pairingCode={profileRes.data?.whatsapp_pairing_code || null}
          whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || null}
        />
      </div>

      <SettingsForm initialName={profileRes.data?.name || ""} />

      <ProfileTypeSettings
        initialProfileType={(profileRes.data?.profile_type as "karyawan" | "pengusaha" | null) || ""}
        initialPaydayDay={profileRes.data?.payday_day ?? null}
      />

      {isAdminEmail(user.email) && (
        <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
          <div className="serif text-[15px] mb-1">🌐 Berita Pasar</div>
          <p className="text-xs text-text-dim mb-3 leading-relaxed">Kelola berita yang tampil di dashboard.</p>
          <Link href="/app/admin/market-news">
            <Button variant="ghost" fullWidth type="button">
              Buka pengelola berita
            </Button>
          </Link>
        </div>
      )}

      <div className="bg-bg-raised border border-hairline rounded-2xl p-4 mb-4 shadow-[var(--shadow-card)]">
        <div className="serif text-[15px] mb-1">{dict.settings.account}</div>
        <p className="text-xs text-text-dim mb-3">
          {dict.settings.signedInAs} {user.email}
        </p>
        <form action={signOutAction}>
          <Button variant="ghost" fullWidth type="submit">
            {dict.settings.signOut}
          </Button>
        </form>
      </div>

      <p className="text-xs text-text-muted text-center pb-6 leading-relaxed">{dict.settings.footer}</p>
    </div>
  );
}
