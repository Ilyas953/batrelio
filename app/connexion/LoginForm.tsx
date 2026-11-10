"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { NEXT_PATH_PARAM } from "@/lib/auth/next-path";
import { FormError, SubmitButton, TextField } from "@/components/ui/form";
import { signIn, type SignInState } from "@/lib/auth/actions";

const INITIAL_STATE: SignInState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-5">
      <Suspense fallback={null}>
        <NextPathInput />
      </Suspense>
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
      <p className="-mt-2 text-right text-base">
        <Link href="/mot-de-passe-oublie" className="font-semibold text-orange-700 underline">
          Mot de passe oublié ?
        </Link>
      </p>
      <FormError message={state.error} />
      <SubmitButton label="Se connecter" pendingLabel="Connexion…" />
      <p className="text-center text-base text-stone-600">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-orange-700 underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

// The page to come back to after signing in, carried from the link that led here.
function NextPathInput() {
  const nextPath = useSearchParams().get(NEXT_PATH_PARAM);
  return nextPath ? <input type="hidden" name={NEXT_PATH_PARAM} value={nextPath} /> : null;
}
