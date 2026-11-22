import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { resumes, type NewResume } from "@/db/schema";

/**
 * Data access rule for the whole app: every function that touches user-owned
 * rows takes `userId` and puts it in the WHERE clause. Callers get `userId`
 * from `requireUser()`, never from the request body or URL.
 * The composite foreign keys in the schema back this up at database level.
 */

export function listResumes(userId: string) {
  return getDb()
    .select({ id: resumes.id, fileName: resumes.fileName, fileType: resumes.fileType, createdAt: resumes.createdAt })
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.createdAt));
}

export async function getResume(userId: string, resumeId: string) {
  const [row] = await getDb()
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createResume(userId: string, data: Omit<NewResume, "id" | "userId" | "createdAt">) {
  const [row] = await getDb().insert(resumes).values({ ...data, userId }).returning({ id: resumes.id });
  return row;
}

export async function deleteResume(userId: string, resumeId: string): Promise<boolean> {
  const deleted = await getDb()
    .delete(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .returning({ id: resumes.id });
  return deleted.length > 0;
}
