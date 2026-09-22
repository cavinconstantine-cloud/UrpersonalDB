"use client";

import { useActionState } from "react";
import { updatePasswordAction, type AuthFormState } from "../actions";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/auth/form-message";

const initialState: AuthFormState = {};

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePasswordAction, initialState);

  return (
    <form action={formAction}>
      <FormMessage error={state.error} info={state.info} />
      <TextField
        id="password"
        name="password"
        type="password"
        label="Password baru"
        placeholder="Minimal 8 karakter"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <SubmitButton fullWidth pendingText="Menyimpan…">
        Simpan password baru
      </SubmitButton>
    </form>
  );
}
