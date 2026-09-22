"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type AuthFormState } from "../actions";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/auth/form-message";

const initialState: AuthFormState = {};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  return (
    <form action={formAction}>
      <FormMessage error={state.error} info={state.info} />
      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        placeholder="nama@email.com"
        autoComplete="email"
        required
      />
      <SubmitButton fullWidth pendingText="Mengirim…">
        Kirim link reset
      </SubmitButton>
    </form>
  );
}
