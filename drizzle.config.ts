import { defineConfig } from "drizzle-kit";

// `db:generate` only reads the schema, so it needs no database connection.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
});
