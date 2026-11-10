"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { FormError } from "@/components/ui/form";
import { CATEGORY_LABELS, QUOTE_LINE_CATEGORIES, QUOTE_UNITS, UNIT_LABELS, VAT_RATES_BP, formatVatRate } from "@/lib/quotes/catalog";
import type { PriceItem } from "@/lib/quotes/price-list";
import { centsToInput } from "@/lib/quotes/totals";
import { deletePriceItem, savePriceItem, type PriceItemState } from "./actions";

const FIELD = "block min-h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3 text-base text-stone-900 outline-none focus:border-orange-500";
const LABEL = "mb-1 block text-sm font-semibold text-stone-600";

type Props = { item?: PriceItem; chargesVat: boolean; onDone?: () => void };

// Adds a line to "Mes prix", or changes one.
export function PriceItemForm({ item, chargesVat, onDone }: Props) {
  const router = useRouter();
  const [state, action, isSaving] = useActionState<PriceItemState, FormData>(savePriceItem.bind(null, item?.id ?? null), {});

  useEffect(() => {
    if (!state.saved) return;
    router.refresh();
    onDone?.();
  }, [state, router, onDone]);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor={`designation-${item?.id ?? "new"}`} className={LABEL}>
          Description
        </label>
        <textarea
          id={`designation-${item?.id ?? "new"}`}
          name="designation"
          rows={2}
          required
          defaultValue={item?.designation}
          placeholder="Ex. : Location nacelle 12 m"
          className={`${FIELD} py-2`}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className={LABEL}>Type</span>
          <select name="category" defaultValue={item?.category ?? "labor"} className={FIELD}>
            {QUOTE_LINE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={LABEL}>Unité</span>
          <select name="unit" defaultValue={item?.unit ?? "u"} className={FIELD}>
            {QUOTE_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={LABEL}>Prix {chargesVat ? "HT " : ""}(€)</span>
          <input name="price" inputMode="decimal" required defaultValue={item ? centsToInput(item.unit_price_cents) : ""} className={FIELD} />
        </label>
        {chargesVat && (
          <label>
            <span className={LABEL}>TVA</span>
            <select name="vat" defaultValue={String(item?.vat_rate_bp || 2000)} className={FIELD}>
              {VAT_RATES_BP.map((rate) => (
                <option key={rate} value={rate}>
                  {formatVatRate(rate)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <FormError message={state.error} />
      <button
        type="submit"
        disabled={isSaving}
        className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-orange-600 px-5 text-base font-semibold text-white hover:bg-orange-700 disabled:opacity-70"
      >
        {isSaving ? "Enregistrement…" : item ? "Enregistrer" : "Ajouter à mes prix"}
      </button>
    </form>
  );
}

// One line of the list: shown, then edited or deleted in place.
export function PriceItemRow({ item, chargesVat, summary }: { item: PriceItem; chargesVat: boolean; summary: string }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string>();
  const [isDeleting, startDeleting] = useTransition();

  if (isEditing) {
    return (
      <li className="space-y-2 rounded-2xl bg-white p-4 ring-2 ring-orange-300">
        <PriceItemForm item={item} chargesVat={chargesVat} onDone={() => setIsEditing(false)} />
        <button type="button" onClick={() => setIsEditing(false)} className="block w-full text-center text-base font-semibold text-stone-500 underline">
          Annuler
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-stone-900">{item.designation}</p>
        <p className="text-sm text-stone-500">{summary}</p>
        <FormError message={error} />
      </div>
      <button type="button" onClick={() => setIsEditing(true)} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50">
        Modifier
      </button>
      <button
        type="button"
        disabled={isDeleting}
        aria-label={`Supprimer ${item.designation}`}
        onClick={() =>
          startDeleting(async () => {
            const result = await deletePriceItem(item.id);
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
        className="grid size-11 place-items-center rounded-xl text-xl text-stone-400 hover:bg-stone-100 hover:text-red-700"
      >
        ×
      </button>
    </li>
  );
}
