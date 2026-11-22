import { z } from "zod";

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password12", "password123", "passw0rd123", "123456789", "1234567890",
  "12345678910", "qwertyuiop", "qwerty12345", "qwerty123456", "iloveyou123", "letmein1234",
  "welcome1234", "admin12345", "abc1234567", "1q2w3e4r5t", "0123456789", "football123", "changeme123",
]);

/** Strip control characters, collapse whitespace, trim. */
const cleanText = (value: string) =>
  value.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();

const name = z
  .string()
  .transform(cleanText)
  .pipe(
    z
      .string()
      .min(1, "Enter your name.")
      .max(80, "Use 80 characters or fewer.")
      .refine((v) => !/[<>]/.test(v), "Name cannot contain < or >."),
  );

const email = z
  .string()
  .transform((v) => v.trim().toLowerCase())
  .pipe(z.string().min(1, "Enter your email.").max(254, "Email is too long.").pipe(z.email("Enter a valid email address.")));

const newPassword = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Use 128 characters or fewer.")
  .refine((v) => !COMMON_PASSWORDS.has(v.toLowerCase()), "That password is too common. Choose something harder to guess.");

export const registerSchema = z
  .object({
    name,
    email,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
    }
    if (data.password.toLowerCase() === data.email) {
      ctx.addIssue({ code: "custom", path: ["password"], message: "Password cannot be your email address." });
    }
  });

export const loginSchema = z.object({
  email,
  // Do not enforce new-password rules at login; only require something to check.
  password: z.string().min(1, "Enter your password.").max(128, "Password is too long."),
});

export type AuthField = "name" | "email" | "password" | "confirmPassword";

export interface AuthFormState {
  /** Form-level message (wrong credentials, rate limit, server error). */
  error?: string;
  fieldErrors?: Partial<Record<AuthField, string>>;
  /** Non-sensitive values to put back in the form after an error. Passwords are never echoed. */
  values?: { name?: string; email?: string };
}

export function toFieldErrors(error: z.ZodError): AuthFormState["fieldErrors"] {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const out: Partial<Record<AuthField, string>> = {};
  for (const key of ["name", "email", "password", "confirmPassword"] as const) {
    const first = flat[key]?.[0];
    if (first) out[key] = first;
  }
  return out;
}
