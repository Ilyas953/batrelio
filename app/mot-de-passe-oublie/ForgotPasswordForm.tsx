"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useActionState } from "react";
import { FormError, SubmitButton, TextField } from "@/components/ui/form";
import { PASSWORD_RESET_SENT } from "@/lib/auth/password";
import { requestPasswordReset, type PasswordResetState } from "@/lib/auth/password-actions";

const INITIAL_STATE: PasswordResetState = {};

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, INITIAL_STATE);

  if (state.sent) {
    return (
      <div role="status" className="space-y-5">
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-lg text-emerald-900">{PASSWORD_RESET_SENT}</p>
        <p className="text-base text-stone-600">Le lien est valable une heure. Vous pouvez l&apos;ouvrir sur votre téléphone ou votre ordinateur.</p>
        <BackToLogin />
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <Suspense fallback={null}>
        <ExpiredLinkNotice />
      </Suspense>
      <TextField label="Adresse e-mail" name="email" type="email" autoComplete="email" required defaultValue={state.email} />
      <FormError message={state.error} />
      <SubmitButton label="Recevoir le lien" pendingLabel="Envoi…" />
      <BackToLogin />
    </form>
  );
}

function BackToLogin() {
  return (
    <p className="text-center text-base">
      <Link href="/connexion" className="font-semibold text-orange-700 underline">
        Retour à la connexion
      </Link>
    </p>
  );
}

// Arriving from an expired or already used link.
function ExpiredLinkNotice() {
  if (useSearchParams().get("expire") !== "1") return null;
  return (
    <p role="alert" className="rounded-2xl bg-amber-50 px-4 py-3 text-base text-amber-900">
      Ce lien a expiré ou a déjà servi. Demandez-en un nouveau ci-dessous.
    </p>
  );
}
