"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "./language-provider";

type ThemePref = "system" | "light" | "dark";

export function ThemeToggle() {
  const { dict } = useLanguage();
  const [pref, setPref] = useState<ThemePref>("system");
  const OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
    { value: "system", label: dict.theme.system, icon: MonitorSmartphone },
    { value: "light", label: dict.theme.light, icon: Sun },
    { value: "dark", label: dict.theme.dark, icon: Moon },
  ];

  useEffect(() => {
    // Read after mount (not in a lazy initializer) so the first client render
    // matches the server-rendered "system" state and avoids a hydration mismatch.
    try {
      const stored = localStorage.getItem("uangku-theme") as ThemePref | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === "light" || stored === "dark") setPref(stored);
    } catch {
      // ignore
    }
  }, []);

  function apply(next: ThemePref) {
    setPref(next);
    try {
      if (next === "system") {
        localStorage.removeItem("uangku-theme");
        document.documentElement.removeAttribute("data-theme");
      } else {
        localStorage.setItem("uangku-theme", next);
        document.documentElement.setAttribute("data-theme", next);
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex gap-2 bg-bg-input rounded-xl p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => apply(value)}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs transition-colors",
            pref === value ? "bg-bg-raised text-text shadow-sm" : "text-text-dim",
          )}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );
}
