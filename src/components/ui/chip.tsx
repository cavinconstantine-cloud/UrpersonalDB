import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "px-4 py-2.5 rounded-full border text-sm select-none transition duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100",
        active
          ? "border-brand text-brand-strong bg-brand/10"
          : "border-hairline text-text-dim bg-bg-raised hover:bg-bg-sunken",
        className,
      )}
      {...props}
    />
  );
}

export function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-4">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn("flex-1 h-[3px] rounded-full", i < current ? "bg-brand" : "bg-hairline")}
        />
      ))}
    </div>
  );
}
