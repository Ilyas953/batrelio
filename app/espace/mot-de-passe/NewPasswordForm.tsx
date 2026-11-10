"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormError, SubmitButton } from "@/components/ui/form";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth/password";
import { updatePassword, type NewPasswordState } from "@/lib/auth/password-actions";

const INITIAL_STATE: NewPasswordState = {};

export function NewPasswordForm() {
  const [state, formAction] = useActionState(updatePassword, INITIAL_STATE);
  const [visible, setVisible] = useState(false);

  if (state.saved) {
    return (
      <div role="status" className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <p className="text-2xl font-extrabold text-stone-900">Mot de passe changé ✓</p>
        <p className="text-base text-stone-600">Utilisez-le la prochaine fois que vous vous connectez.</p>
        <Link
          href="/espace"
          className="flex min-h-14 items-center justify-center rounded-2xl bg-orange-600 px-5 text-lg font-semibold text-white hover:bg-orange-700"
        >
          Voir mes demandes
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
      <div>
        <label htmlFor="password" className="mb-2 block text-base font-semibold text-stone-800">
          Nouveau mot de passe
        </label>
        <div className="flex gap-2">
          <input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={MAX_PASSWORD_LENGTH}
            className="block min-h-14 w-full rounded-2xl border-2 border-stone-200 bg-white px-4 text-lg text-stone-900 outline-none focus:border-orange-500"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="min-h-14 shrink-0 rounded-2xl px-4 text-base font-semibold text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
          >
            {visible ? "Masquer" : "Afficher"}
          </button>
        </div>
        <p className="mt-2 text-sm text-stone-500">{MIN_PASSWORD_LENGTH} caractères minimum.</p>
      </div>
      <FormError message={state.error} />
      <SubmitButton label="Enregistrer le mot de passe" pendingLabel="Enregistrement…" />
    </form>
  );
}
