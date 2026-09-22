"use client";

import { forwardRef } from "react";
import { FieldWrap } from "./field";
import { cn } from "@/lib/utils";

/** Groups a digits-only string with "." every 3 digits — id-ID convention (1000000 -> "1.000.000"). */
function groupDigits(digits: string): string {
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function digitsBefore(str: string, idx: number): number {
  let n = 0;
  for (let i = 0; i < idx && i < str.length; i++) {
    if (str[i] >= "0" && str[i] <= "9") n++;
  }
  return n;
}

function indexAfterDigits(str: string, n: number): number {
  if (n <= 0) return 0;
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] >= "0" && str[i] <= "9") {
      count++;
      if (count === n) return i + 1;
    }
  }
  return str.length;
}

interface NumberInputProps {
  value: number;
  onValueChange: (n: number) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Bare whole-number Rupiah input — displays "." thousands separators as you
 * type (1000000 -> 1.000.000), matching how amounts are shown everywhere
 * else in the app (fmtRp / id-ID locale), while keeping the caret in the
 * right place. Digits-only — not for decimal-sensitive fields (kurs, %,
 * gram weight). Use `NumberField` below for the labeled version.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { value, onValueChange, onBlur, placeholder, className, id, disabled },
  ref,
) {
  const display = value ? groupDigits(String(Math.round(value))) : "";

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Backspace" && e.key !== "Delete") return;
    const el = e.currentTarget;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    if (start !== end) return; // already a range selected — let the browser handle it

    if (e.key === "Backspace" && start > 0 && !/[0-9]/.test(el.value[start - 1] ?? "")) {
      // caret sits right after a "." — widen the deletion to also remove the digit before it
      el.setSelectionRange(Math.max(0, start - 2), start);
    } else if (e.key === "Delete" && start < el.value.length && !/[0-9]/.test(el.value[start] ?? "")) {
      // caret sits right before a "." — widen the deletion to also remove the digit after it
      el.setSelectionRange(start, Math.min(el.value.length, start + 2));
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    const nBefore = digitsBefore(el.value, caret);
    const digits = el.value.replace(/[^0-9]/g, "");
    onValueChange(digits ? Number(digits) : 0);
    requestAnimationFrame(() => {
      const pos = indexAfterDigits(groupDigits(digits), nBefore);
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
});

interface NumberFieldProps extends NumberInputProps {
  label?: string;
  error?: string;
  hint?: React.ReactNode;
}

/** Labeled version of `NumberInput`, styled like `TextField`. */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  { label, error, hint, className, id, ...props },
  ref,
) {
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={id}>
      <NumberInput
        ref={ref}
        id={id}
        className={cn(
          "w-full px-[14px] py-[13px] rounded-lg border bg-bg-input text-text text-[16px] font-sans placeholder:text-text-muted focus:outline-2 focus:outline-offset-1 focus:outline-brand transition-colors",
          error ? "border-critical" : "border-hairline",
          className,
        )}
        {...props}
      />
    </FieldWrap>
  );
});
