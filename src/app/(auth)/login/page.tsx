import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { PhoneMockup } from "@/components/marketing/phone-mockup";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="max-w-[420px] mx-auto lg:max-w-[900px] grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <h1 className="serif text-[26px] font-medium mb-2">Selamat datang kembali</h1>
        <p className="text-text-dim text-sm mb-7 leading-relaxed">
          Masuk untuk melihat kondisi keuanganmu hari ini.
        </p>
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
