"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";
import type { ButtonHTMLAttributes } from "react";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pendingText?: string;
  fullWidth?: boolean;
  variant?: "primary" | "ghost" | "subtle" | "danger" | "link";
}

export function SubmitButton({ children, pendingText = "Memproses…", ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}
