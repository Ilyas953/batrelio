"use client";

import { useState, useTransition } from "react";
import { FormError } from "@/components/ui/form";
import { createInvoiceFromQuote, markInvoicePaid } from "../actions";

export function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => setError((await markInvoicePaid(invoiceId)).error))}
        className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
      >
        {isPending ? "Enregistrement…" : "Le client a payé"}
      </button>
      <FormError message={error} />
    </div>
  );
}

// "Faire la facture", on a sent or signed quote.
export function MakeInvoiceButton({ quoteId, label = "Faire la facture" }: { quoteId: string; label?: string }) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => setError((await createInvoiceFromQuote(quoteId)).error))}
        className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-600 px-5 text-lg font-semibold text-white hover:bg-orange-700 disabled:opacity-70"
      >
        {isPending ? "Préparation…" : label}
      </button>
      <FormError message={error} />
    </div>
  );
}
