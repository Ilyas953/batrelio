"use client";

import { useState, useTransition } from "react";
import { FormError, TextField } from "@/components/ui/form";
import { activateAutoReply, addExclusion, excludeCaller, removeExclusion, setAutoReplyEnabled } from "./actions";

const PRIMARY_BUTTON =
  "flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-600 px-6 text-lg font-semibold text-white hover:bg-orange-700 disabled:opacity-60";
const SECONDARY_BUTTON =
  "flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-stone-200 px-6 text-lg font-semibold text-stone-900 hover:border-stone-900 disabled:opacity-60";

function useServerAction() {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  // Server actions redirect on success, so a returned value is always an error.
  function run(action: () => Promise<{ error: string }>) {
    setError(undefined);
    startTransition(async () => setError((await action()).error));
  }
  return { error, isPending, run };
}

export function ActivateButton() {
  const { error, isPending, run } = useServerAction();

  return (
    <div className="space-y-3">
      <button type="button" disabled={isPending} onClick={() => run(activateAutoReply)} className={PRIMARY_BUTTON}>
        {isPending ? "Attribution de votre numéro…" : "Activer la réponse automatique"}
      </button>
      <FormError message={error} />
    </div>
  );
}

export function PauseToggle({ enabled }: { enabled: boolean }) {
  const { error, isPending, run } = useServerAction();

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => setAutoReplyEnabled(!enabled))}
        className={enabled ? SECONDARY_BUTTON : PRIMARY_BUTTON}
      >
        {isPending ? "Enregistrement…" : enabled ? "Mettre en pause" : "Réactiver la réponse automatique"}
      </button>
      <FormError message={error} />
    </div>
  );
}

// MMI codes: iPhones refuse to dial them from a link, so the code is shown to type or copy.
export function ForwardingCode({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-2xl border-2 border-stone-200 p-4">
      <p className="text-sm font-semibold text-stone-500">{label}</p>
      <p className="mt-1 select-all font-mono text-2xl font-bold tracking-wide text-stone-900">{code}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
          }}
          className="min-h-11 rounded-xl border-2 border-stone-200 px-4 text-base font-semibold text-stone-800 hover:border-stone-900"
        >
          {copied ? "Copié ✓" : "Copier"}
        </button>
        <a
          href={`tel:${code.replaceAll("#", "%23")}`}
          className="inline-flex min-h-11 items-center rounded-xl border-2 border-stone-200 px-4 text-base font-semibold text-stone-800 hover:border-stone-900"
        >
          Composer (Android)
        </a>
      </div>
    </div>
  );
}

export function ExclusionForm() {
  const { error, isPending, run } = useServerAction();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    run(() => addExclusion(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField
        label="Numéro à exclure"
        name="phone"
        type="text"
        inputMode="tel"
        autoComplete="off"
        required
        placeholder="06 12 34 56 78"
      />
      <TextField label="Qui est-ce ? (facultatif)" name="label" maxLength={60} placeholder="Fournisseur bois" />
      <FormError message={error} />
      <button type="submit" disabled={isPending} className={SECONDARY_BUTTON}>
        {isPending ? "Ajout…" : "Ajouter ce numéro"}
      </button>
    </form>
  );
}

const SMALL_BUTTON =
  "min-h-11 shrink-0 rounded-xl border-2 border-stone-200 px-3 text-sm font-semibold text-stone-800 hover:border-stone-900 disabled:opacity-60";

export function RemoveExclusionButton({ exclusionId }: { exclusionId: string }) {
  const { error, isPending, run } = useServerAction();

  return (
    <>
      <button type="button" disabled={isPending} onClick={() => run(() => removeExclusion(exclusionId))} className={SMALL_BUTTON}>
        {isPending ? "…" : "Retirer"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </>
  );
}

export function ExcludeCallerButton({ phone }: { phone: string }) {
  const { error, isPending, run } = useServerAction();

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => run(() => excludeCaller(phone))}
        className={SMALL_BUTTON}
        title="Ne plus envoyer de SMS à ce numéro"
      >
        {isPending ? "…" : "Exclure"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </>
  );
}
