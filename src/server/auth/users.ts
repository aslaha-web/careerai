import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userProfiles, users, type User } from "@/db/schema";

export class EmailTakenError extends Error {
  constructor() {
    super("Email already registered");
    this.name = "EmailTakenError";
  }
}

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await getDb().select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return user;
}

/** Creates the user and an empty profile row atomically. Email must already be normalised. */
export async function createUser(input: { name: string; email: string; passwordHash: string }) {
  try {
    return await getDb().transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ name: input.name, email: input.email.toLowerCase(), passwordHash: input.passwordHash })
        .returning({ id: users.id, name: users.name, email: users.email });
      await tx.insert(userProfiles).values({ userId: user.id });
      return user;
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw new EmailTakenError();
    throw err;
  }
}
