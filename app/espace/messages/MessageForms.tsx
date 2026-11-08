"use client";

import { useActionState, useState } from "react";
import { FormError } from "@/components/ui/form";
import { quoteShareText } from "@/lib/quotes/share-message";
import { GREETING_NEXT_STEPS, MAX_GREETING_INTRO_LENGTH, defaultGreetingIntro } from "@/lib/telephony/messages";
import { GREETING_VOICES, type GreetingVoiceId } from "@/lib/telephony/voices";
import { MAX_QUOTE_MESSAGE_LENGTH } from "@/lib/quotes/share-message";
import { PlayIcon } from "@/components/landing/icons";
import { previewGreeting, saveGreeting, saveQuoteMessage, type MessageFormState } from "./actions";
import { useGreetingPlayer } from "./useGreetingPlayer";

const PRIMARY_BUTTON =
  "flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-600 px-6 text-lg font-semibold text-white hover:bg-orange-700 disabled:opacity-60";
const SECONDARY_BUTTON =
  "flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-stone-200 px-6 text-lg font-semibold text-stone-900 hover:border-stone-900 disabled:opacity-60";
const TEXTAREA =
  "block w-full rounded-2xl border-2 border-stone-200 bg-white px-4 py-3 text-lg text-stone-900 outline-none focus:border-orange-500";
const RESET_LINK = "text-base font-semibold text-stone-500 underline hover:text-stone-900";

function Saved({ show }: { show?: boolean }) {
  return show ? <p className="text-base font-semibold text-emerald-700">Enregistré ✓</p> : null;
}

const VOICE_GROUPS = [
  { kind: "ai", title: "Voix IA, les plus naturelles" },
  { kind: "standard", title: "Voix classiques" },
] as const;

type GreetingFormProps = {
  companyName: string;
  initialVoice: GreetingVoiceId;
  initialIntro: string;
  defaultPhone: string;
  canPreview: boolean;
};

export function GreetingForm({ companyName, initialVoice, initialIntro, defaultPhone, canPreview }: GreetingFormProps) {
  const [saveState, saveAction, isSaving] = useActionState<MessageFormState, FormData>(saveGreeting, {});
  const [previewState, previewAction, isCalling] = useActionState<MessageFormState, FormData>(previewGreeting, {});
  const [voice, setVoice] = useState<GreetingVoiceId>(initialVoice);
  const [intro, setIntro] = useState(initialIntro);
  const opening = intro.trim() || defaultGreetingIntro(companyName);
  const player = useGreetingPlayer();
  const listenLabel = (voiceId: string, idle: string) =>
    ({ loading: "Chargement…", playing: "Arrêter", idle })[player.stateOf(voiceId, intro)];

  return (
    <form action={saveAction} className="space-y-5">
      <fieldset>
        <legend className="mb-1 text-base font-semibold text-stone-800">La voix</legend>
        <p className="mb-3 text-sm text-stone-600">Touchez « Écouter » : vous entendez votre message, exactement comme vos clients.</p>
        {VOICE_GROUPS.map((group) => (
          <div key={group.kind} className="mb-4">
            <p className="mb-2 text-sm font-semibold text-stone-500">{group.title}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {GREETING_VOICES.filter((option) => option.kind === group.kind).map((option) => (
                <div
                  key={option.id}
                  className={`flex items-center gap-2 rounded-2xl border-2 py-2 pl-4 pr-2 ${
                    voice === option.id ? "border-orange-500 bg-orange-50" : "border-stone-200 bg-white"
                  }`}
                >
                  <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="voice"
                      value={option.id}
                      checked={voice === option.id}
                      onChange={() => setVoice(option.id)}
                      className="size-5 accent-orange-600"
                    />
                    <span>
                      <span className="block text-base font-bold text-stone-900">{option.label}</span>
                      <span className="block text-sm text-stone-600">{option.description}</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => player.play(option.id, intro)}
                    aria-label={`Écouter la voix ${option.label}`}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 text-sm font-semibold text-stone-800 ring-1 ring-stone-300 hover:ring-stone-900"
                  >
                    <PlayIcon className="size-4" />
                    {listenLabel(option.id, "Écouter")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </fieldset>

      <div>
        <label htmlFor="intro" className="mb-2 block text-base font-semibold text-stone-800">
          Le début de votre message
        </label>
        <textarea
          id="intro"
          name="intro"
          rows={3}
          maxLength={MAX_GREETING_INTRO_LENGTH}
          value={intro}
          onChange={(event) => setIntro(event.target.value)}
          className={TEXTAREA}
        />
        <button type="button" onClick={() => setIntro(defaultGreetingIntro(companyName))} className={`mt-2 ${RESET_LINK}`}>
          Revenir au message par défaut
        </button>
      </div>

      <div className="rounded-2xl bg-stone-100 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Votre client entendra</p>
        <p className="mt-1 text-base italic text-stone-800">
          « {opening} <span className="text-stone-500">{GREETING_NEXT_STEPS.withSms}</span> »
        </p>
        <p className="mt-2 text-sm text-stone-500">
          La fin, en gris, est ajoutée par Batrelio : elle change si le client appelle d&apos;un fixe ou en numéro masqué.
        </p>
        <button
          type="button"
          onClick={() => player.play(voice, intro)}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 text-base font-semibold text-white hover:bg-stone-700"
        >
          <PlayIcon className="size-5" />
          {listenLabel(voice, "Écouter mon message")}
        </button>
      </div>
      <FormError message={player.error} />

      <FormError message={saveState.error} />
      <Saved show={saveState.saved && !isSaving} />
      <button type="submit" disabled={isSaving} className={PRIMARY_BUTTON}>
        {isSaving ? "Enregistrement…" : "Enregistrer"}
      </button>

      <div className="space-y-3 border-t border-stone-200 pt-5">
        <p className="text-base font-semibold text-stone-800">Écouter au téléphone</p>
        {canPreview ? (
          <>
            <p className="text-sm text-stone-600">
              Votre numéro Batrelio vous appelle et lit ce message avec la voix choisie, comme vos clients l&apos;entendront.
            </p>
            <input
              name="phone"
              type="text"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={defaultPhone}
              placeholder="06 12 34 56 78"
              aria-label="Numéro à appeler"
              className="block min-h-14 w-full rounded-2xl border-2 border-stone-200 bg-white px-4 text-lg text-stone-900 outline-none focus:border-orange-500"
            />
            <FormError message={previewState.error} />
            {previewState.called && !isCalling && (
              <p className="text-base font-semibold text-emerald-700">Ça sonne : décrochez pour écouter.</p>
            )}
            <button type="submit" formAction={previewAction} disabled={isCalling} className={SECONDARY_BUTTON}>
              {isCalling ? "Appel en cours…" : "M'appeler pour écouter"}
            </button>
          </>
        ) : (
          <p className="text-sm text-stone-600">
            Disponible dès que votre numéro Batrelio est activé : c&apos;est lui qui vous appelle.
          </p>
        )}
      </div>
    </form>
  );
}

type QuoteMessageFormProps = { companyName: string; initialMessage: string; defaultMessage: string };

export function QuoteMessageForm({ companyName, initialMessage, defaultMessage }: QuoteMessageFormProps) {
  const [state, action, isSaving] = useActionState<MessageFormState, FormData>(saveQuoteMessage, {});
  const [message, setMessage] = useState(initialMessage);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="quote-message" className="mb-2 block text-base font-semibold text-stone-800">
          Votre message
        </label>
        <textarea
          id="quote-message"
          name="message"
          rows={3}
          maxLength={MAX_QUOTE_MESSAGE_LENGTH}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className={TEXTAREA}
        />
        <button type="button" onClick={() => setMessage(defaultMessage)} className={`mt-2 ${RESET_LINK}`}>
          Revenir au message par défaut
        </button>
      </div>

      <div className="rounded-2xl bg-stone-100 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Votre client recevra</p>
        <p className="mt-2 rounded-2xl rounded-tl-sm bg-white p-4 text-base text-stone-900 shadow-sm">
          {quoteShareText({ name: companyName, quote_message: message }, "https://batrelio.com/devis/…")}
        </p>
        <p className="mt-2 text-sm text-stone-500">Le lien du devis est ajouté à la fin automatiquement.</p>
      </div>

      <FormError message={state.error} />
      <Saved show={state.saved && !isSaving} />
      <button type="submit" disabled={isSaving} className={PRIMARY_BUTTON}>
        {isSaving ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
