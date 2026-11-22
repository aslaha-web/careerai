/**
 * Integration tests against a REAL PostgreSQL database (DATABASE_URL).
 * Every row is created with throwaway names and removed afterwards,
 * but run this against a development database, never production.
 * Run: npm test
 */
import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { eq, inArray, like, sql } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import {
  careerRecommendations,
  careerRecommendationSkills,
  resumeAnalyses,
  resumes,
  savedJobs,
  sessions,
  skills,
  userProfiles,
  users,
} from "@/db/schema";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { safeRedirectPath } from "@/lib/routes";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { consumeAttempt, limiterKey, refundAttempt, resetLimit } from "@/server/auth/rate-limit";
import { createSessionRow, deleteSessionByToken, findSessionUser, hashToken } from "@/server/auth/session-store";
import { consumeRules, loginRules, registerRules, settleSuccess, type Rule } from "@/server/auth/throttle";
import { createUser, EmailTakenError, findUserByEmail } from "@/server/auth/users";
import { createResume, deleteResume, getResume, listResumes } from "@/server/data/resumes";

const run = Math.random().toString(36).slice(2, 10);
const emailFor = (label: string) => `test-${run}-${label}@example.test`;
const createdEmails: string[] = [];
const createdKeys: string[] = [];

async function makeUser(label: string, password = "a-long-test-password") {
  const email = emailFor(label);
  createdEmails.push(email);
  return createUser({ name: `Test ${label}`, email, passwordHash: await hashPassword(password) });
}

const testKey = (label: string) => {
  const key = limiterKey("test", run, label);
  createdKeys.push(key);
  return key;
};

async function makeRecommendation(userId: string, roleTitle = "Test role") {
  const [row] = await getDb()
    .insert(careerRecommendations)
    .values({ userId, roleTitle, matchPercent: 75, reasoning: "because", source: "demo" })
    .returning({ id: careerRecommendations.id });
  return row;
}

async function makeSkill(label: string) {
  const [row] = await getDb().insert(skills).values({ name: `test-${run}-${label}` }).returning({ id: skills.id });
  return row;
}

/** Assert a specific PostgreSQL error, so a test cannot pass because of an unrelated failure. */
async function assertPgError(promise: Promise<unknown>, code: string, constraint?: string) {
  await assert.rejects(promise, (err: unknown) => {
    const e = ((err as { cause?: unknown }).cause ?? err) as { code?: string; constraint_name?: string; message?: string };
    assert.equal(e.code, code, `expected SQLSTATE ${code}, got ${e.code}: ${e.message}`);
    if (constraint) assert.equal(e.constraint_name, constraint);
    return true;
  });
}

const FK_VIOLATION = "23503";
const NOT_NULL_VIOLATION = "23502";
const CHECK_VIOLATION = "23514";

const RESUME = { fileName: "cv.pdf", fileType: "pdf", fileSizeBytes: 1200, extractedText: "hello" };

after(async () => {
  const db = getDb();
  if (createdEmails.length) await db.delete(users).where(inArray(users.email, createdEmails)); // cascades to owned rows
  await db.delete(skills).where(like(skills.name, `test-${run}-%`));
  if (createdKeys.length) await db.execute(sql`DELETE FROM auth_rate_limits WHERE key IN ${createdKeys}`);
  await closeDb();
});

describe("password hashing", () => {
  it("never stores the plain password and verifies correctly", async () => {
    const hash = await hashPassword("correct horse battery");
    assert.match(hash, /^\$argon2id\$/);
    assert.ok(!hash.includes("correct horse"));
    assert.equal(await verifyPassword(hash, "correct horse battery"), true);
    assert.equal(await verifyPassword(hash, "wrong password!!"), false);
    assert.equal(await verifyPassword("not-a-hash", "anything"), false);
  });

  it("uses a fresh salt each time", async () => {
    assert.notEqual(await hashPassword("same-password-1"), await hashPassword("same-password-1"));
  });
});

describe("users", () => {
  it("creates a user with lowercase email and a profile row", async () => {
    const u = await makeUser("create");
    const found = await findUserByEmail(emailFor("create").toUpperCase());
    assert.equal(found?.id, u.id);
    assert.notEqual(found?.passwordHash, "a-long-test-password");
    const [profile] = await getDb().select().from(userProfiles).where(eq(userProfiles.userId, u.id));
    assert.ok(profile);
  });

  it("rejects a duplicate email regardless of case", async () => {
    await makeUser("dup");
    await assert.rejects(
      createUser({ name: "X", email: emailFor("dup").toUpperCase(), passwordHash: "x" }),
      EmailTakenError,
    );
  });

  it("database itself refuses an uppercase email", async () => {
    await assertPgError(
      getDb().insert(users).values({ name: "X", email: `UPPER-${run}@example.test`, passwordHash: "x" }),
      CHECK_VIOLATION,
      "users_email_lowercase",
    );
  });
});

describe("sessions", () => {
  it("round-trips a session and stores only a hash of the token", async () => {
    const u = await makeUser("session");
    const { token } = await createSessionRow(u.id);
    assert.equal((await findSessionUser(token))?.id, u.id);
    const rows = await getDb().select().from(sessions).where(eq(sessions.userId, u.id));
    assert.equal(rows.length, 1);
    assert.notEqual(rows[0].tokenHash, token);
    assert.equal(rows[0].tokenHash, hashToken(token));
  });

  it("rejects unknown, expired and deleted sessions", async () => {
    const u = await makeUser("session2");
    assert.equal(await findSessionUser("totally-made-up-token"), null);

    const { token } = await createSessionRow(u.id);
    await getDb().update(sessions).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(sessions.userId, u.id));
    assert.equal(await findSessionUser(token), null, "expired session must not authenticate");

    const fresh = await createSessionRow(u.id);
    assert.ok(await findSessionUser(fresh.token));
    await deleteSessionByToken(fresh.token);
    assert.equal(await findSessionUser(fresh.token), null, "logged-out session must not authenticate");
  });
});

describe("rate limiting", () => {
  it("counts attempts, starts a new window after expiry, and resets", async () => {
    const key = testKey("window");
    const first = await consumeAttempt(key, 900);
    assert.equal(first.attempts, 1);
    for (let i = 0; i < 4; i++) await consumeAttempt(key, 900);
    const sixth = await consumeAttempt(key, 900);
    assert.equal(sixth.attempts, 6);
    assert.ok(sixth.retryAfterSeconds > 0 && sixth.retryAfterSeconds <= 900);

    await getDb().execute(sql`UPDATE auth_rate_limits SET window_start = now() - interval '1 hour' WHERE key = ${key}`);
    assert.equal((await consumeAttempt(key, 900)).attempts, 1, "expired window starts over at 1");

    await resetLimit(key);
    assert.equal((await consumeAttempt(key, 900)).attempts, 1, "reset clears the counter");
  });

  it("refund gives back exactly one attempt and never goes below zero", async () => {
    const key = testKey("refund");
    await consumeAttempt(key, 900);
    await consumeAttempt(key, 900);
    await refundAttempt(key);
    assert.equal((await consumeAttempt(key, 900)).attempts, 2);
    await resetLimit(key);
    await refundAttempt(key); // no row: must be a harmless no-op
  });

  it("holds under a parallel burst: 40 simultaneous attempts get 40 distinct counts", async () => {
    const key = testKey("burst");
    const results = await Promise.all(Array.from({ length: 40 }, () => consumeAttempt(key, 900)));
    const counts = results.map((r) => r.attempts).sort((a, b) => a - b);
    assert.deepEqual(counts, Array.from({ length: 40 }, (_, i) => i + 1));
    const max = 5;
    assert.equal(results.filter((r) => r.attempts <= max).length, max, "exactly `max` attempts may proceed");
  });

  it("consumeRules blocks once any rule is exceeded and reports a wait time", async () => {
    const rules: Rule[] = [
      { key: testKey("rules-a"), max: 3, onSuccess: "reset" },
      { key: testKey("rules-b"), max: 100, onSuccess: "refund" },
    ];
    for (let i = 0; i < 3; i++) assert.equal((await consumeRules(rules, 900)).allowed, true);
    const blocked = await consumeRules(rules, 900);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterSeconds > 0);
  });

  it("successful login clears per-account counters but only refunds the per-IP counter", async () => {
    const email = emailFor("throttle");
    const rules = loginRules("203.0.113.9", email);
    createdKeys.push(...rules.map((r) => r.key));
    for (let i = 0; i < 3; i++) await consumeRules(rules, 900); // 3 failed attempts

    await consumeRules(rules, 900); // the 4th attempt succeeds
    await settleSuccess(rules);

    const byKey = new Map<string, number>();
    for (const r of rules) byKey.set(r.key, (await consumeAttempt(r.key, 900)).attempts);
    const [perEmail, perIpEmail, perIp] = rules.map((r) => byKey.get(r.key));
    assert.equal(perEmail, 1, "per-email counter was reset");
    assert.equal(perIpEmail, 1, "per-IP+email counter was reset");
    assert.equal(perIp, 4, "per-IP counter keeps the 3 failures (the success was refunded): 3 + this probe");
  });
});

describe("login and register rule sets", () => {
  it("without a trusted IP, login falls back to a strict per-email limit only", () => {
    const rules = loginRules(null, "a@example.test");
    assert.equal(rules.length, 1);
    assert.equal(rules[0].max, 5);
  });

  it("with a trusted IP, login adds per-IP+email and per-IP limits and loosens the per-email cap", () => {
    const rules = loginRules("198.51.100.7", "a@example.test");
    assert.deepEqual(rules.map((r) => r.max), [20, 5, 30]);
    assert.equal(new Set(rules.map((r) => r.key)).size, 3, "keys are distinct");
    for (const r of rules) assert.ok(!r.key.includes("198.51.100.7") && !r.key.includes("a@example.test"), "keys are hashed");
  });

  it("different emails never share a per-email counter; the same email always does", () => {
    assert.notEqual(loginRules(null, "a@example.test")[0].key, loginRules(null, "b@example.test")[0].key);
    assert.equal(loginRules(null, "a@example.test")[0].key, loginRules("203.0.113.1", "a@example.test")[0].key);
  });

  it("registration is per IP when known, and a shared looser bucket when not", () => {
    assert.equal(registerRules("203.0.113.1")[0].max, 10);
    assert.equal(registerRules(null)[0].max, 60);
    assert.notEqual(registerRules("203.0.113.1")[0].key, registerRules("203.0.113.2")[0].key);
  });
});

describe("data isolation between users", () => {
  it("scoped queries never return another user's rows", async () => {
    const a = await makeUser("iso-a");
    const b = await makeUser("iso-b");
    const ra = await createResume(a.id, RESUME);
    const rb = await createResume(b.id, { ...RESUME, fileName: "b.pdf" });

    assert.deepEqual((await listResumes(a.id)).map((r) => r.id), [ra.id]);
    assert.ok(await getResume(a.id, ra.id));
    assert.equal(await getResume(a.id, rb.id), null, "A cannot read B's resume by id");
    assert.equal(await deleteResume(a.id, rb.id), false, "A cannot delete B's resume");
    assert.ok(await getResume(b.id, rb.id), "B's resume is untouched");
  });

  it("database rejects a child row that points at another user's parent", async () => {
    const a = await makeUser("fk-a");
    const b = await makeUser("fk-b");
    const rb = await createResume(b.id, RESUME);
    await assertPgError(
      getDb().insert(resumeAnalyses).values({ userId: a.id, resumeId: rb.id, overallScore: 50, report: {}, source: "demo" }),
      FK_VIOLATION,
      "resume_analyses_resume_owner_fk",
    );
    await getDb().insert(resumeAnalyses).values({ userId: b.id, resumeId: rb.id, overallScore: 50, report: {}, source: "demo" });
  });

  it("enforces value constraints and cascades on user deletion", async () => {
    const u = await makeUser("cascade");
    const r = await createResume(u.id, RESUME);
    await assertPgError(
      getDb().insert(resumeAnalyses).values({ userId: u.id, resumeId: r.id, overallScore: 101, report: {}, source: "ai" }),
      CHECK_VIOLATION,
      "resume_analyses_score_range",
    );
    await assertPgError(createResume(u.id, { ...RESUME, fileType: "exe" }), CHECK_VIOLATION, "resumes_file_type_valid");
    await createSessionRow(u.id);

    await getDb().delete(users).where(eq(users.id, u.id));
    assert.equal((await getDb().select().from(resumes).where(eq(resumes.userId, u.id))).length, 0);
    assert.equal((await getDb().select().from(sessions).where(eq(sessions.userId, u.id))).length, 0);
  });
});

describe("saved_jobs ownership", () => {
  it("lets a user save their own recommendation, or a role with no recommendation", async () => {
    const a = await makeUser("sj-own");
    const rec = await makeRecommendation(a.id);
    await getDb().insert(savedJobs).values({ userId: a.id, recommendationId: rec.id, roleTitle: "Mine" });
    await getDb().insert(savedJobs).values({ userId: a.id, roleTitle: "Typed by hand" });
    assert.equal((await getDb().select().from(savedJobs).where(eq(savedJobs.userId, a.id))).length, 2);
  });

  it("rejects saving ANOTHER user's recommendation", async () => {
    const a = await makeUser("sj-a");
    const b = await makeUser("sj-b");
    const recB = await makeRecommendation(b.id, "B's private role");
    await assertPgError(
      getDb().insert(savedJobs).values({ userId: a.id, recommendationId: recB.id, roleTitle: "Stolen" }),
      FK_VIOLATION,
      "saved_jobs_recommendation_owner_fk",
    );
  });

  it("rejects re-pointing an existing saved job, or handing it to another user", async () => {
    const a = await makeUser("sj-upd-a");
    const b = await makeUser("sj-upd-b");
    const recA = await makeRecommendation(a.id);
    const recB = await makeRecommendation(b.id);
    const [saved] = await getDb()
      .insert(savedJobs)
      .values({ userId: a.id, recommendationId: recA.id, roleTitle: "Mine" })
      .returning({ id: savedJobs.id });

    await assertPgError(
      getDb().update(savedJobs).set({ recommendationId: recB.id }).where(eq(savedJobs.id, saved.id)),
      FK_VIOLATION,
      "saved_jobs_recommendation_owner_fk",
    );
    await assertPgError(
      getDb().update(savedJobs).set({ userId: b.id }).where(eq(savedJobs.id, saved.id)),
      FK_VIOLATION,
      "saved_jobs_recommendation_owner_fk",
    );
  });

  it("refuses to change a recommendation's owner while a saved job depends on it", async () => {
    const a = await makeUser("sj-own-a");
    const b = await makeUser("sj-own-b");
    const rec = await makeRecommendation(a.id);
    await getDb().insert(savedJobs).values({ userId: a.id, recommendationId: rec.id, roleTitle: "Mine" });
    await assertPgError(
      getDb().update(careerRecommendations).set({ userId: b.id }).where(eq(careerRecommendations.id, rec.id)),
      FK_VIOLATION,
    );
  });

  it("deleting the recommendation keeps the saved job and its owner; only the link is cleared", async () => {
    const a = await makeUser("sj-del");
    const rec = await makeRecommendation(a.id);
    const [saved] = await getDb()
      .insert(savedJobs)
      .values({ userId: a.id, recommendationId: rec.id, roleTitle: "Keep me" })
      .returning({ id: savedJobs.id });

    await getDb().delete(careerRecommendations).where(eq(careerRecommendations.id, rec.id));
    const [after] = await getDb().select().from(savedJobs).where(eq(savedJobs.id, saved.id));
    assert.ok(after, "saved job survives");
    assert.equal(after.recommendationId, null);
    assert.equal(after.userId, a.id, "user_id is untouched (column-list SET NULL)");
  });

  it("deleting the user removes their saved jobs", async () => {
    const a = await makeUser("sj-user-del");
    const rec = await makeRecommendation(a.id);
    await getDb().insert(savedJobs).values({ userId: a.id, recommendationId: rec.id, roleTitle: "Gone soon" });
    await getDb().delete(users).where(eq(users.id, a.id));
    assert.equal((await getDb().select().from(savedJobs).where(eq(savedJobs.userId, a.id))).length, 0);
  });
});

describe("career_recommendation_skills ownership", () => {
  it("lets the owner attach a skill to their recommendation", async () => {
    const a = await makeUser("crs-own");
    const rec = await makeRecommendation(a.id);
    const skill = await makeSkill("own");
    await getDb().insert(careerRecommendationSkills).values({ userId: a.id, recommendationId: rec.id, skillId: skill.id });
    const rows = await getDb().select().from(careerRecommendationSkills).where(eq(careerRecommendationSkills.recommendationId, rec.id));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].userId, a.id);
  });

  it("rejects a link whose user_id is not the recommendation's owner", async () => {
    const a = await makeUser("crs-a");
    const b = await makeUser("crs-b");
    const recB = await makeRecommendation(b.id);
    const skill = await makeSkill("mismatch");
    await assertPgError(
      getDb().insert(careerRecommendationSkills).values({ userId: a.id, recommendationId: recB.id, skillId: skill.id }),
      FK_VIOLATION,
      "career_rec_skills_recommendation_owner_fk",
    );
  });

  it("requires an owner on every row", async () => {
    const a = await makeUser("crs-null");
    const rec = await makeRecommendation(a.id);
    const skill = await makeSkill("null");
    await assertPgError(
      getDb().insert(careerRecommendationSkills).values({ recommendationId: rec.id, skillId: skill.id } as never),
      NOT_NULL_VIOLATION,
    );
  });

  it("keeps the skills catalogue shared: two users can reference one skill, and it cannot be deleted while in use", async () => {
    const a = await makeUser("crs-share-a");
    const b = await makeUser("crs-share-b");
    const recA = await makeRecommendation(a.id);
    const recB = await makeRecommendation(b.id);
    const skill = await makeSkill("shared");
    await getDb().insert(careerRecommendationSkills).values([
      { userId: a.id, recommendationId: recA.id, skillId: skill.id },
      { userId: b.id, recommendationId: recB.id, skillId: skill.id },
    ]);
    await assertPgError(getDb().delete(skills).where(eq(skills.id, skill.id)), FK_VIOLATION);
  });

  it("deleting a recommendation removes its skill links but not the shared skill", async () => {
    const a = await makeUser("crs-del");
    const rec = await makeRecommendation(a.id);
    const skill = await makeSkill("del");
    await getDb().insert(careerRecommendationSkills).values({ userId: a.id, recommendationId: rec.id, skillId: skill.id });
    await getDb().delete(careerRecommendations).where(eq(careerRecommendations.id, rec.id));
    assert.equal((await getDb().select().from(careerRecommendationSkills).where(eq(careerRecommendationSkills.skillId, skill.id))).length, 0);
    assert.equal((await getDb().select().from(skills).where(eq(skills.id, skill.id))).length, 1);
  });
});

describe("validation", () => {
  const good = { name: "  Ada   Lovelace ", email: " ADA@Example.COM ", password: "a-long-test-password", confirmPassword: "a-long-test-password" };

  it("normalises valid registration input", () => {
    const r = registerSchema.safeParse(good);
    assert.ok(r.success);
    assert.equal(r.data.name, "Ada Lovelace");
    assert.equal(r.data.email, "ada@example.com");
  });

  it("rejects weak, mismatched, common and malformed input", () => {
    const bad = (patch: object) => registerSchema.safeParse({ ...good, ...patch }).success;
    assert.equal(bad({ password: "short", confirmPassword: "short" }), false);
    assert.equal(bad({ confirmPassword: "different-password!" }), false);
    assert.equal(bad({ password: "password123", confirmPassword: "password123" }), false);
    assert.equal(bad({ email: "not-an-email" }), false);
    assert.equal(bad({ name: "<script>alert(1)</script>" }), false);
    assert.equal(bad({ name: "   " }), false);
    assert.equal(bad({ password: "x".repeat(129), confirmPassword: "x".repeat(129) }), false);
  });

  it("login only needs a non-empty password", () => {
    assert.ok(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success);
    assert.equal(loginSchema.safeParse({ email: "a@b.co", password: "" }).success, false);
  });
});

describe("safeRedirectPath", () => {
  it("allows only same-site relative paths", () => {
    assert.equal(safeRedirectPath("/resume-analyzer?x=1"), "/resume-analyzer?x=1");
    for (const evil of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", undefined, 42, "/login", "/register"]) {
      assert.equal(safeRedirectPath(evil), "/dashboard", String(evil));
    }
  });
});
