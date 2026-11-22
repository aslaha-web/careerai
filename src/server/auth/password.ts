import { hash, verify } from "@node-rs/argon2";

/**
 * Argon2id with the OWASP-recommended minimum cost (19 MiB memory, 2 iterations, 1 lane).
 * Salt is generated per hash and embedded in the PHC string that we store.
 * `algorithm: 2` is Argon2id.
 */
const OPTIONS = { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false; // malformed hash: treat as a failed check, never throw to the caller
  }
}

let dummyHash: Promise<string> | undefined;

/**
 * Verify against a throwaway hash when the email does not exist, so that
 * "unknown email" and "wrong password" take about the same time.
 */
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword("not-a-real-password-just-for-timing");
  await verifyPassword(await dummyHash, password);
}
