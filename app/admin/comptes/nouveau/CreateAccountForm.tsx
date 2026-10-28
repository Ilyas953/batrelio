"use client";

import { useActionState, useState } from "react";
import { FormError, SubmitButton, TextField } from "@/components/ui/form";
import { createAccount, type CreateAccountState } from "../actions";
import { CompanyFields } from "../CompanyFields";

const INITIAL_STATE: CreateAccountState = {};
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const GENERATED_PASSWORD_LENGTH = 12;

function generatePassword(): string {
  const randomValues = crypto.getRandomValues(new Uint32Array(GENERATED_PASSWORD_LENGTH));
  return Array.from(randomValues, (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]).join("");
}

export function CreateAccountForm() {
  const [state, formAction] = useActionState(createAccount, INITIAL_STATE);
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="space-y-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <TextField
        label="Adresse e-mail de l'artisan"
        name="email"
        type="email"
        required
        autoComplete="off"
        defaultValue={state.values?.email}
      />

      <div>
        <TextField
          label="Mot de passe temporaire"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint="Transmettez-le à l'artisan. Il pourra le changer ensuite."
        />
        <button
          type="button"
          onClick={() => setPassword(generatePassword())}
          className="mt-3 min-h-11 rounded-xl border-2 border-stone-200 px-4 text-base font-semibold text-stone-800 hover:border-stone-900"
        >
          Générer un mot de passe
        </button>
      </div>

      <CompanyFields defaults={state.values} />

      <FormError message={state.error} />
      <SubmitButton label="Créer le compte" pendingLabel="Création…" />
    </form>
  );
}
