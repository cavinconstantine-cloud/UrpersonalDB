"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export interface AuthFormState {
  error?: string;
  info?: string;
}

function siteOrigin(hdrs: Headers): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl;
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("host");
  return `${proto}://${host}`;
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!name) return { error: "Nama tidak boleh kosong." };
  if (!email) return { error: "Email tidak boleh kosong." };
  if (password.length < 8) return { error: "Password minimal 8 karakter." };

  const supabase = await createClient();
  const hdrs = await headers();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${siteOrigin(hdrs)}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered") || error.code === "user_already_exists") {
      return { error: "Email ini sudah terdaftar. Coba masuk, atau reset password." };
    }
    return { error: error.message };
  }

  // Email confirmation is required (default Supabase setting) when identities is empty.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: "Email ini sudah terdaftar. Coba masuk, atau reset password." };
  }

  if (data.session) {
    redirect("/onboarding");
  }

  return { info: `Link konfirmasi sudah dikirim ke ${email}. Cek inbox (dan folder spam) untuk lanjut.` };
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/app");

  if (!email || !password) return { error: "Email dan password wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Email belum dikonfirmasi. Cek inbox untuk link konfirmasi." };
    }
    return { error: "Email atau password salah." };
  }

  redirect(next.startsWith("/") ? next : "/app");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Email tidak boleh kosong." };

  const supabase = await createClient();
  const hdrs = await headers();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteOrigin(hdrs)}/auth/callback?next=/update-password`,
  });

  if (error) return { error: error.message };
  return { info: `Jika ${email} terdaftar, link reset password sudah dikirim. Cek inbox kamu.` };
}

export async function updatePasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = String(formData.get("password") || "");
  if (password.length < 8) return { error: "Password minimal 8 karakter." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/app");
}
