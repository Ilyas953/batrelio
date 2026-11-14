"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FormError, TextField } from "@/components/ui/form";
import { ShareLinkButtons, type ShareableLink } from "@/components/ui/ShareLinkButtons";
import { DEPOSIT_PERCENT_OPTIONS, VALIDITY_DAY_OPTIONS, formatVatRate } from "@/lib/quotes/catalog";
import type { QuoteEditorInput } from "@/lib/quotes/editor-input";
import type { EditorQuote } from "@/lib/quotes/queries";
import { depositCents } from "@/lib/quotes/totals";
import {
  Card,
  FIELD_CLASSES,
  LinesSection,
  SmallSelect,
  TEXTAREA_CLASSES,
  TotalRow,
  liveTotals,
  parseEditableLines,
  toEditableLines,
  type EditableLine,
} from "@/components/quotes/LineEditor";
import { formatPrice } from "@/lib/format";
import { deleteQuote, saveQuote, sendQuote } from "../actions";
import { withReturnTo } from "@/lib/espace/return-to";
import { AUTOSAVE_LABELS, EDITOR_BAR_CLASSES, useAutosave } from "@/components/quotes/useAutosave";

type Fields = {
  title: string;
  customerName: string;
  customerAddress: string;
  depositPercent: number;
  validityDays: number;
  workStartDate: string;
  workDuration: string;
  wasteManagement: string;
  notes: string;
};

// The editor's text fields as the server expects them, or a message when a number is unreadable.
function toInput(fields: Fields, lines: EditableLine[]): QuoteEditorInput | string {
  const parsedLines = parseEditableLines(lines);
  return typeof parsedLines === "string" ? parsedLines : { ...fields, lines: parsedLines };
}

export function QuoteEditor({ editor }: { editor: EditorQuote }) {
  const { quote, chargesVat } = editor;
  const [fields, setFields] = useState<Fields>({
    title: quote.title ?? "",
    customerName: quote.customer_name ?? "",
    customerAddress: quote.customer_address ?? "",
    depositPercent: quote.deposit_percent ?? 0,
    validityDays: quote.validity_days,
    workStartDate: quote.work_start_date ?? "",
    workDuration: quote.work_duration ?? "",
    wasteManagement: quote.waste_management ?? "",
    notes: quote.notes ?? "",
  });
  const [lines, setLines] = useState<EditableLine[]>(() => toEditableLines(editor.lines, chargesVat));
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<ShareableLink>();
  const [isSending, startSending] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const setField = <K extends keyof Fields>(name: K, value: Fields[K]) => setFields((current) => ({ ...current, [name]: value }));
  const totals = liveTotals(lines, chargesVat);
  const deposit = depositCents(totals.totalCents, fields.depositPercent);

  const autosave = useAutosave(
    JSON.stringify({ fields, lines }),
    async () => {
      const input = toInput(fields, lines);
      const result = typeof input === "string" ? { error: input } : await saveQuote(quote.id, input);
      setError(result.error);
      return !result.error;
    },
    { enabled: !sent && !isSending && !isDeleting },
  );

  function run(action: (input: QuoteEditorInput) => void) {
    const input = toInput(fields, lines);
    setError(undefined);
    if (typeof input === "string") setError(input);
    else action(input);
  }

  function handleSend() {
    run((input) =>
      startSending(async () => {
        const result = await sendQuote(quote.id, input);
        if ("error" in result) setError(result.error);
        else setSent(result.sent);
      }),
    );
  }

  if (sent) {
    return (
      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-2xl font-extrabold text-stone-900">Devis prêt à envoyer ✓</h2>
        <p className="text-base text-stone-600">Envoyez ce lien à votre client : il y verra le devis complet.</p>
        <ShareLinkButtons link={sent} />
        <Link href="/espace/devis" className="block text-center text-base font-semibold text-orange-700 underline">
          Voir tous mes devis
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6 pb-52 sm:pb-32">
      {quote.ai_notes && (
        <section className="rounded-3xl border-2 border-amber-200 bg-amber-50 p-5">
          <h2 className="text-lg font-bold text-amber-950">Points à vérifier</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-amber-900">
            {quote.ai_notes.split("\n").map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-amber-800">Proposition préparée automatiquement : relisez chaque ligne.</p>
        </section>
      )}

      {editor.missingCompanyDetails.length > 0 && (
        <Link
          href={withReturnTo("/espace/entreprise", `/espace/devis/${quote.id}`)}
          className="block rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 text-base text-amber-900"
        >
          <span className="block font-bold text-amber-950">Une dernière chose avant d&apos;envoyer votre devis</span>
          La loi demande qu&apos;y figurent {editor.missingCompanyDetails.join(", ")}. C&apos;est à faire une seule fois,
          puis vous revenez ici. <span className="font-semibold underline">Compléter (2 minutes)</span>
        </Link>
      )}

      <Card title="Client et chantier">
        <TextField label="Nom du client" name="customerName" value={fields.customerName} onChange={(e) => setField("customerName", e.target.value)} />
        <TextField label="Adresse du chantier" name="customerAddress" value={fields.customerAddress} onChange={(e) => setField("customerAddress", e.target.value)} />
        <TextField label="Objet du devis" name="title" value={fields.title} onChange={(e) => setField("title", e.target.value)} placeholder="Réparation de toiture" />
      </Card>

      <LinesSection title="Lignes du devis" lines={lines} setLines={setLines} chargesVat={chargesVat} priceItems={editor.priceItems} />

      <Card title="Total">
        <dl className="space-y-1 text-base">
          {chargesVat ? (
            <>
              <TotalRow label="Total HT" value={formatPrice(totals.subtotalCents)} />
              {totals.vatBreakdown.map((vat) => (
                <TotalRow key={vat.rateBp} label={`TVA ${formatVatRate(vat.rateBp)}`} value={formatPrice(vat.vatCents)} />
              ))}
              <TotalRow label="Total TTC" value={formatPrice(totals.totalCents)} strong />
            </>
          ) : (
            <>
              <TotalRow label="Total" value={formatPrice(totals.totalCents)} strong />
              <p className="text-sm text-stone-500">TVA non applicable, art. 293 B du CGI</p>
            </>
          )}
          {deposit !== null && <TotalRow label={`Acompte (${fields.depositPercent} %)`} value={formatPrice(deposit)} />}
        </dl>
      </Card>

      <Card title="Conditions">
        <div className="grid grid-cols-2 gap-3">
          <SmallSelect
            label="Acompte"
            value={String(fields.depositPercent)}
            onChange={(value) => setField("depositPercent", Number(value))}
            options={DEPOSIT_PERCENT_OPTIONS.map((percent) => ({ value: String(percent), label: percent ? `${percent} %` : "Sans acompte" }))}
          />
          <SmallSelect
            label="Valable"
            value={String(fields.validityDays)}
            onChange={(value) => setField("validityDays", Number(value))}
            options={VALIDITY_DAY_OPTIONS.map((days) => ({ value: String(days), label: `${days} jours` }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-stone-700">Début des travaux</span>
            <input type="date" value={fields.workStartDate} onChange={(e) => setField("workStartDate", e.target.value)} className={FIELD_CLASSES} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-stone-700">Durée estimée</span>
            <input value={fields.workDuration} onChange={(e) => setField("workDuration", e.target.value)} placeholder="2 jours" className={FIELD_CLASSES} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-stone-700">Gestion des déchets de chantier</span>
          <textarea
            rows={3}
            value={fields.wasteManagement}
            onChange={(e) => setField("wasteManagement", e.target.value)}
            placeholder="Nature et quantité estimées, tri, évacuation, point de collecte"
            className={TEXTAREA_CLASSES}
          />
          <span className="mt-1 block text-sm text-stone-500">Obligatoire sur les devis de travaux (loi AGEC).</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-stone-700">Remarques (facultatif)</span>
          <textarea rows={2} value={fields.notes} onChange={(e) => setField("notes", e.target.value)} className={TEXTAREA_CLASSES} />
        </label>
      </Card>

      <button
        type="button"
        disabled={isDeleting}
        onClick={() => {
          if (!window.confirm("Supprimer ce brouillon ?")) return;
          startDeleting(async () => setError((await deleteQuote(quote.id)).error));
        }}
        className="text-base font-semibold text-red-700 underline"
      >
        Supprimer le brouillon
      </button>

      <div className={EDITOR_BAR_CLASSES}>
        <div className="mx-auto max-w-2xl space-y-2">
          <FormError message={error} />
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-stone-500">{AUTOSAVE_LABELS[autosave]}</p>
              <p className="truncate text-xl font-extrabold tabular-nums text-stone-900">
                {formatPrice(totals.totalCents)}
                <span className="ml-1 text-sm font-semibold text-stone-500">{chargesVat ? "TTC" : ""}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="min-h-14 rounded-2xl bg-orange-600 px-5 text-base font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {isSending ? "Envoi…" : "Valider et envoyer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

