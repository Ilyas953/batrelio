"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { FormError, TextField } from "@/components/ui/form";
import type { SmsStatus } from "@/lib/telephony/sms-status";
import { restartTestAccount, simulateCall, type SimulateCallState } from "./actions";

const PRIMARY_BUTTON =
  "flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-600 px-6 text-lg font-semibold text-white hover:bg-orange-700 disabled:opacity-60";
const SECONDARY_BUTTON =
  "flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-stone-200 px-6 text-lg font-semibold text-stone-900 hover:border-stone-900 disabled:opacity-60";

// Why no SMS left, in the artisan's words.
const NO_SMS_REASONS: Record<Exclude<SmsStatus, "sent" | "delivered" | "pending">, string> = {
  skipped_anonymous: "Numéro masqué : impossible de lui envoyer un SMS. L'appel est noté dans l'historique.",
  skipped_not_mobile:
    "C'est une ligne fixe : elle ne reçoit pas de SMS. La demande apparaît quand même dans « À traiter » pour que vous rappeliez.",
  skipped_disabled:
    "La réponse automatique est en pause : pas de SMS. La demande apparaît quand même dans « À traiter ».",
  skipped_own_number: "C'est votre propre numéro : rien n'est envoyé.",
  skipped_excluded: "Ce numéro est dans vos exclusions : rien n'est envoyé.",
  skipped_recent: "Cette personne a déjà reçu un SMS dans les dernières 24 heures : pas de deuxième SMS.",
  failed: "Le SMS n'a pas pu partir.",
};

export function SimulateCallForm({ defaultCaller }: { defaultCaller: string }) {
  const [state, formAction, isPending] = useActionState<SimulateCallState, FormData>(simulateCall, {});
  const [hidden, setHidden] = useState(false);

  return (
    <div className="space-y-5">
      <form action={formAction} className="space-y-4">
        <TextField
          key={state.callerInput ?? defaultCaller}
          label="Numéro de la personne qui appelle"
          name="caller"
          inputMode="tel"
          autoComplete="off"
          defaultValue={state.callerInput ?? defaultCaller}
          disabled={hidden}
          hint="Un numéro fictif est proposé. Essayez aussi un fixe (01…), un numéro exclu ou le même numéro deux fois."
        />
        <label className="flex min-h-12 items-center gap-3 text-base font-semibold text-stone-800">
          <input
            type="checkbox"
            name="hidden"
            checked={hidden}
            onChange={(event) => setHidden(event.target.checked)}
            className="size-6 accent-orange-600"
          />
          Numéro masqué
        </label>
        <FormError message={state.error} />
        <button type="submit" disabled={isPending} className={PRIMARY_BUTTON}>
          {isPending ? "Appel en cours…" : "Simuler un appel manqué"}
        </button>
      </form>

      {state.call && !isPending && <CallResult call={state.call} />}
    </div>
  );
}

function CallResult({ call }: { call: NonNullable<SimulateCallState["call"]> }) {
  const { greeting, outcome } = call;

  return (
    <section className="space-y-4 rounded-3xl bg-stone-100 p-5" aria-live="polite">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Ce que la personne entend</p>
        <p className="mt-1 text-base italic text-stone-800">« {greeting} »</p>
      </div>

      {outcome.sms ? (
        <>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Le SMS qu&apos;elle reçoit, de <span className="font-mono normal-case">{outcome.sms.from}</span>
            </p>
            <p className="mt-2 rounded-2xl rounded-tl-sm bg-white p-4 text-base text-stone-900 shadow-sm">
              {outcome.sms.body}
            </p>
          </div>
          <a href={outcome.sms.requestUrl} target="_blank" rel="noreferrer" className={PRIMARY_BUTTON}>
            Ouvrir le lien comme le client
          </a>
          <p className="text-sm text-stone-600">
            Remplissez le formulaire comme le ferait votre client : sa demande arrive dans « À traiter » et vous pouvez
            faire le devis.
          </p>
        </>
      ) : (
        <p className="rounded-2xl bg-white p-4 text-base text-stone-800">
          {NO_SMS_REASONS[outcome.status as keyof typeof NO_SMS_REASONS] ?? "Pas de SMS."}
        </p>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-base font-semibold">
        <Link href="/espace" className="text-orange-700 underline">
          Voir « À traiter »
        </Link>
        <Link href="/espace/reponse-automatique" className="text-orange-700 underline">
          Historique des appels
        </Link>
        <Link href="/espace/demarrage" className="text-orange-700 underline">
          Guide de mise en place
        </Link>
      </div>
    </section>
  );
}

export function RestartButton() {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function restart() {
    if (!window.confirm("Ce compte de test et toutes ses données seront supprimés. Continuer ?")) return;
    setError(undefined);
    startTransition(async () => setError((await restartTestAccount()).error));
  }

  return (
    <div className="space-y-3">
      <button type="button" disabled={isPending} onClick={restart} className={SECONDARY_BUTTON}>
        {isPending ? "Remise à zéro…" : "Recommencer à zéro"}
      </button>
      <FormError message={error} />
    </div>
  );
}
