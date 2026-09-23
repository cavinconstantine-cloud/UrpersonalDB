"use client";

import { useLanguage } from "./language-provider";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/i18n/dictionaries";

const OPTIONS: { value: Lang; label: string }[] = [
  { value: "id", label: "Indonesia" },
  { value: "en", label: "English" },
];

export function LanguageToggle() {
  const { lang, setLang, isPending } = useLanguage();

  return (
    <div className="flex gap-2 bg-bg-input rounded-xl p-1">
      {OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setLang(value)}
          disabled={isPending}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-xs transition duration-150 active:scale-90",
            lang === value ? "bg-bg-raised text-text shadow-sm" : "text-text-dim",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
