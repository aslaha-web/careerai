"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import type { AuthFormState } from "@/lib/validation/auth";
import { registerAction } from "@/server/auth/actions";

export function RegisterForm() {
  const [state, formAction] = useActionState<AuthFormState, FormData>(registerAction, {});

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <Alert>{state.error}</Alert> : null}

      <Field
        label="Full name"
        name="name"
        autoComplete="name"
        required
        maxLength={80}
        placeholder="Ada Lovelace"
        defaultValue={state.values?.name}
        error={state.fieldErrors?.name}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="you@example.com"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Field
        label="Password"
        name="password"
        autoComplete="new-password"
        required
        minLength={10}
        maxLength={128}
        hint="At least 10 characters. A few random words make a strong password."
        control={<PasswordInput />}
        error={state.fieldErrors?.password}
      />
      <Field
        label="Confirm password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        control={<PasswordInput />}
        error={state.fieldErrors?.confirmPassword}
      />

      <SubmitButton size="lg" className="w-full" pendingText="Creating account">
        Create account
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
