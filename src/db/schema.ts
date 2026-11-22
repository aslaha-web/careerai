import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------
   Conventions
   - uuid primary keys (gen_random_uuid(), built into PostgreSQL 13+)
   - timestamptz everywhere
   - every user-owned table carries user_id. Child tables reference their
     parent with a COMPOSITE foreign key (parent_id, user_id), so the database
     itself refuses a row that points at another user's parent.
   - CHECK constraints guard value ranges even if application code is wrong.
------------------------------------------------------------------- */

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ---------------------------------- enums --------------------------------- */

export const experienceLevel = pgEnum("experience_level", ["student", "fresher", "junior", "mid", "senior"]);
export const skillLevel = pgEnum("skill_level", ["beginner", "intermediate", "advanced"]);
/** Whether content came from a real AI call or from labelled demo mode. */
export const contentSource = pgEnum("content_source", ["ai", "demo"]);
export const difficulty = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const interviewStatus = pgEnum("interview_status", ["in_progress", "completed"]);
export const roadmapStatus = pgEnum("roadmap_status", ["active", "completed", "archived"]);

/* ------------------------------ identity & auth ---------------------------- */

export const users = pgTable(
  "users",
  {
    id: id(),
    /** Always stored lowercase (enforced by the CHECK below). */
    email: text("email").notNull(),
    name: text("name").notNull(),
    /** Argon2id hash in PHC string format. The password itself is never stored. */
    passwordHash: text("password_hash").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("users_email_unique").on(t.email),
    check("users_email_lowercase", sql`${t.email} = lower(${t.email})`),
    check("users_email_length", sql`char_length(${t.email}) between 3 and 254`),
    check("users_name_length", sql`char_length(${t.name}) between 1 and 80`),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** SHA-256 of the random cookie token. A database leak does not yield usable sessions. */
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("sessions_token_hash_unique").on(t.tokenHash),
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ],
);

/** Fixed-window counters for login/registration throttling. Keys are hashed, so no email or IP is stored. */
export const authRateLimits = pgTable("auth_rate_limits", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

export const userProfiles = pgTable(
  "user_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    headline: text("headline"),
    bio: text("bio"),
    location: text("location"),
    targetRole: text("target_role"),
    experienceLevel: experienceLevel("experience_level"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("user_profiles_headline_length", sql`${t.headline} is null or char_length(${t.headline}) <= 120`),
    check("user_profiles_bio_length", sql`${t.bio} is null or char_length(${t.bio}) <= 1000`),
  ],
);

/* ------------------------------ skills catalogue --------------------------- */

export const skills = pgTable(
  "skills",
  {
    id: id(),
    name: text("name").notNull(),
    category: text("category"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("skills_name_unique").on(sql`lower(${t.name})`),
    check("skills_name_length", sql`char_length(${t.name}) between 1 and 60`),
  ],
);

export const userSkills = pgTable(
  "user_skills",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
    level: smallint("level"),
    source: text("source").notNull().default("manual"),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.skillId], name: "user_skills_pk" }),
    index("user_skills_skill_id_idx").on(t.skillId),
    check("user_skills_level_range", sql`${t.level} is null or ${t.level} between 1 and 5`),
    check("user_skills_source_valid", sql`${t.source} in ('manual', 'resume')`),
  ],
);

/* ------------------------------ resumes & analyses ------------------------- */

export const resumes = pgTable(
  "resumes",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    /** Only extracted text is stored, never the uploaded file itself. */
    extractedText: text("extracted_text").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("resumes_id_user_unique").on(t.id, t.userId),
    index("resumes_user_created_idx").on(t.userId, t.createdAt),
    check("resumes_file_type_valid", sql`${t.fileType} in ('pdf', 'docx')`),
    check("resumes_file_size_range", sql`${t.fileSizeBytes} between 1 and 5242880`),
    check("resumes_file_name_length", sql`char_length(${t.fileName}) between 1 and 255`),
  ],
);

export const resumeAnalyses = pgTable(
  "resume_analyses",
  {
    id: id(),
    userId: uuid("user_id").notNull(),
    resumeId: uuid("resume_id").notNull(),
    targetRole: text("target_role"),
    /** Estimated score, not a real ATS result. */
    overallScore: smallint("overall_score").notNull(),
    /** Structured report (strengths, gaps, formatting feedback). Validated in app code before saving. */
    report: jsonb("report").notNull(),
    source: contentSource("source").notNull(),
    model: text("model"),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "resume_analyses_resume_owner_fk",
      columns: [t.resumeId, t.userId],
      foreignColumns: [resumes.id, resumes.userId],
    }).onDelete("cascade"),
    index("resume_analyses_user_created_idx").on(t.userId, t.createdAt),
    index("resume_analyses_resume_idx").on(t.resumeId),
    check("resume_analyses_score_range", sql`${t.overallScore} between 0 and 100`),
  ],
);

/* ---------------------------- career recommendations ----------------------- */

export const careerRecommendations = pgTable(
  "career_recommendations",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleTitle: text("role_title").notNull(),
    matchPercent: smallint("match_percent").notNull(),
    reasoning: text("reasoning").notNull(),
    opportunities: text("opportunities"),
    /** AI-generated suggestion or demo content. Never a verified job listing. */
    source: contentSource("source").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("career_recommendations_id_user_unique").on(t.id, t.userId),
    index("career_recommendations_user_created_idx").on(t.userId, t.createdAt),
    check("career_recommendations_match_range", sql`${t.matchPercent} between 0 and 100`),
  ],
);

/**
 * Which skills one user's recommendation mentions. These rows are USER-OWNED
 * (they describe a private recommendation), so they carry user_id and use a
 * composite foreign key to the recommendation: PostgreSQL rejects a row whose
 * user_id differs from the recommendation's owner. The skill itself comes from
 * the shared `skills` catalogue, which is intentionally global.
 */
export const careerRecommendationSkills = pgTable(
  "career_recommendation_skills",
  {
    userId: uuid("user_id").notNull(),
    recommendationId: uuid("recommendation_id").notNull(),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.recommendationId, t.skillId], name: "career_recommendation_skills_pk" }),
    foreignKey({
      name: "career_rec_skills_recommendation_owner_fk",
      columns: [t.recommendationId, t.userId],
      foreignColumns: [careerRecommendations.id, careerRecommendations.userId],
    }).onDelete("cascade"),
    index("career_recommendation_skills_skill_idx").on(t.skillId),
  ],
);

export const savedJobs = pgTable(
  "saved_jobs",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recommendationId: uuid("recommendation_id"),
    roleTitle: text("role_title").notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [
    /**
     * A saved job may only point at one of the SAME user's recommendations.
     * The migration (drizzle/0001_*.sql) makes this `ON DELETE SET NULL (recommendation_id)`,
     * PostgreSQL 15+ syntax that clears only the recommendation and keeps user_id.
     * drizzle-kit cannot express the column list, so do not "fix" that clause when regenerating.
     */
    foreignKey({
      name: "saved_jobs_recommendation_owner_fk",
      columns: [t.recommendationId, t.userId],
      foreignColumns: [careerRecommendations.id, careerRecommendations.userId],
    }).onDelete("set null"),
    uniqueIndex("saved_jobs_user_role_unique").on(t.userId, sql`lower(${t.roleTitle})`),
    index("saved_jobs_user_idx").on(t.userId),
    index("saved_jobs_recommendation_idx").on(t.recommendationId),
  ],
);

/* ------------------------------ interview practice ------------------------- */

export const interviewSessions = pgTable(
  "interview_sessions",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleTitle: text("role_title").notNull(),
    difficulty: difficulty("difficulty").notNull(),
    status: interviewStatus("status").notNull().default("in_progress"),
    source: contentSource("source").notNull(),
    createdAt: createdAt(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    unique("interview_sessions_id_user_unique").on(t.id, t.userId),
    index("interview_sessions_user_created_idx").on(t.userId, t.createdAt),
    check(
      "interview_sessions_completed_consistent",
      sql`(${t.status} = 'completed') = (${t.completedAt} is not null)`,
    ),
  ],
);

export const interviewQuestions = pgTable(
  "interview_questions",
  {
    id: id(),
    userId: uuid("user_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    position: smallint("position").notNull(),
    question: text("question").notNull(),
    guidance: text("guidance"),
  },
  (t) => [
    foreignKey({
      name: "interview_questions_session_owner_fk",
      columns: [t.sessionId, t.userId],
      foreignColumns: [interviewSessions.id, interviewSessions.userId],
    }).onDelete("cascade"),
    unique("interview_questions_id_user_unique").on(t.id, t.userId),
    unique("interview_questions_session_position_unique").on(t.sessionId, t.position),
    check("interview_questions_position_positive", sql`${t.position} >= 1`),
  ],
);

export const interviewAnswers = pgTable(
  "interview_answers",
  {
    id: id(),
    userId: uuid("user_id").notNull(),
    questionId: uuid("question_id").notNull(),
    answerText: text("answer_text").notNull(),
    score: smallint("score"),
    feedback: jsonb("feedback"),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      name: "interview_answers_question_owner_fk",
      columns: [t.questionId, t.userId],
      foreignColumns: [interviewQuestions.id, interviewQuestions.userId],
    }).onDelete("cascade"),
    index("interview_answers_question_idx").on(t.questionId),
    index("interview_answers_user_idx").on(t.userId),
    check("interview_answers_score_range", sql`${t.score} is null or ${t.score} between 0 and 100`),
  ],
);

/* ------------------------------ learning roadmaps -------------------------- */

export const learningRoadmaps = pgTable(
  "learning_roadmaps",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    targetRole: text("target_role").notNull(),
    currentLevel: skillLevel("current_level").notNull(),
    totalWeeks: smallint("total_weeks").notNull(),
    status: roadmapStatus("status").notNull().default("active"),
    source: contentSource("source").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("learning_roadmaps_id_user_unique").on(t.id, t.userId),
    index("learning_roadmaps_user_status_idx").on(t.userId, t.status),
    check("learning_roadmaps_weeks_range", sql`${t.totalWeeks} between 1 and 52`),
  ],
);

export const roadmapTasks = pgTable(
  "roadmap_tasks",
  {
    id: id(),
    userId: uuid("user_id").notNull(),
    roadmapId: uuid("roadmap_id").notNull(),
    weekNumber: smallint("week_number").notNull(),
    position: smallint("position").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    foreignKey({
      name: "roadmap_tasks_roadmap_owner_fk",
      columns: [t.roadmapId, t.userId],
      foreignColumns: [learningRoadmaps.id, learningRoadmaps.userId],
    }).onDelete("cascade"),
    unique("roadmap_tasks_order_unique").on(t.roadmapId, t.weekNumber, t.position),
    index("roadmap_tasks_user_idx").on(t.userId),
    check("roadmap_tasks_week_positive", sql`${t.weekNumber} >= 1`),
    check("roadmap_tasks_position_positive", sql`${t.position} >= 1`),
    check("roadmap_tasks_completed_consistent", sql`${t.isCompleted} or ${t.completedAt} is null`),
  ],
);

/* ---------------------------------- types --------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
