"use client";

import { useActionState } from "react";
import { FormError, SubmitButton, TextField } from "@/components/ui/form";
import { signIn, type SignInState } from "@/lib/auth/actions";

const INITIAL_STATE: SignInState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-5">
      <TextField
        label="Adresse e-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.email}
      />
      <TextField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <FormError message={state.error} />
      <SubmitButton label="Se connecter" pendingLabel="Connexion…" />
    </form>
  );
}
