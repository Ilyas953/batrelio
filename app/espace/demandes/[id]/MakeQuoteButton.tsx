"use client";

import { useState, useTransition } from "react";
import { FormError } from "@/components/ui/form";
import { createQuoteFromRequest } from "@/app/espace/devis/actions";

// The AI reads the request and its photos: it takes a few dozen seconds.
export function MakeQuoteButton({ requestId, label }: { requestId: string; label: string }) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => setError((await createQuoteFromRequest(requestId)).error))}
        className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-stone-900 px-5 text-lg font-semibold text-white hover:bg-stone-700 disabled:opacity-70"
      >
        {isPending ? "Préparation du devis…" : label}
      </button>
      {isPending && (
        <p className="text-center text-sm text-stone-500">
          Batrelio lit la demande et les photos pour préparer les lignes. Cela prend environ 30 secondes.
        </p>
      )}
      <FormError message={error} />
    </div>
  );
}
