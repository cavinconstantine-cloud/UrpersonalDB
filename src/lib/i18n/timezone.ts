import "server-only";
import { cookies } from "next/headers";
import { TZ_COOKIE, DEFAULT_TZ } from "./timezone-cookie";

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The visitor's own device timezone (set by TimezoneSync on their first page load), so "today"/"this month" boundaries computed here match their real wall clock — not the server's. */
export async function getVisitorTimezone(): Promise<string> {
  const store = await cookies();
  const value = store.get(TZ_COOKIE)?.value;
  if (value && isValidTimeZone(value)) return value;
  return DEFAULT_TZ;
}
