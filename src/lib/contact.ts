import { z } from "zod";

/**
 * Contact form logic. There is no mail server or database behind the form (adding one would mean
 * new infrastructure, and a table), so submitting builds a `mailto:` link that opens the visitor's
 * own email app addressed to CONTACT_EMAIL. Pure functions here so they can be unit-tested.
 */

export const CONTACT_TOPICS = ["General question", "Bug report", "Feedback", "Partnership"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

/** Collapse whitespace and drop control characters (including CR/LF) from single-line fields. */
const singleLine = (v: string) => v.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();

export const contactSchema = z.object({
  name: z
    .string()
    .transform(singleLine)
    .pipe(z.string().min(1, "Enter your name.").max(80, "Use 80 characters or fewer.")),
  email: z
    .string()
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.string().min(1, "Enter your email.").max(254, "Email is too long.").pipe(z.email("Enter a valid email address."))),
  topic: z.enum(CONTACT_TOPICS, { error: "Choose a topic." }),
  message: z
    .string()
    .transform((v) =>
      v
        .replace(/\r\n?/g, "\n")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .trim(),
    )
    .pipe(z.string().min(10, "Write at least 10 characters.").max(1000, "Use 1000 characters or fewer.")),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactFieldErrors = Partial<Record<keyof ContactInput, string>>;

export function validateContact(raw: Record<string, unknown>):
  | { ok: true; data: ContactInput }
  | { ok: false; errors: ContactFieldErrors } {
  const parsed = contactSchema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const flat = z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>;
  const errors: ContactFieldErrors = {};
  for (const key of ["name", "email", "topic", "message"] as const) {
    const first = flat[key]?.[0];
    if (first) errors[key] = first;
  }
  return { ok: false, errors };
}

/** Returns the configured contact address, or null if it is missing or not a valid email. */
export function parseContactEmail(value: string | undefined): string | null {
  const parsed = z.email().safeParse((value ?? "").trim());
  return parsed.success ? parsed.data.toLowerCase() : null;
}

/**
 * Every visitor-supplied value is percent-encoded, so text such as "&cc=someone@x.com" or a line
 * break cannot add extra mail headers or recipients: it stays inside the subject/body value.
 */
export function buildMailto(to: string, data: ContactInput): string {
  const subject = `[CareerAI] ${data.topic}`;
  const body = `${data.message}\n\n--\n${data.name} (${data.email})`;
  const address = encodeURIComponent(to).replace("%40", "@");
  return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
