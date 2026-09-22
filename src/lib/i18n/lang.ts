import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang } from "./dictionaries";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return value === "en" ? "en" : "id";
}
