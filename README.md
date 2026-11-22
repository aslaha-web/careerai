# CareerAI

AI-powered career assistant (portfolio project).

| Step | Status |
|------|--------|
| 1. Design system, theme, sidebar, dashboard shell | Done |
| 2. PostgreSQL + authentication | **Done (this version)** |
| 3+. Public pages, resume analyzer, AI features | Not started |

The dashboard still shows **sample statistics** (labelled on screen); they are replaced
with real per-user queries in a later step. Everything about the signed-in user is real.

## Quick start

Requires Node.js 20+ and **PostgreSQL 15 or newer** (see "Get a database" below). Version 15 is needed for
`ON DELETE SET NULL (column)`, used by one ownership constraint. PostgreSQL 14 reaches end of life in November 2026 under the PostgreSQL versioning policy.

```bash
npm install
cp .env.example .env        # then put your DATABASE_URL in .env
npm run db:migrate          # creates all tables
npm run dev                 # http://localhost:3000
```

Open http://localhost:3000, click **Create an account**, and you are in.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run typecheck` | TypeScript check |
| `npm run db:generate` | After editing `src/db/schema.ts`, create a new SQL migration in `drizzle/` |
| `npm run db:migrate` | Apply pending migrations to `DATABASE_URL` |
| `npm test` | Integration tests against your database (see below) |

## Get a database

You must supply the connection string; none is bundled. Format:
`postgresql://USER:PASSWORD@HOST:5432/DATABASE`

**Option A: local PostgreSQL (free, offline).** Install PostgreSQL 15+ (or run it with Docker):

```bash
docker run --name careerai-db -e POSTGRES_PASSWORD=choose-a-password -e POSTGRES_DB=careerai -p 5432:5432 -d postgres:16
# DATABASE_URL=postgresql://postgres:choose-a-password@localhost:5432/careerai
```

**Option B: a hosted free tier such as Neon.** Create a project, copy its connection string
(keep `?sslmode=require` if present) into `.env`. At the time of writing, Neon's docs describe
the Free plan as 1 GB storage and 100 compute-hours per project per month with no overage
charges, and compute that suspends when idle. Limits change, so check the current pricing
page and do not add a payment method.

## How authentication works

- **Passwords**: hashed with Argon2id (OWASP-minimum cost, per-password salt). Plain passwords are never stored or logged.
- **Sessions**: a random 256-bit token in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production). Only a SHA-256 hash of the token is stored in the `sessions` table, and every request is checked against the database. Logging out deletes the row, so a copied cookie stops working immediately. Sessions last 14 days (fixed, not extended).
- **Route protection**: `src/middleware.ts` redirects visitors without a cookie to `/login`; `requireUser()` in `src/app/(app)/layout.tsx` does the real check. New routes are **protected by default**; public ones are listed in `src/lib/routes.ts`.
- **Forms**: Next.js Server Actions (built-in Origin check against CSRF) with Zod validation on the server, and native browser validation for instant feedback.
- **Brute-force protection**: every login attempt is counted *before* the password is checked, in one atomic SQL statement, so a burst of parallel guesses cannot slip past the limit. Limits: 5 tries per account per IP, 20 per account across all IPs, 30 per IP across all accounts (15-minute windows), and 10 sign-ups per IP per hour. Counters are stored hashed in `auth_rate_limits`. These rely on knowing the visitor's real IP, which needs the `TRUST_PROXY` setting below.
- **Login errors** are identical for "unknown email" and "wrong password", and unknown emails still burn an Argon2 check so timing does not reveal accounts.
- **Redirects**: `?next=` accepts only same-site relative paths.

### Per-user data rule

Every query on user-owned data takes `userId` from `requireUser()` (never from the request)
and filters on it. See `src/server/data/resumes.ts` for the pattern to copy. As a second
layer, child tables (analyses, questions, answers, roadmap tasks) reference their parent
with a composite foreign key `(parent_id, user_id)`, so PostgreSQL itself rejects a row that
points at another user's data.

## Deploying behind a proxy (client IP and `TRUST_PROXY`)

Throttling needs the visitor's IP address, and the only place a web app can read it is
forwarding headers such as `X-Forwarded-For`. **Any visitor can send those headers**, so
trusting them blindly lets an attacker invent a new "IP" on every request and never hit a limit.
CareerAI therefore ignores them unless you say which proxy to trust:

| Where it runs | Set | What happens |
|---|---|---|
| Local development, or unsure | leave `TRUST_PROXY` empty | All forwarding headers are ignored. Login throttling is **per account only**: 5 attempts per 15 minutes. Safe, but anyone can lock a given account for 15 minutes. |
| **Vercel** | `TRUST_PROXY=vercel` | Uses `x-vercel-forwarded-for` (falls back to `x-forwarded-for`). Vercel's docs say it overwrites `X-Forwarded-For` and does not forward client-supplied values. |
| nginx, or a single load balancer that **appends** to `X-Forwarded-For` | `TRUST_PROXY=1` | Uses the **rightmost** `X-Forwarded-For` entry, which your proxy appended. Left entries are client-supplied and ignored. |
| Two proxies you control (e.g. CDN + load balancer, both appending) | `TRUST_PROXY=2` | Uses the 2nd entry from the right. |

Rules of thumb:

- Set it to `vercel` **only on Vercel**. On any other host that value would trust a header the client can forge.
- The number must equal the proxies **you control** that append to `X-Forwarded-For`. Too high and the app reads an entry the client controls; the app returns "unknown IP" if the header is shorter than the number you set. Check your host's documentation for how it builds this header, since some hosts replace the header instead of appending.
- Your app must not be reachable except through that proxy. If visitors can hit the server directly, they can forge the header again.
- An invalid value is ignored with a warning and treated as "none" (the safe default). In production, "none" also logs a one-time warning.
- With a trusted IP, IPv6 addresses are grouped by their /64 prefix, because a single subscriber usually controls a whole /64.

Set it in your host's environment-variable settings (on Vercel: Project Settings, Environment Variables).
It is read at runtime on the server and never sent to the browser.

## Ownership rules in the database

User-owned data is protected at **two layers**: queries always filter by `user_id` (see
`src/server/data/resumes.ts`), and PostgreSQL itself rejects mismatched ownership through composite foreign keys:

- `saved_jobs (recommendation_id, user_id)` references `career_recommendations (id, user_id)`: a user cannot save someone else's recommendation. Deleting a recommendation keeps the saved job and clears only the link.
- `career_recommendation_skills` is **user-owned**: each row carries `user_id` and references the recommendation as `(recommendation_id, user_id)`.
- The `skills` catalogue is **intentionally global**: "SQL" is the same skill for everyone, rows are shared, and a skill cannot be deleted while any user references it. Design note for later steps: never list the entire catalogue to users if free-text skills can be added to it, or one user's typed text becomes visible to others. Offer a curated list instead.
- The same pattern already protects resume analyses, interview questions and answers, and roadmap tasks.

## Database schema (16 tables)

`users`, `sessions`, `auth_rate_limits`, `user_profiles` (1:1 with users), `skills` (shared catalogue),
`user_skills`, `resumes` (extracted text only, never the uploaded file), `resume_analyses`,
`career_recommendations`, `career_recommendation_skills`, `saved_jobs`, `interview_sessions`,
`interview_questions`, `interview_answers`, `learning_roadmaps`, `roadmap_tasks`.

Source of truth: `src/db/schema.ts`. Generated SQL: `drizzle/`. AI-produced rows carry a
`source` of `ai` or `demo` so demo content can never pass as real analysis.

## Tests

`npm test` runs 48 tests: 34 in `tests/auth-db.test.ts`, mostly integration tests against the database in
`DATABASE_URL` (hashing, user creation, sessions, atomic rate limiting under a parallel burst, ownership
constraints on saved jobs and recommendation skills, cross-user isolation, constraints, cascades, validation,
redirect safety), and 14 pure unit tests for client-IP resolution in `tests/client-ip.test.ts`. Database tests assert exact PostgreSQL error codes and constraint names. Tests create throwaway users (`test-...@example.test`) and
delete them afterwards, but **point `DATABASE_URL` at a development database, never production.**

## Environment variables

See `.env.example`. `DATABASE_URL` is the only required one. It is read only on the server.
`ALLOW_INSECURE_COOKIES=true` is for running `npm run build && npm start` over plain
`http://localhost`; never set it on a real deployment.

## Not included yet (honest list)

- **Password reset and email verification** need an email service; deliberately left out of Step 2.
- **Change password / delete account** arrive with Profile Settings.
- **CSP header**: basic security headers are set; a strict Content-Security-Policy needs nonces and is planned for the hardening step.
- **Throttling is per database**, which is fine at this scale. Without `TRUST_PROXY`, login limits are per account only (see above).

## Structure

```
src/
  app/(auth)/        login, register
  app/(app)/         signed-in pages (guarded by requireUser)
  db/                schema.ts, client
  server/auth/       passwords, sessions, rate limit, actions, dal
  server/data/       user-scoped queries
  lib/               utils, routes, validation
  components/        ui, layout, auth, dashboard
drizzle/             generated SQL migrations
scripts/migrate.ts   migration runner
tests/               integration tests
```
