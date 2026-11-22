/** Safe to import from middleware (edge runtime): no Node or DB imports here. */
export const SESSION_COOKIE = "careerai_session";
export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days, fixed (no silent extension)
