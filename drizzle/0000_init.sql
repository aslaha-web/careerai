CREATE TYPE "public"."content_source" AS ENUM('ai', 'demo');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."experience_level" AS ENUM('student', 'fresher', 'junior', 'mid', 'senior');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."roadmap_status" AS ENUM('active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."skill_level" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TABLE "auth_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_recommendation_skills" (
	"recommendation_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "career_recommendation_skills_pk" PRIMARY KEY("recommendation_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "career_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_title" text NOT NULL,
	"match_percent" smallint NOT NULL,
	"reasoning" text NOT NULL,
	"opportunities" text,
	"source" "content_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "career_recommendations_match_range" CHECK ("career_recommendations"."match_percent" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "interview_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer_text" text NOT NULL,
	"score" smallint,
	"feedback" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_answers_score_range" CHECK ("interview_answers"."score" is null or "interview_answers"."score" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "interview_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"question" text NOT NULL,
	"guidance" text,
	CONSTRAINT "interview_questions_id_user_unique" UNIQUE("id","user_id"),
	CONSTRAINT "interview_questions_session_position_unique" UNIQUE("session_id","position"),
	CONSTRAINT "interview_questions_position_positive" CHECK ("interview_questions"."position" >= 1)
);
--> statement-breakpoint
CREATE TABLE "interview_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_title" text NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"status" "interview_status" DEFAULT 'in_progress' NOT NULL,
	"source" "content_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "interview_sessions_id_user_unique" UNIQUE("id","user_id"),
	CONSTRAINT "interview_sessions_completed_consistent" CHECK (("interview_sessions"."status" = 'completed') = ("interview_sessions"."completed_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "learning_roadmaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"target_role" text NOT NULL,
	"current_level" "skill_level" NOT NULL,
	"total_weeks" smallint NOT NULL,
	"status" "roadmap_status" DEFAULT 'active' NOT NULL,
	"source" "content_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_roadmaps_id_user_unique" UNIQUE("id","user_id"),
	CONSTRAINT "learning_roadmaps_weeks_range" CHECK ("learning_roadmaps"."total_weeks" between 1 and 52)
);
--> statement-breakpoint
CREATE TABLE "resume_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"resume_id" uuid NOT NULL,
	"target_role" text,
	"overall_score" smallint NOT NULL,
	"report" jsonb NOT NULL,
	"source" "content_source" NOT NULL,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resume_analyses_score_range" CHECK ("resume_analyses"."overall_score" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"extracted_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resumes_id_user_unique" UNIQUE("id","user_id"),
	CONSTRAINT "resumes_file_type_valid" CHECK ("resumes"."file_type" in ('pdf', 'docx')),
	CONSTRAINT "resumes_file_size_range" CHECK ("resumes"."file_size_bytes" between 1 and 5242880),
	CONSTRAINT "resumes_file_name_length" CHECK (char_length("resumes"."file_name") between 1 and 255)
);
--> statement-breakpoint
CREATE TABLE "roadmap_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"roadmap_id" uuid NOT NULL,
	"week_number" smallint NOT NULL,
	"position" smallint NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "roadmap_tasks_order_unique" UNIQUE("roadmap_id","week_number","position"),
	CONSTRAINT "roadmap_tasks_week_positive" CHECK ("roadmap_tasks"."week_number" >= 1),
	CONSTRAINT "roadmap_tasks_position_positive" CHECK ("roadmap_tasks"."position" >= 1),
	CONSTRAINT "roadmap_tasks_completed_consistent" CHECK ("roadmap_tasks"."is_completed" or "roadmap_tasks"."completed_at" is null)
);
--> statement-breakpoint
CREATE TABLE "saved_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"recommendation_id" uuid,
	"role_title" text NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skills_name_length" CHECK (char_length("skills"."name") between 1 and 60)
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"headline" text,
	"bio" text,
	"location" text,
	"target_role" text,
	"experience_level" "experience_level",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_headline_length" CHECK ("user_profiles"."headline" is null or char_length("user_profiles"."headline") <= 120),
	CONSTRAINT "user_profiles_bio_length" CHECK ("user_profiles"."bio" is null or char_length("user_profiles"."bio") <= 1000)
);
--> statement-breakpoint
CREATE TABLE "user_skills" (
	"user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"level" smallint,
	"source" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_skills_pk" PRIMARY KEY("user_id","skill_id"),
	CONSTRAINT "user_skills_level_range" CHECK ("user_skills"."level" is null or "user_skills"."level" between 1 and 5),
	CONSTRAINT "user_skills_source_valid" CHECK ("user_skills"."source" in ('manual', 'resume'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_lowercase" CHECK ("users"."email" = lower("users"."email")),
	CONSTRAINT "users_email_length" CHECK (char_length("users"."email") between 3 and 254),
	CONSTRAINT "users_name_length" CHECK (char_length("users"."name") between 1 and 80)
);
--> statement-breakpoint
ALTER TABLE "career_recommendation_skills" ADD CONSTRAINT "career_recommendation_skills_recommendation_id_career_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."career_recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_recommendation_skills" ADD CONSTRAINT "career_recommendation_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_recommendations" ADD CONSTRAINT "career_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_answers" ADD CONSTRAINT "interview_answers_question_owner_fk" FOREIGN KEY ("question_id","user_id") REFERENCES "public"."interview_questions"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_session_owner_fk" FOREIGN KEY ("session_id","user_id") REFERENCES "public"."interview_sessions"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_roadmaps" ADD CONSTRAINT "learning_roadmaps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_analyses" ADD CONSTRAINT "resume_analyses_resume_owner_fk" FOREIGN KEY ("resume_id","user_id") REFERENCES "public"."resumes"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_roadmap_owner_fk" FOREIGN KEY ("roadmap_id","user_id") REFERENCES "public"."learning_roadmaps"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_recommendation_id_career_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."career_recommendations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "career_recommendation_skills_skill_idx" ON "career_recommendation_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE INDEX "career_recommendations_user_created_idx" ON "career_recommendations" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "interview_answers_question_idx" ON "interview_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "interview_answers_user_idx" ON "interview_answers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "interview_sessions_user_created_idx" ON "interview_sessions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "learning_roadmaps_user_status_idx" ON "learning_roadmaps" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "resume_analyses_user_created_idx" ON "resume_analyses" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "resume_analyses_resume_idx" ON "resume_analyses" USING btree ("resume_id");--> statement-breakpoint
CREATE INDEX "resumes_user_created_idx" ON "resumes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "roadmap_tasks_user_idx" ON "roadmap_tasks" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_jobs_user_role_unique" ON "saved_jobs" USING btree ("user_id",lower("role_title"));--> statement-breakpoint
CREATE INDEX "saved_jobs_user_idx" ON "saved_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "skills_name_unique" ON "skills" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "user_skills_skill_id_idx" ON "user_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");