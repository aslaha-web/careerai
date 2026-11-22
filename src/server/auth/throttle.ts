import { consumeAttempt, limiterKey, refundAttempt, resetLimit } from "./rate-limit";

/** One counter that a request must stay under. */
export interface Rule {
  key: string;
  max: number;
  /**
   * What to do with this counter after a SUCCESSFUL login:
   * - reset:  clear it. Safe for counters tied to one account, because only someone who
   *           already knows that account's password can reach this point.
   * - refund: give back just this request's attempt. Used for the per-IP counter, so an
   *           attacker cannot wipe their failures by logging in to an account of their own.
   * - keep:   leave it (registration).
   */
  onSuccess: "reset" | "refund" | "keep";
}

export const LOGIN_WINDOW_SECONDS = 15 * 60;
export const REGISTER_WINDOW_SECONDS = 60 * 60;

/**
 * Login limits. `ip` is null whenever TRUST_PROXY is not configured, because then no client IP can be trusted.
 *
 *  - per email (any IP): stops one account being guessed from many addresses.
 *      With a known IP the cap is 20 so a stranger cannot lock you out with 5 bad guesses.
 *      Without an IP it is the only protection, so it is the strict 5 (safe, but anyone can then lock an account for 15 minutes).
 *  - per IP + email: 5 tries per address per account.
 *  - per IP (all emails): 30, which slows password spraying and credential stuffing from one address.
 */
export function loginRules(ip: string | null, email: string): Rule[] {
  const rules: Rule[] = [{ key: limiterKey("login-email", email), max: ip ? 20 : 5, onSuccess: "reset" }];
  if (ip) {
    rules.push(
      { key: limiterKey("login-ip-email", ip, email), max: 5, onSuccess: "reset" },
      { key: limiterKey("login-ip", ip), max: 30, onSuccess: "refund" },
    );
  }
  return rules;
}

/** 10 sign-ups per IP per hour. Without a trusted IP everyone shares one bucket, so it is looser (60). */
export function registerRules(ip: string | null): Rule[] {
  return ip
    ? [{ key: limiterKey("register-ip", ip), max: 10, onSuccess: "keep" }]
    : [{ key: limiterKey("register-shared"), max: 60, onSuccess: "keep" }];
}

export interface Verdict {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** Counts one attempt against every rule (atomically each) and reports whether any limit is exceeded. */
export async function consumeRules(rules: Rule[], windowSeconds: number): Promise<Verdict> {
  let retryAfterSeconds = 0;
  for (const rule of rules) {
    const { attempts, retryAfterSeconds: retry } = await consumeAttempt(rule.key, windowSeconds);
    if (attempts > rule.max) retryAfterSeconds = Math.max(retryAfterSeconds, retry);
  }
  return { allowed: retryAfterSeconds === 0, retryAfterSeconds };
}

export async function settleSuccess(rules: Rule[]): Promise<void> {
  await Promise.all(
    rules.map((rule) =>
      rule.onSuccess === "reset" ? resetLimit(rule.key) : rule.onSuccess === "refund" ? refundAttempt(rule.key) : undefined,
    ),
  );
}
