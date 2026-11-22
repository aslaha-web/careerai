/**
 * Paths that anyone may open. Everything else requires a session, so a new
 * route is protected by default and must be listed here on purpose to be public.
 * Marketing pages (Step 3) and the auth pages are public; everything else is private.
 */
export const PUBLIC_PATHS = ["/", "/features", "/about", "/contact", "/login", "/register"];

export function isPublicPath(pathname: string): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname; // "/about/" is the same page as "/about"
  return PUBLIC_PATHS.includes(path);
}

/**
 * Accept only same-site relative paths for post-login redirects, so a crafted
 * `?next=https://evil.example` link cannot bounce users off-site.
 */
export function safeRedirectPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001F]/.test(value)) return fallback;
  const path = value.split(/[?#]/)[0];
  if (isPublicPath(path) && path !== "/") return fallback; // never bounce back to /login
  return value;
}
