"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  loginSchema,
  registerSchema,
  toFieldErrors,
  type AuthFormState,
} from "@/lib/validation/auth";
import { safeRedirectPath } from "@/lib/routes";
import { getTrustMode, resolveClientIp } from "./client-ip";
import { burnPasswordCheck, hashPassword, verifyPassword } from "./password";
import { clearSessionCookie, readSessionToken, setSessionCookie } from "./session";
import { createSessionRow, deleteExpiredSessions, deleteSessionByToken } from "./session-store";
import {
  consumeRules,
  LOGIN_WINDOW_SECONDS,
  loginRules,
  registerRules,
  REGISTER_WINDOW_SECONDS,
  settleSuccess,
} from "./throttle";
import { createUser, EmailTakenError, findUserByEmail } from "./users";

const GENERIC_ERROR = "Something went wrong on our side. Please try again.";

/** The client IP only if the operator has said which proxy headers to trust (TRUST_PROXY); otherwise null. */
async function clientIp(): Promise<string | null> {
  return resolveClientIp(await headers(), getTrustMode());
}

function text(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function waitMessage(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  };
  const values = { name: raw.name, email: raw.email };

  try {
    const verdict = await consumeRules(registerRules(await clientIp()), REGISTER_WINDOW_SECONDS);
    if (!verdict.allowed) return { error: waitMessage(verdict.retryAfterSeconds), values };

    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };

    const { name, email, password } = parsed.data;
    let user;
    try {
      user = await createUser({ name, email, passwordHash: await hashPassword(password) });
    } catch (err) {
      if (err instanceof EmailTakenError) {
        return { fieldErrors: { email: "An account with this email already exists. Try logging in." }, values: { name, email } };
      }
      throw err;
    }

    const session = await createSessionRow(user.id);
    await setSessionCookie(session.token, session.expiresAt);
  } catch (err) {
    console.error("register failed:", err instanceof Error ? err.message : "unknown error"); // never log form values
    return { error: GENERIC_ERROR, values };
  }
  redirect("/dashboard"); // outside try/catch: redirect() works by throwing
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = { email: text(formData, "email"), password: text(formData, "password") };
  const next = safeRedirectPath(text(formData, "next"));
  const values = { email: raw.email };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error), values };
  const { email, password } = parsed.data;

  try {
    // Every attempt is counted BEFORE the password is checked (atomically), so parallel
    // guesses cannot slip past the limit and blocked requests never cost an Argon2 check.
    const rules = loginRules(await clientIp(), email);
    const verdict = await consumeRules(rules, LOGIN_WINDOW_SECONDS);
    if (!verdict.allowed) return { error: waitMessage(verdict.retryAfterSeconds), values: { email } };

    const user = await findUserByEmail(email);
    const ok = user ? await verifyPassword(user.passwordHash, password) : (await burnPasswordCheck(password), false);
    if (!user || !ok) {
      // Same message for "no such account" and "wrong password" so emails cannot be probed.
      return { error: "Incorrect email or password.", values: { email } };
    }

    await settleSuccess(rules);
    await deleteExpiredSessions(user.id);
    const session = await createSessionRow(user.id);
    await setSessionCookie(session.token, session.expiresAt);
  } catch (err) {
    console.error("login failed:", err instanceof Error ? err.message : "unknown error");
    return { error: GENERIC_ERROR, values: { email } };
  }
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const token = await readSessionToken();
  if (token) await deleteSessionByToken(token);
  await clearSessionCookie();
  redirect("/login");
}
