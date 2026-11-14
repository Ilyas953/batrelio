"use client";

import { useState, useTransition, type FormEvent } from "react";
import { FormError, TextField } from "@/components/ui/form";
import { ACCEPTANCE_MENTION, MAX_SIGNER_NAME_LENGTH } from "@/lib/quotes/acceptance";
import { acceptQuote } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

// The customer accepts on their phone: their name and a ticked "bon pour accord", no printing.
export function AcceptQuoteForm({ token, companyName, defaultName }: { token: string; companyName: string; defaultName: string }) {
  const [error, setError] = useState<string>();
  const [accepted, setAccepted] = useState<{ name: string; signedAt: string }>();
  const [isSending, startSending] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(undefined);
    startSending(async () => {
      const result = await acceptQuote(token, formData);
      if ("error" in result) setError(result.error);
      else setAccepted(result.accepted);
    });
  }

  if (accepted) {
    return (
      <div role="status" className="space-y-2 rounded-2xl bg-emerald-50 p-5 text-emerald-950 ring-1 ring-emerald-200">
        <p className="text-xl font-extrabold">Merci, le devis est accepté ✓</p>
        <p className="text-base">
          Accepté par {accepted.name} le {dateFormatter.format(new Date(accepted.signedAt))}. {companyName} est prévenu et
          revient vers vous pour la suite.
        </p>
      </div>
    );
  }

  return (
    // POST: if sent before the page is interactive, the name never ends up in the URL.
    <form method="post" onSubmit={handleSubmit} className="space-y-4">
      <TextField
        label="Votre nom et prénom"
        name="name"
        required
        autoComplete="name"
        maxLength={MAX_SIGNER_NAME_LENGTH}
        defaultValue={defaultName}
      />
      <label className="flex cursor-pointer items-start gap-3 text-base leading-snug text-stone-800">
        <input type="checkbox" name="agreed" required className="mt-0.5 size-6 shrink-0 accent-orange-600" />
        <span>{ACCEPTANCE_MENTION}</span>
      </label>
      <FormError message={error} />
      <button
        type="submit"
        disabled={isSending}
        className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-600 px-7 text-lg font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {isSending ? "Envoi…" : "J'accepte le devis"}
      </button>
      <p className="text-sm text-stone-500">
        Votre nom, la date, l&apos;heure et l&apos;adresse de votre connexion sont enregistrés comme preuve de votre
        accord. Le devis reste consultable à ce lien.
      </p>
    </form>
  );
}
