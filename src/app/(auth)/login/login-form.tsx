"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type AuthFormState } from "../actions";
import { TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/auth/form-message";

const initialState: AuthFormState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="next" value={next} />
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
      <TextField
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />
      <div className="flex justify-end -mt-2 mb-5">
        <Link href="/forgot-password" className="text-xs text-brand-strong hover:underline">
          Lupa password?
        </Link>
      </div>
      <SubmitButton fullWidth pendingText="Masuk…">
        Masuk
      </SubmitButton>
    </form>
  );
}
