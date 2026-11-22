# CareerAI

AI-powered career assistant (portfolio project).

| Step | Status |
|------|--------|
| 1. Design system, theme, sidebar, dashboard shell | Done |
| 2. PostgreSQL + authentication (hardened) | Done |
| 3. Public pages: home, features, about, contact | **Done (this version)** |
| 4+. Resume analyzer and the AI features | Not started |

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

## Public pages (Step 3)

| Page | Path | Notes |
|---|---|---|
| Home | `/` | Landing page. Signed-in visitors see "Dashboard" instead of "Log in". `/` no longer redirects. |
| Features | `/features` | One section per feature, with labelled example illustrations. |
| About | `/about` | Who it is for, principles, stack. |
| Contact | `/contact` | See below. |

**Public by list.** These paths are in `PUBLIC_PATHS` in `src/lib/routes.ts`; everything else still requires a session.
A test checks that every page folder under `src/app/(public)` and `src/app/(auth)` is listed there, and that every
signed-in page is not, so a forgotten entry fails `npm test` instead of silently redirecting visitors to the login page.

**Contact form.** There is deliberately no mail server or database behind it (a table would change the schema, and an email
service would be a new dependency to run and keep free). Instead, the form validates the message and opens the visitor's
own email app with it pre-filled (`mailto:`). Set the destination in `.env`:

```bash
CONTACT_EMAIL=you@example.com
```

Without it, the page shows a neutral notice (and a setup hint in development) instead of a form. Visitors without a
configured email app can copy the address with the "Copy address" button. If you later want real submissions stored or
emailed, that needs a new table or a provider (check its current free-tier limits first); it is not part of this step.

**Feature status.** `src/config/features.ts` is the single source for the feature copy. Every feature is currently
`"coming-soon"`, which shows a "Coming soon" badge on the home and features pages. When a feature ships, set its
`status` to `"available"` and the badge disappears everywhere. (`tests/public.test.ts` asserts the current statuses, so
update that expectation in the same change.)

**Illustrations** on these pages are built from the app's own components (score ring, progress bars, tags) and are
labelled "Example, not real data". No stock photos or external images are used.

**Colours.** The public pages use a small set of additional tokens in `globals.css` (`--cta`, `--brand-text`,
`--accent-text`, `--success-text`, `--warning-text`) so text and buttons meet WCAG AA contrast (4.5:1) in both themes.
They are additive: no existing token was changed.

## Known accessibility gap in the Step 1 and 2 colours

An automated check (axe-core) passes on all four public pages in both themes, on desktop and mobile. It still reports
colour-contrast failures on `/login` and `/register`, which come from the shared Step 1 tokens and were left alone on purpose:
white text on the dark-mode primary button is 3.94:1, the light-mode primary blue is 4.49:1 on white (4.16:1 on the page
background) and its tinted badges are lower, and the light-mode warning badge is 2.68:1. The same tokens appear in the
dashboard. A fix is a small shade adjustment to those tokens, or using the new `--cta` / `--brand-text` tokens there.

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

`npm test` runs 65 tests:

- `tests/auth-db.test.ts` (34): mostly integration tests against the database in `DATABASE_URL` (hashing, user creation, sessions, atomic rate limiting under a parallel burst, ownership constraints, cross-user isolation, constraints, cascades, validation, redirect safety).
- `tests/client-ip.test.ts` (14): pure unit tests for client-IP resolution.
- `tests/public.test.ts` (17): pure unit tests for the public pages (which routes are public, honesty caveats in the feature copy, contact form validation and mailto injection safety). Database tests assert exact PostgreSQL error codes and constraint names. Tests create throwaway users (`test-...@example.test`) and
delete them afterwards, but **point `DATABASE_URL` at a development database, never production.**

## Environment variables

See `.env.example`. `DATABASE_URL` is the only required one, and it is read only on the server. `CONTACT_EMAIL` is optional and is shown on the public contact page by design (it is the address visitors write to).
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
  app/(public)/      home, features, about, contact
  app/(auth)/        login, register
  app/(app)/         signed-in pages (guarded by requireUser)
  db/                schema.ts, client
  server/auth/       passwords, sessions, rate limit, actions, dal
  server/data/       user-scoped queries
  lib/               utils, routes, validation
  components/        ui, layout, auth, dashboard, marketing
drizzle/             generated SQL migrations
scripts/migrate.ts   migration runner
tests/               integration tests
```
