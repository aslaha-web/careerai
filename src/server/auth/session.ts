import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth-constants";

/**
 * Cookies are `Secure` in production. Set ALLOW_INSECURE_COOKIES=true only
 * when running the production build over plain http://localhost.
 */
function useSecureCookies(): boolean {
  return process.env.NODE_ENV === "production" && process.env.ALLOW_INSECURE_COOKIES !== "true";
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // not readable by page JavaScript, limits the damage of an XSS bug
    sameSite: "lax", // not sent on cross-site POSTs, a second layer of CSRF defence
    secure: useSecureCookies(),
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function readSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}
