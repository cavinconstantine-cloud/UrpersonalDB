import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { FormMessage } from "@/components/auth/form-message";

export const metadata: Metadata = { title: "Masuk" };

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  link_expired:
    "Link sudah kadaluarsa atau sudah pernah dipakai. Kirim ulang link reset password, atau link konfirmasi baru dari halaman daftar.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const callbackError = error ? CALLBACK_ERROR_MESSAGES[error] : undefined;

  return (
    <div className="max-w-[420px] mx-auto lg:max-w-[900px] grid lg:grid-cols-2 gap-12 items-center">
      <div>
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
        <PhoneMockup />
      </div>
    </div>
  );
}
