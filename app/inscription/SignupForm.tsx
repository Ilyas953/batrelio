"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormError, SelectField, SubmitButton, TextField } from "@/components/ui/form";
import { TRADE_LABELS } from "@/lib/company/details";
import { signUp, type SignUpState } from "./actions";

const INITIAL_STATE: SignUpState = {};
const TRADE_OPTIONS = Object.entries(TRADE_LABELS).map(([value, label]) => ({ value, label }));

export function SignupForm() {
  const [state, formAction] = useActionState(signUp, INITIAL_STATE);

  if (state.checkEmail) {
    return (
      <div role="status" className="space-y-3">
        <p className="text-2xl font-bold text-stone-900">Vérifiez votre boîte mail</p>
        <p className="text-lg leading-relaxed text-stone-600">
          Nous avons envoyé un lien à <strong className="text-stone-900">{state.values?.email}</strong>.
          Cliquez dessus pour ouvrir votre compte.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <TextField
        label="Nom de votre entreprise"
        name="companyName"
        required
        autoComplete="organization"
        defaultValue={state.values?.companyName}
        placeholder="Dupont Toiture"
      />
      <SelectField
        label="Votre métier"
        name="trade"
        options={TRADE_OPTIONS}
        placeholder="Choisir un métier"
        defaultValue={state.values?.trade}
      />
      <TextField
        label="Adresse e-mail"
        name="email"
        type="email"
        required
        autoComplete="email"
        defaultValue={state.values?.email}
      />
      <TextField
        label="Mot de passe"
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        hint="8 caractères minimum."
      />
      <label className="flex cursor-pointer items-start gap-3 text-base leading-snug text-stone-700">
        <input type="checkbox" name="acceptTerms" required className="mt-0.5 size-5 shrink-0 accent-orange-600" />
        <span>
          J&apos;accepte les{" "}
          <Link href="/cgv" target="_blank" className="font-semibold text-orange-700 underline">
            conditions générales
          </Link>{" "}
          et j&apos;ai lu la{" "}
          <Link href="/confidentialite" target="_blank" className="font-semibold text-orange-700 underline">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>
      <FormError message={state.error} />
      <SubmitButton label="Créer mon compte" pendingLabel="Création du compte…" />
      <p className="text-center text-base text-stone-600">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-semibold text-orange-700 underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
