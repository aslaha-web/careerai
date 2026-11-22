import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { SESSION_TTL_MS } from "@/lib/auth-constants";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

/** 256 bits from the OS CSPRNG. This value lives only in the user's cookie. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only this hash is stored, so reading the database does not reveal usable session tokens. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSessionRow(userId: string, now = Date.now()) {
  const token = generateToken();
  const expiresAt = new Date(now + SESSION_TTL_MS);
  await getDb().insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt };
}

export async function findSessionUser(token: string): Promise<SessionUser | null> {
  if (!token || token.length > 128) return null;
  const [row] = await getDb()
    .select({ id: users.id, name: users.name, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

export async function deleteExpiredSessions(userId: string): Promise<void> {
  await getDb().delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));
}
