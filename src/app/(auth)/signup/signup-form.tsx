"use client";

import { useActionState } from "react";
import { signUpAction, type AuthFormState } from "../actions";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/auth/form-message";

const initialState: AuthFormState = {};

export function SignupForm() {
  const [state, formAction] = useActionState(signUpAction, initialState);

  return (
    <form action={formAction}>
      <FormMessage error={state.error} info={state.info} />
      <TextField id="name" name="name" type="text" label="Nama" placeholder="Nama kamu" autoComplete="name" required />
      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="nama@email.com"
        autoComplete="email"
        required
      />
      <TextField
        id="password"
        name="password"
        type="password"
        label="Buat password"
        placeholder="Minimal 8 karakter"
        autoComplete="new-password"
        minLength={8}
        required
        hint="Data keuanganmu private — hanya kamu yang bisa melihatnya."
      />
      <SubmitButton fullWidth pendingText="Membuat akun…">
        Buat akun
      </SubmitButton>
    </form>
  );
}
