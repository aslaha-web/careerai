"use client";

import * as React from "react";
import { Mail } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { inputStyles } from "@/components/ui/input";
import { buildMailto, CONTACT_TOPICS, validateContact, type ContactFieldErrors } from "@/lib/contact";
import { cn } from "@/lib/utils";

const MAX_MESSAGE = 1000;

function Row({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const id = `${React.useId()}-${name}`;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? `${id}-error` : undefined })}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Validates, then opens the visitor's email app with the message pre-filled (mailto).
 * Nothing is sent to or stored on our servers.
 */
export function ContactForm({ to }: { to: string }) {
  const [errors, setErrors] = React.useState<ContactFieldErrors>({});
  const [opened, setOpened] = React.useState(false);
  const [length, setLength] = React.useState(0);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateContact(Object.fromEntries(new FormData(event.currentTarget)));
    if (!result.ok) {
      setErrors(result.errors);
      setOpened(false);
      return;
    }
    setErrors({});
    setOpened(true);
    window.location.href = buildMailto(to, result.data);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {opened ? (
        <Alert tone="success">
          Your email app should open with the message ready to send. If nothing opened, copy the address on this page and email us directly.
        </Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" autoComplete="name" maxLength={80} required error={errors.name} />
        <Field label="Your email" name="email" type="email" autoComplete="email" inputMode="email" required error={errors.email} />
      </div>

      <Row label="Topic" name="topic" error={errors.topic}>
        {(aria) => (
          <select {...aria} name="topic" defaultValue={CONTACT_TOPICS[0]} className={cn(inputStyles, "appearance-auto")}>
            {CONTACT_TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </Row>

      <Row label="Message" name="message" error={errors.message}>
        {(aria) => (
          <>
            <textarea
              {...aria}
              name="message"
              rows={6}
              maxLength={MAX_MESSAGE}
              required
              onChange={(e) => setLength(e.target.value.length)}
              className={cn(inputStyles, "h-auto resize-y py-3")}
            />
            <p className="text-right text-xs text-muted-foreground">
              {length}/{MAX_MESSAGE}
            </p>
          </>
        )}
      </Row>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" className="bg-cta!">
          <Mail />
          Open in my email app
        </Button>
        <p className="text-xs text-muted-foreground">Nothing is stored on our servers. Your email app sends the message.</p>
      </div>
    </form>
  );
}
