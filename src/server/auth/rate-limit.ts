import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";

/** Hash the parts so no email address or IP is ever written to the database. */
export function limiterKey(...parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

export interface Consumed {
  /** Attempts in the current window INCLUDING this one. Compare against your maximum. */
  attempts: number;
  retryAfterSeconds: number;
}

/**
 * Count one attempt and return the new total, in a single atomic statement.
 *
 * Counting BEFORE doing the work (and deciding from the returned number) is what makes the
 * limit hold under concurrency: 50 parallel requests get 50 distinct numbers, so only the
 * first `max` proceed. A separate "read the count, then record a failure later" would let a
 * burst of simultaneous guesses all see "under the limit".
 * A new window starts automatically once the old one has expired.
 */
export async function consumeAttempt(key: string, windowSeconds: number): Promise<Consumed> {
  const db = getDb();
  const rows = await db.execute<{ attempts: number; retry_after: number }>(sql`
    INSERT INTO auth_rate_limits (key, attempts, window_start) VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN auth_rate_limits.window_start <= now() - make_interval(secs => ${windowSeconds})
                      THEN 1 ELSE auth_rate_limits.attempts + 1 END,
      window_start = CASE WHEN auth_rate_limits.window_start <= now() - make_interval(secs => ${windowSeconds})
                          THEN now() ELSE auth_rate_limits.window_start END
    RETURNING attempts,
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (window_start + make_interval(secs => ${windowSeconds}) - now()))))::int AS retry_after`);
  // Housekeeping: occasionally drop counters older than a day.
  if (Math.random() < 0.02) {
    await db.execute(sql`DELETE FROM auth_rate_limits WHERE window_start < now() - interval '1 day'`);
  }
  return { attempts: rows[0].attempts, retryAfterSeconds: rows[0].retry_after };
}

/** Give back one attempt (used so successful logins do not count against a shared IP budget). */
export async function refundAttempt(key: string): Promise<void> {
  await getDb().execute(sql`UPDATE auth_rate_limits SET attempts = GREATEST(attempts - 1, 0) WHERE key = ${key}`);
}

export async function resetLimit(key: string): Promise<void> {
  await getDb().execute(sql`DELETE FROM auth_rate_limits WHERE key = ${key}`);
}
