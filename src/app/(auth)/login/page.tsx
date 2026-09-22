import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
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
  );
}
