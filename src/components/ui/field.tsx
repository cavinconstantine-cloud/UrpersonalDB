"use client";

import { cn } from "@/lib/utils";
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

const inputBase =
  "w-full px-[14px] py-[13px] rounded-lg border bg-bg-input text-text text-[16px] font-sans placeholder:text-text-muted focus:outline-2 focus:outline-offset-1 focus:outline-brand transition-colors";

interface FieldWrapProps {
  label?: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}

export function FieldWrap({ label, error, hint, children, htmlFor }: FieldWrapProps) {
  return (
    <div className="mb-[18px]">
      {label && (
        <label htmlFor={htmlFor} className="block text-xs text-text-dim mb-1.5">
          {label}
        </label>
      )}
      {children}
      {hint && <div className="mt-1.5 text-xs text-text-dim leading-relaxed">{hint}</div>}
      {error && <div className="mt-1.5 text-xs text-critical">{error}</div>}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, className, id, ...props },
  ref,
) {
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={id}>
      <input
        ref={ref}
        id={id}
        className={cn(inputBase, error && "border-critical", !error && "border-hairline", className)}
        {...props}
      />
    </FieldWrap>
  );
});

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  hint?: ReactNode;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(function PasswordField(
  { label, error, hint, className, id, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={id}>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          className={cn(inputBase, "pr-11", error && "border-critical", !error && "border-hairline", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
          aria-pressed={visible}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
        >
          {visible ? (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <path d="M6.61 6.61A18.5 18.5 0 0 0 1 12s4 8 11 8a10.94 10.94 0 0 0 5.05-1.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </FieldWrap>
  );
});

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(function TextareaField(
  { label, error, hint, className, id, rows = 5, ...props },
  ref,
) {
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={id}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={cn(inputBase, "resize-y", error && "border-critical", !error && "border-hairline", className)}
        {...props}
      />
    </FieldWrap>
  );
});

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  options: { value: string; label: string }[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, error, hint, className, id, options, ...props },
  ref,
) {
  return (
    <FieldWrap label={label} error={error} hint={hint} htmlFor={id}>
      <select
        ref={ref}
        id={id}
        className={cn(inputBase, error && "border-critical", !error && "border-hairline", className)}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
});
