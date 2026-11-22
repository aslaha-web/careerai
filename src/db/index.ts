import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __careeraiSql?: ReturnType<typeof postgres> };

/**
 * Lazy so that `next build` works without a database. The connection string
 * is read only on the server and never reaches client bundles.
 */
function getSql() {
  if (globalForDb.__careeraiSql) return globalForDb.__careeraiSql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill in your PostgreSQL connection string.",
    );
  }
  // prepare:false keeps this compatible with pooled connections (e.g. Neon's pooler).
  const sql = postgres(url, { max: 10, prepare: false, idle_timeout: 20 });
  // Reuse one pool across hot reloads in development.
  globalForDb.__careeraiSql = sql;
  return sql;
}

let cached: Database | undefined;

export function getDb(): Database {
  cached ??= drizzle(getSql(), { schema });
  return cached;
}

/** Close the pool (used by scripts and tests so the process can exit). */
export async function closeDb() {
  if (globalForDb.__careeraiSql) {
    await globalForDb.__careeraiSql.end({ timeout: 5 });
    globalForDb.__careeraiSql = undefined;
    cached = undefined;
  }
}
