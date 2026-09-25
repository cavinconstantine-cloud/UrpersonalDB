import { cn } from "@/lib/utils";
import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium font-sans text-[15px] transition duration-150 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const variants = {
  primary: "bg-brand text-brand-ink hover:brightness-105 active:brightness-95 shadow-sm",
  ghost: "bg-transparent text-text-dim border border-hairline hover:bg-bg-sunken",
  subtle: "bg-brand/10 text-brand-strong hover:bg-brand/15",
  danger: "bg-transparent text-critical border border-hairline hover:bg-critical/10",
  link: "bg-transparent text-brand-strong hover:underline p-0",
};

const sizes = {
  md: "px-[18px] py-[13px]",
  sm: "px-4 py-2.5 text-[13px]",
  pill: "px-5 py-3 rounded-full text-sm",
};

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", fullWidth, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...props}
    />
  );
});

interface LinkButtonProps {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
}

export function LinkButton({ href, className, variant = "primary", size = "md", fullWidth, target, rel, children }: LinkButtonProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={rel}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
    >
      {children}
    </Link>
  );
}
