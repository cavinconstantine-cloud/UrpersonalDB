import Link from "next/link";
import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Daftar" };

export default function SignupPage() {
  return (
    <div className="max-w-[420px] mx-auto">
      <h1 className="serif text-[26px] font-medium mb-2">Buat akun Uangku</h1>
      <p className="text-text-dim text-sm mb-7 leading-relaxed">
        Satu tempat untuk net worth, arus kas, dan tujuan finansialmu — bisa dibuka dari HP maupun laptop.
      </p>
      <SignupForm />
      <p className="text-sm text-text-dim mt-6 text-center">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-brand-strong hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
