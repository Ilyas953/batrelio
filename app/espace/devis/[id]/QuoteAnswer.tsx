"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckIcon, CrossIcon } from "@/components/landing/icons";
import { FormError } from "@/components/ui/form";
import type { ArtisanAnswer } from "@/lib/quotes/acceptance";
import { recordQuoteAnswer } from "../actions";

type QuoteAnswerProps = {
  quoteId: string;
  status: "sent" | "signed" | "declined";
  // "Accepté en ligne par Marie Le Goff le 14 novembre 2026 à 10:12", built by the server.
  answerLabel: string | null;
  // An online acceptance is a proof: the artisan cannot undo it.
  canUndo: boolean;
};

const BUTTON =
  "flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 px-4 text-base font-semibold disabled:opacity-60";

// The customer's answer: given online, or recorded here when it came by phone or on paper.
export function QuoteAnswer({ quoteId, status, answerLabel, canUndo }: QuoteAnswerProps) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function record(answer: ArtisanAnswer, confirmation?: string) {
    if (confirmation && !window.confirm(confirmation)) return;
    setError(undefined);
    startTransition(async () => {
      const result = await recordQuoteAnswer(quoteId, answer);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  if (status !== "sent") {
    const isSigned = status === "signed";
    return (
      <div className={`space-y-2 rounded-2xl p-4 ring-1 ${isSigned ? "bg-emerald-50 ring-emerald-200" : "bg-stone-100 ring-stone-200"}`}>
        <p className={`flex items-center gap-2 text-lg font-bold ${isSigned ? "text-emerald-950" : "text-stone-800"}`}>
          {isSigned ? <CheckIcon className="size-5" /> : <CrossIcon className="size-5" />}
          {answerLabel}
        </p>
        {canUndo && (
          <button type="button" disabled={isPending} onClick={() => record("sent")} className="text-base font-semibold text-stone-600 underline">
            Annuler : le client n&apos;a pas encore répondu
          </button>
        )}
        <FormError message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200">
      <p className="text-base text-stone-700">
        Votre client peut accepter le devis en ligne, depuis son lien. Il vous a répondu par téléphone ou sur papier ?
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => record("signed", "Le client a accepté ce devis ?")}
          className={`${BUTTON} border-emerald-200 bg-white text-emerald-800 hover:border-emerald-400`}
        >
          <CheckIcon className="size-5" />
          Il a accepté
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => record("declined", "Le client a refusé ce devis ?")}
          className={`${BUTTON} border-stone-200 bg-white text-stone-700 hover:border-stone-400`}
        >
          <CrossIcon className="size-5" />
          Il a refusé
        </button>
      </div>
      <FormError message={error} />
    </div>
  );
}
