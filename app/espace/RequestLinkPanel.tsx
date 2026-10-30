"use client";

import { useState, useSyncExternalStore, useTransition, type FormEvent } from "react";
import { FormError, TextField } from "@/components/ui/form";
import { createRequestLink, type CreatedLink } from "./liens/actions";

const subscribeToNothing = () => () => {};

// The native share sheet exists on phones only, and never during server rendering.
function useCanShare(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => typeof navigator.share === "function",
    () => false,
  );
}

// sms:+33…?&body= works on both iOS and Android.
function toSmsHref(link: CreatedLink): string {
  return `sms:${link.customerPhone ?? ""}?&body=${encodeURIComponent(link.shareText)}`;
}

function toWhatsAppHref(link: CreatedLink): string {
  const recipient = link.customerPhone?.replace("+", "") ?? "";
  return `https://wa.me/${recipient}?text=${encodeURIComponent(link.shareText)}`;
}

const SHARE_BUTTON_CLASSES =
  "flex min-h-14 w-full items-center justify-center rounded-2xl px-5 text-lg font-semibold";

export function RequestLinkPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [link, setLink] = useState<CreatedLink>();
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [isCreating, startCreating] = useTransition();
  const canShare = useCanShare();

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(undefined);
    startCreating(async () => {
      const result = await createRequestLink(formData);
      if ("error" in result) setError(result.error);
      else setLink(result.link);
    });
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  function reset() {
    setLink(undefined);
    setCopied(false);
    setError(undefined);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${SHARE_BUTTON_CLASSES} bg-stone-900 text-white hover:bg-stone-700`}
      >
        Demander des infos à un client
      </button>
    );
  }

  return (
    <section className="space-y-5 rounded-3xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Lien de demande</h2>
          <p className="mt-1 text-base text-stone-600">
            Le client décrit son besoin et ajoute ses photos. Sa demande arrive dans « À traiter ».
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            setIsOpen(false);
          }}
          aria-label="Fermer"
          className="grid size-11 shrink-0 place-items-center rounded-full text-2xl text-stone-500 hover:bg-stone-100"
        >
          ×
        </button>
      </div>

      {link ? (
        <div className="space-y-3">
          <p className="break-all rounded-2xl bg-stone-100 px-4 py-3 font-mono text-sm text-stone-800">{link.url}</p>
          {canShare && (
            <button
              type="button"
              onClick={() => navigator.share({ text: link.shareText }).catch(() => {})}
              className={`${SHARE_BUTTON_CLASSES} bg-orange-600 text-white hover:bg-orange-700`}
            >
              Partager le lien
            </button>
          )}
          <a href={toSmsHref(link)} className={`${SHARE_BUTTON_CLASSES} border-2 border-stone-200 text-stone-900 hover:border-stone-900`}>
            Envoyer par SMS
          </a>
          <a
            href={toWhatsAppHref(link)}
            target="_blank"
            rel="noopener noreferrer"
            className={`${SHARE_BUTTON_CLASSES} border-2 border-stone-200 text-stone-900 hover:border-stone-900`}
          >
            Envoyer par WhatsApp
          </a>
          <button
            type="button"
            onClick={() => handleCopy(link.url)}
            className={`${SHARE_BUTTON_CLASSES} border-2 border-stone-200 text-stone-900 hover:border-stone-900`}
          >
            {copied ? "Lien copié ✓" : "Copier le lien"}
          </button>
          <p className="text-sm text-stone-500">Valable 30 jours, pour une seule demande.</p>
          <button type="button" onClick={reset} className="text-base font-semibold text-orange-700 underline">
            Créer un autre lien
          </button>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="space-y-4">
          <TextField label="Nom du client (facultatif)" name="customerName" autoComplete="off" />
          <TextField
            label="Son téléphone (facultatif)"
            name="customerPhone"
            type="text"
            inputMode="tel"
            autoComplete="off"
            placeholder="06 12 34 56 78"
            hint="Pour lui envoyer le lien par SMS ou WhatsApp en un geste."
          />
          <FormError message={error} />
          <button
            type="submit"
            disabled={isCreating}
            className={`${SHARE_BUTTON_CLASSES} bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60`}
          >
            {isCreating ? "Création…" : "Créer le lien"}
          </button>
        </form>
      )}
    </section>
  );
}
