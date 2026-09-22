import Link from "next/link";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Lupa Password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="serif text-[26px] font-medium mb-2">Reset password</h1>
      <p className="text-text-dim text-sm mb-7 leading-relaxed">
        Masukkan email akunmu — kami kirim link untuk membuat password baru.
      </p>
      <ForgotPasswordForm />
      <p className="text-sm text-text-dim mt-6 text-center">
        <Link href="/login" className="text-brand-strong hover:underline">
          ‹ Kembali ke halaman masuk
        </Link>
      </p>
    </div>
  );
}
