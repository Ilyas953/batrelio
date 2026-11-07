"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { CalendarIcon, ForwardIcon } from "@/components/landing/icons";
import { FormError, TextField } from "@/components/ui/form";
import { ShareMessageButtons, type ShareableMessage } from "@/components/ui/ShareLinkButtons";
import { RewardBadge } from "@/components/espace/RewardBadge";
import { MAX_ARTISAN_NOTE_LENGTH, SHARE_REWARD_PROMISE } from "@/lib/missions/shared-mission";
import { proposeVisit, shareMission } from "./actions";

const SECONDARY_BUTTON =
  "flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-5 text-lg font-semibold text-stone-900 hover:border-stone-900";
const CARD = "space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6";

export type ExistingVisit = { label: string; date: string; time: string; message: ShareableMessage };

type VisitPanelProps = { requestId: string; existing: ExistingVisit | null; minDate: string };

// Closed -> pick a day and a time -> message ready to send from the artisan's phone.
export function VisitPanel({ requestId, existing, minDate }: VisitPanelProps) {
  const router = useRouter();
  const [step, setStep] = useState<"closed" | "form" | "message">("closed");
  const [message, setMessage] = useState<ShareableMessage | null>(existing?.message ?? null);
  const [error, setError] = useState<string>();
  const [isSaving, startSaving] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(undefined);
    startSaving(async () => {
      const result = await proposeVisit(requestId, formData);
      if ("error" in result) return setError(result.error);
      setMessage(result.proposal);
      setStep("message");
      router.refresh();
    });
  }

  if (step === "form") {
    return (
      <form onSubmit={handleSubmit} className={CARD}>
        <PanelTitle>Proposer une visite</PanelTitle>
        <TextField label="Quel jour ?" name="date" type="date" min={minDate} defaultValue={existing?.date} required />
        <TextField label="À quelle heure ?" name="time" type="time" step={900} defaultValue={existing?.time ?? "09:00"} required />
        <FormError message={error} />
        <button
          type="submit"
          disabled={isSaving}
          className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-600 px-5 text-lg font-semibold text-white hover:bg-orange-700 disabled:opacity-70"
        >
          {isSaving ? "Préparation…" : "Préparer le message"}
        </button>
        <CancelButton onClick={() => setStep("closed")} />
      </form>
    );
  }

  if (step === "message" && message) {
    return (
      <section className={CARD}>
        <PanelTitle>Envoyez la proposition à votre client</PanelTitle>
        <p className="text-base text-stone-600">Il vous répondra directement. Vous pouvez modifier le texte avant de l&apos;envoyer.</p>
        <ShareMessageButtons message={message} />
        <CancelButton label="Fermer" onClick={() => setStep("closed")} />
      </section>
    );
  }

  if (existing) {
    return (
      <section className="space-y-3 rounded-3xl bg-emerald-50 p-5 ring-1 ring-emerald-200 sm:p-6">
        <p className="flex items-center gap-2 text-lg font-bold text-emerald-950">
          <CalendarIcon className="size-5 shrink-0" />
          Visite proposée le {existing.label}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => { setMessage(existing.message); setStep("message"); }} className={SECONDARY_BUTTON}>
            Renvoyer le message
          </button>
          <button type="button" onClick={() => setStep("form")} className={SECONDARY_BUTTON}>
            Changer la date
          </button>
        </div>
      </section>
    );
  }

  return (
    <button type="button" onClick={() => setStep("form")} className={SECONDARY_BUTTON}>
      <CalendarIcon className="size-5 text-emerald-700" />
      Proposer une visite
    </button>
  );
}

// For a job the artisan cannot take: Batrelio receives it and looks for another artisan.
export function ShareMissionPanel({ requestId, initiallyOpen = false }: { requestId: string; initiallyOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [error, setError] = useState<string>();
  const [isSharing, startSharing] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Coming from "Partager" in the list: the form is below the request, bring it into view.
  useEffect(() => {
    if (initiallyOpen) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [initiallyOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(undefined);
    // On success the server reloads the page, which then shows the shared mission.
    startSharing(async () => setError((await shareMission(requestId, formData)).error));
  }

  if (!isOpen) {
    return (
      <button
        id="partager"
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full scroll-mt-24 items-center gap-4 rounded-3xl bg-violet-50 p-4 text-left ring-2 ring-violet-200 hover:bg-violet-100 sm:p-5"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-600 text-white">
          <ForwardIcon />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 text-lg font-bold text-violet-950">
            Partager la mission
            <RewardBadge />
          </span>
          <span className="mt-0.5 block text-sm text-violet-900">Vous ne pouvez pas la prendre ? Gagnez de l&apos;argent quand même.</span>
        </span>
      </button>
    );
  }

  return (
    <form ref={formRef} id="partager" onSubmit={handleSubmit} className={`${CARD} scroll-mt-24 ring-2 ring-violet-200`}>
      <PanelTitle>Partager la mission</PanelTitle>
      <p className="text-base text-stone-600">
        Pas le temps, ou pas votre métier ? Batrelio reçoit cette demande et cherche un autre artisan pour votre client.
        Vous n&apos;avez rien d&apos;autre à faire.
      </p>
      <p className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-base font-semibold text-emerald-900">
        <RewardBadge size="md" />
        {SHARE_REWARD_PROMISE}
      </p>
      <div>
        <label htmlFor="note" className="mb-2 block text-base font-semibold text-stone-800">
          Un mot pour Batrelio <span className="font-normal text-stone-500">(facultatif)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={MAX_ARTISAN_NOTE_LENGTH}
          placeholder="Ex. : pas mon métier, client pressé…"
          className="block w-full rounded-2xl border-2 border-stone-200 bg-white px-4 py-3 text-lg text-stone-900 outline-none placeholder:text-stone-400 focus:border-orange-500"
        />
      </div>
      <p className="text-sm text-stone-500">Une fois partagée, la demande ne peut plus être modifiée ici.</p>
      <FormError message={error} />
      <button
        type="submit"
        disabled={isSharing}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-lg font-semibold text-white hover:bg-violet-700 disabled:opacity-70"
      >
        <ForwardIcon className="size-5" />
        {isSharing ? "Partage…" : "Partager la mission"}
      </button>
      <CancelButton onClick={() => setIsOpen(false)} />
    </form>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-stone-900">{children}</h2>;
}

function CancelButton({ onClick, label = "Annuler" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="block w-full text-center text-base font-semibold text-stone-500 underline">
      {label}
    </button>
  );
}
