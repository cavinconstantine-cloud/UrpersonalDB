/** Shared by both the client detector and the server reader — kept free of "server-only" so the client component can import it too. */
export const TZ_COOKIE = "uangku_tz";

/** Falls back to Indonesia when no visitor timezone is known yet (first-ever request, cookies blocked, etc). */
export const DEFAULT_TZ = "Asia/Jakarta";
