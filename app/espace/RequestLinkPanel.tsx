"use client";

import { useState, useTransition, type FormEvent } from "react";
import { LinkIcon } from "@/components/landing/icons";
import { FormError, TextField } from "@/components/ui/form";
import { SHARE_BUTTON_CLASSES, ShareLinkButtons } from "@/components/ui/ShareLinkButtons";
import { createRequestLink, type CreatedLink } from "./liens/actions";

export function RequestLinkPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [link, setLink] = useState<CreatedLink>();
  const [error, setError] = useState<string>();
  const [isCreating, startCreating] = useTransition();

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

  function reset() {
    setLink(undefined);
    setError(undefined);
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-start gap-4 rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-stone-200 transition hover:ring-stone-300"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-stone-900 text-white">
          <LinkIcon />
        </span>
        <span className="min-w-0">
          <span className="block text-lg font-bold text-stone-900">Demander des infos à un client</span>
          <span className="mt-1 block text-sm text-stone-600">
            Envoyez-lui un lien : il décrit son besoin et ajoute ses photos.
          </span>
        </span>
      </button>
    );
  }

  return (
    <section className="space-y-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:col-span-2 sm:p-6">
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
          <ShareLinkButtons link={link} />
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
