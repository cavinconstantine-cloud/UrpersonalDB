import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles, Wallet, TrendingUp, Target } from "lucide-react";
import { LoginForm } from "./login-form";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { FormMessage } from "@/components/auth/form-message";

export const metadata: Metadata = { title: "Masuk" };

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  link_expired:
    "Link sudah kadaluarsa atau sudah pernah dipakai. Kirim ulang link reset password, atau link konfirmasi baru dari halaman daftar.",
};

const CAPABILITIES = [
  { icon: Wallet, label: "Net worth & aset" },
  { icon: TrendingUp, label: "Cash flow & DBR" },
  { icon: Target, label: "Goals otomatis" },
  { icon: Sparkles, label: "Ringkasan & saran AI" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const callbackError = error ? CALLBACK_ERROR_MESSAGES[error] : undefined;

  return (
    <div className="max-w-[420px] mx-auto lg:max-w-[1100px] grid lg:grid-cols-[420px_1fr] gap-12 lg:gap-16 lg:items-start">
      <div className="lg:pt-16">
        <h1 className="serif text-[26px] font-medium mb-2">Selamat datang kembali</h1>
        <p className="text-text-dim text-sm mb-7 leading-relaxed">
          Masuk untuk melihat kondisi keuanganmu hari ini.
        </p>
        {callbackError && <FormMessage error={callbackError} />}
        <LoginForm next={next || "/app"} />
        <p className="text-sm text-text-dim mt-6 text-center">
          Belum punya akun?{" "}
          <Link href="/signup" className="text-brand-strong hover:underline">
            Daftar gratis
          </Link>
        </p>
      </div>
      <div className="hidden lg:block">
        <div className="inline-flex items-center gap-1.5 text-xs text-brand-strong bg-brand/10 rounded-full px-3 py-1.5 mb-5">
          <Sparkles size={13} /> Draft testing — dicari early user
        </div>
        <h2 className="serif text-[32px] leading-[1.15] font-medium mb-4 max-w-[460px]">
          Satu tempat untuk seluruh kehidupan finansialmu.
        </h2>
        <p className="text-text-dim text-sm leading-relaxed mb-6 max-w-[460px]">
          Net worth, arus kas, dan tujuan finansial — terlihat jelas, terhitung otomatis, lengkap dengan ringkasan
          &amp; insight bulanan. Semua diupdate otomatis, kapan saja kamu buka.
        </p>
        <div className="flex flex-wrap gap-2.5 mb-8 max-w-[460px]">
          {CAPABILITIES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 text-xs text-text-dim bg-bg-raised border border-hairline rounded-lg px-3 py-2"
            >
              <Icon size={14} className="text-brand-strong" />
              {label}
            </div>
          ))}
        </div>
        <PhoneMockup />
      </div>
    </div>
  );
}
