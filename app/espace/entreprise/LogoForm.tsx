"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { FormError } from "@/components/ui/form";
import { removeLogo, uploadLogo, type LogoState } from "./logo-actions";

// Optional: shown at the top of quotes and invoices.
export function LogoForm({ currentUrl }: { currentUrl: string | null }) {
  const router = useRouter();
  const [state, action, isSaving] = useActionState<LogoState, FormData>(uploadLogo, {});
  const [preview, setPreview] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string>();
  const [isRemoving, startRemoving] = useTransition();
  const shown = preview ?? currentUrl;

  useEffect(() => {
    if (state.saved) router.refresh();
  }, [state, router]);

  return (
    <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6">
      <div>
        <h2 className="text-xl font-bold text-stone-900">Votre logo <span className="text-base font-normal text-stone-500">(facultatif)</span></h2>
        <p className="mt-1 text-base text-stone-600">Il apparaît en haut de vos devis et de vos factures.</p>
      </div>
      {shown && (
        <div className="flex h-24 items-center justify-center rounded-2xl bg-stone-50 p-3 ring-1 ring-stone-200">
          {/* Private file behind a short-lived signed link, or a local preview: not for the image cache. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shown} alt="Votre logo" className="max-h-full max-w-full object-contain" />
        </div>
      )}
      <form action={action} className="space-y-3">
        <label className="flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 px-4 text-base font-semibold text-stone-800 hover:border-stone-900">
          {currentUrl ? "Choisir un autre logo" : "Choisir mon logo"}
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
        </label>
        <p className="text-sm text-stone-500">PNG, JPEG ou WebP, 2 Mo maximum. Un fond transparent (PNG) rend le mieux.</p>
        <FormError message={state.error} />
        {state.saved && !isSaving && !preview && <p className="text-base font-semibold text-emerald-700">Logo enregistré ✓</p>}
        {preview && (
          <button
            type="submit"
            disabled={isSaving}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-600 px-5 text-lg font-semibold text-white hover:bg-orange-700 disabled:opacity-70"
            onClick={() => setTimeout(() => setPreview(null), 0)}
          >
            {isSaving ? "Enregistrement…" : "Enregistrer ce logo"}
          </button>
        )}
      </form>
      {currentUrl && !preview && (
        <>
          <button
            type="button"
            disabled={isRemoving}
            onClick={() =>
              startRemoving(async () => {
                const result = await removeLogo();
                if (result.error) setRemoveError(result.error);
                else router.refresh();
              })
            }
            className="text-base font-semibold text-stone-500 underline"
          >
            Retirer le logo
          </button>
          <FormError message={removeError} />
        </>
      )}
    </section>
  );
}
