import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { findSessionUser, type SessionUser } from "./session-store";
import { readSessionToken } from "./session";

/**
 * The one place that turns a cookie into a user. It checks the database every
 * time (cached only for the current request), so a deleted or expired session
 * stops working immediately.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await readSessionToken();
  return token ? findSessionUser(token) : null;
});

/** Use in layouts, pages, server actions and route handlers that need a signed-in user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
