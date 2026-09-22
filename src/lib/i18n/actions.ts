"use server";

import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang } from "./dictionaries";

export async function setLanguage(lang: Lang) {
  const store = await cookies();
  store.set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
