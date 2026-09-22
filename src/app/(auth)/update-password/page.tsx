import type { Metadata } from "next";
import { UpdatePasswordForm } from "./update-password-form";

export const metadata: Metadata = { title: "Password Baru" };

export default function UpdatePasswordPage() {
  return (
    <div>
      <h1 className="serif text-[26px] font-medium mb-2">Buat password baru</h1>
      <p className="text-text-dim text-sm mb-7 leading-relaxed">
        Password ini akan menggantikan password lamamu.
      </p>
      <UpdatePasswordForm />
    </div>
  );
}
