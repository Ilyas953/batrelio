"use client";

import { useEffect, useRef, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { FormError, TextField } from "@/components/ui/form";
import { formatPhone } from "@/lib/format";
import { compressPhoto } from "@/lib/requests/compress-photo";
import { MAX_DESCRIPTION_LENGTH, MAX_PHOTOS } from "@/lib/requests/limits";
import { submitCustomerRequest, type SubmitRequestResult } from "./actions";

type RequestFormProps = {
  token: string;
  companyName: string;
  defaultName: string;
  defaultPhone: string;
  privacyNotice: string;
};

type SelectedPhoto = { id: string; file: File; previewUrl: string };

export function RequestForm({ token, companyName, defaultName, defaultPhone, privacyNotice }: RequestFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<Extract<SubmitRequestResult, { ok: true }>>();
  const [isPreparingPhotos, startPreparingPhotos] = useTransition();
  const [isSending, startSending] = useTransition();

  // Frees the preview images when they are removed or the form is left.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl)), []);

  function handlePhotoChoice(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []).slice(0, MAX_PHOTOS - photos.length);
    event.target.value = "";
    setError(undefined);

    startPreparingPhotos(async () => {
      try {
        const compressed = await Promise.all(chosen.map(compressPhoto));
        const added = compressed.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        }));
        setPhotos((current) => [...current, ...added].slice(0, MAX_PHOTOS));
      } catch (compressionError) {
        setError(compressionError instanceof Error ? compressionError.message : "Une photo n'a pas pu être ajoutée.");
      }
    });
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.delete("photos");
    photos.forEach((photo) => formData.append("photos", photo.file));
    setError(undefined);

    startSending(async () => {
      const response = await submitCustomerRequest(token, formData);
      if ("error" in response) setError(response.error);
      else setResult(response);
    });
  }

  if (result) {
    return (
      <div role="status" className="rounded-3xl bg-white p-7 shadow-sm">
        <p className="text-2xl font-extrabold text-stone-900">C&apos;est envoyé, merci !</p>
        <p className="mt-3 text-lg text-stone-600">
          {companyName} a bien reçu votre demande
          {result.savedPhotos > 0 ? ` et vos ${result.savedPhotos} photo${result.savedPhotos > 1 ? "s" : ""}` : ""}. Vous
          serez recontacté rapidement.
        </p>
        {result.failedPhotos > 0 && (
          <p className="mt-3 text-base text-amber-800">
            {result.failedPhotos} photo{result.failedPhotos > 1 ? "s n'ont" : " n'a"} pas pu être envoyée
            {result.failedPhotos > 1 ? "s" : ""}. Vous pourrez la montrer à l&apos;artisan directement.
          </p>
        )}
      </div>
    );
  }

  const canAddPhotos = photos.length < MAX_PHOTOS;

  return (
    // POST: if sent before the page is interactive, the message never ends up in the URL.
    <form method="post" onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <div>
        <label htmlFor="description" className="mb-2 block text-base font-semibold text-stone-800">
          Votre besoin
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          maxLength={MAX_DESCRIPTION_LENGTH}
          placeholder="Par exemple : fuite au plafond de la chambre depuis la pluie de cette nuit."
          className="block w-full rounded-2xl border-2 border-stone-200 bg-white px-4 py-3 text-lg text-stone-900 outline-none placeholder:text-stone-400 focus:border-orange-500"
        />
      </div>

      <div>
        <p className="mb-2 text-base font-semibold text-stone-800">Photos (facultatif)</p>
        {photos.length > 0 && (
          <ul className="mb-3 grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <li key={photo.id} className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100">
                {/* Local preview of a file the customer picked: next/image does not apply. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.previewUrl} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  aria-label="Retirer cette photo"
                  className="absolute right-1.5 top-1.5 grid size-9 place-items-center rounded-full bg-stone-900/80 text-lg text-white"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={fileInputRef}
          type="file"
          name="photos"
          accept="image/*"
          multiple
          onChange={handlePhotoChoice}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAddPhotos || isPreparingPhotos}
          className="flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 px-5 text-lg font-semibold text-stone-800 hover:border-stone-900 disabled:opacity-50"
        >
          {isPreparingPhotos
            ? "Préparation des photos…"
            : canAddPhotos
              ? photos.length === 0
                ? "Ajouter des photos"
                : "Ajouter d'autres photos"
              : `${MAX_PHOTOS} photos maximum`}
        </button>
      </div>

      <TextField
        label="Adresse du chantier"
        name="address"
        autoComplete="street-address"
        placeholder="Rue, ville"
      />
      <TextField label="Votre nom (facultatif)" name="name" autoComplete="name" defaultValue={defaultName} />
      <TextField
        label="Votre téléphone"
        name="phone"
        type="text"
        inputMode="tel"
        autoComplete="tel"
        required
        defaultValue={defaultPhone ? formatPhone(defaultPhone) : ""}
        placeholder="06 12 34 56 78"
        hint="Pour que l'artisan puisse vous rappeler."
      />

      <FormError message={error} />
      <button
        type="submit"
        disabled={isSending || isPreparingPhotos}
        className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-600 px-7 text-lg font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
      >
        {isSending ? "Envoi en cours…" : `Envoyer à ${companyName}`}
      </button>

      <p className="text-sm leading-relaxed text-stone-500">{privacyNotice}</p>
    </form>
  );
}
