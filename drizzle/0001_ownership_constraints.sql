-- Ownership constraints (requires PostgreSQL 15+ for "ON DELETE SET NULL (column)").
-- Hand-edited from the drizzle-kit output so it is safe on a database that already contains rows.

-- 1. Children reference a recommendation as the pair (id, user_id), which needs a matching unique key first.
ALTER TABLE "career_recommendations" ADD CONSTRAINT "career_recommendations_id_user_unique" UNIQUE("id","user_id");--> statement-breakpoint

-- 2. career_recommendation_skills becomes user-owned: add user_id, backfill it from the parent, then enforce it.
ALTER TABLE "career_recommendation_skills" DROP CONSTRAINT "career_recommendation_skills_recommendation_id_career_recommendations_id_fk";--> statement-breakpoint
ALTER TABLE "career_recommendation_skills" ADD COLUMN "user_id" uuid;--> statement-breakpoint
UPDATE "career_recommendation_skills" AS crs SET "user_id" = cr."user_id" FROM "career_recommendations" AS cr WHERE cr."id" = crs."recommendation_id";--> statement-breakpoint
ALTER TABLE "career_recommendation_skills" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "career_recommendation_skills" ADD CONSTRAINT "career_rec_skills_recommendation_owner_fk" FOREIGN KEY ("recommendation_id","user_id") REFERENCES "public"."career_recommendations"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- 3. saved_jobs may only reference the same user's recommendation.
--    Any pre-existing link to someone else's recommendation is cleared (the saved role itself is kept).
ALTER TABLE "saved_jobs" DROP CONSTRAINT "saved_jobs_recommendation_id_career_recommendations_id_fk";--> statement-breakpoint
UPDATE "saved_jobs" AS sj SET "recommendation_id" = NULL WHERE sj."recommendation_id" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "career_recommendations" AS cr WHERE cr."id" = sj."recommendation_id" AND cr."user_id" = sj."user_id");--> statement-breakpoint
-- SET NULL with a column list: when a recommendation is deleted, clear recommendation_id only (user_id is NOT NULL and must stay).
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_recommendation_owner_fk" FOREIGN KEY ("recommendation_id","user_id") REFERENCES "public"."career_recommendations"("id","user_id") ON DELETE set null ("recommendation_id") ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_jobs_recommendation_idx" ON "saved_jobs" USING btree ("recommendation_id");
