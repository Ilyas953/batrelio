"use client";

import { useState, useTransition } from "react";
import { FormError } from "@/components/ui/form";
import { createQuoteFromRequest } from "@/app/espace/devis/actions";

// The AI reads the request and its photos: it takes a few dozen seconds.
// compact: the half-width button of a request card on the home page.
export function MakeQuoteButton({ requestId, label, compact = false }: { requestId: string; label: string; compact?: boolean }) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const size = compact ? "min-h-12 px-3 text-base" : "min-h-14 w-full px-5 text-lg";

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => setError((await createQuoteFromRequest(requestId)).error))}
        className={`flex w-full items-center justify-center rounded-2xl bg-stone-900 font-semibold text-white hover:bg-stone-700 disabled:opacity-70 ${size}`}
      >
        {isPending ? (compact ? "Préparation…" : "Préparation du devis…") : label}
      </button>
      {isPending && (
        <p className="text-center text-sm text-stone-500">
          {compact
            ? "Environ 30 secondes."
            : "Batrelio lit la demande et les photos pour préparer les lignes. Cela prend environ 30 secondes."}
        </p>
      )}
      <FormError message={error} />
    </div>
  );
}
