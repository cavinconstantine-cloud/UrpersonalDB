import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

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
