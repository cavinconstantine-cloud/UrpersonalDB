"use client";

import { createContext, useContext, useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { dictionaries, type Dictionary, type Lang } from "@/lib/i18n/dictionaries";
import { setLanguage } from "@/lib/i18n/actions";

interface LanguageContextValue {
  lang: Lang;
  dict: Dictionary;
  setLang: (lang: Lang) => void;
  isPending: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(next: Lang) {
    setLangState(next);
    startTransition(async () => {
      await setLanguage(next);
      router.refresh();
    });
  }

  return (
    <LanguageContext.Provider value={{ lang, dict: dictionaries[lang], setLang, isPending }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
