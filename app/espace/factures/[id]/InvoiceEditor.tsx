"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
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
import { FormError, TextField } from "@/components/ui/form";
import { ShareLinkButtons, type ShareableLink } from "@/components/ui/ShareLinkButtons";
import { withReturnTo } from "@/lib/espace/return-to";
import { formatPrice } from "@/lib/format";
import { PAYMENT_DUE_DAY_OPTIONS, amountDueCents, paymentTermsLabel, type InvoiceEditorInput, type PaymentDueDays } from "@/lib/invoices/invoice";
import type { EditorInvoice } from "@/lib/invoices/queries";
import { formatVatRate } from "@/lib/quotes/catalog";
import { centsToInput, parseEurosInput } from "@/lib/quotes/totals";
import { deleteInvoiceDraft, issueInvoice, saveInvoice } from "../actions";

type Fields = {
  title: string;
  customerName: string;
  customerAddress: string;
  workCompletedOn: string;
  paymentDueDays: PaymentDueDays;
  depositReceived: string;
  notes: string;
};

function toInput(fields: Fields, lines: EditableLine[]): InvoiceEditorInput | string {
  const parsedLines = parseEditableLines(lines);
  if (typeof parsedLines === "string") return parsedLines;
  const deposit = parseEurosInput(fields.depositReceived);
  if (Number.isNaN(deposit)) return "L'acompte reçu n'est pas un montant.";
  const { depositReceived, ...rest } = fields;
  void depositReceived;
  return { ...rest, depositReceivedCents: deposit ?? 0, lines: parsedLines };
}

export function InvoiceEditor({ editor }: { editor: EditorInvoice }) {
  const { invoice, chargesVat } = editor;
  const [fields, setFields] = useState<Fields>({
    title: invoice.title ?? "",
    customerName: invoice.customer_name ?? "",
    customerAddress: invoice.customer_address ?? "",
    workCompletedOn: invoice.work_completed_on ?? "",
    paymentDueDays: (PAYMENT_DUE_DAY_OPTIONS as readonly number[]).includes(invoice.payment_due_days)
      ? (invoice.payment_due_days as PaymentDueDays)
      : 0,
    depositReceived: invoice.deposit_received_cents ? centsToInput(invoice.deposit_received_cents) : "",
    notes: invoice.notes ?? "",
  });
  const [lines, setLines] = useState<EditableLine[]>(() => toEditableLines(editor.lines, chargesVat));
  const [error, setError] = useState<string>();
  const [savedAt, setSavedAt] = useState<string>();
  const [issued, setIssued] = useState<ShareableLink>();
  const [isSaving, startSaving] = useTransition();
  const [isIssuing, startIssuing] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const setField = <K extends keyof Fields>(name: K, value: Fields[K]) => setFields((current) => ({ ...current, [name]: value }));
  const totals = liveTotals(lines, chargesVat);
  const deposit = parseEurosInput(fields.depositReceived) || 0;

  function run(action: (input: InvoiceEditorInput) => void) {
    const input = toInput(fields, lines);
    setError(undefined);
    if (typeof input === "string") setError(input);
    else action(input);
  }

  function handleSave() {
    run((input) =>
      startSaving(async () => {
        const result = await saveInvoice(invoice.id, input);
        if (result.error) setError(result.error);
        else setSavedAt(result.savedAt);
      }),
    );
  }

  function handleIssue() {
    if (!window.confirm("Émettre la facture ? Elle sera numérotée et ne pourra plus être modifiée.")) return;
    run((input) =>
      startIssuing(async () => {
        const result = await issueInvoice(invoice.id, input);
        if ("error" in result) setError(result.error);
        else setIssued(result.issued);
      }),
    );
  }

  if (issued) {
    return (
      <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <h2 className="text-2xl font-extrabold text-stone-900">Facture émise ✓</h2>
        <p className="text-base text-stone-600">Envoyez ce lien à votre client : il y verra la facture complète, à imprimer ou enregistrer en PDF.</p>
        <ShareLinkButtons link={issued} />
        <Link href="/espace/devis#factures" className="block text-center text-base font-semibold text-orange-700 underline">
          Voir toutes mes factures
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      {editor.missingCompanyDetails.length > 0 && (
        <Link
          href={withReturnTo("/espace/entreprise", `/espace/factures/${invoice.id}`)}
          className="block rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 text-base text-amber-900"
        >
          <span className="block font-bold text-amber-950">Une dernière chose avant d&apos;émettre</span>
          La loi demande qu&apos;y figurent {editor.missingCompanyDetails.join(", ")}.{" "}
          <span className="font-semibold underline">Compléter</span>
        </Link>
      )}

      <Card title="Client">
        <TextField label="Nom du client" name="customerName" value={fields.customerName} onChange={(e) => setField("customerName", e.target.value)} />
        <TextField label="Adresse" name="customerAddress" value={fields.customerAddress} onChange={(e) => setField("customerAddress", e.target.value)} />
        <TextField label="Objet" name="title" value={fields.title} onChange={(e) => setField("title", e.target.value)} placeholder="Réparation de toiture" />
      </Card>

      <LinesSection title="Lignes de la facture" lines={lines} setLines={setLines} chargesVat={chargesVat} priceItems={editor.priceItems} />
      <p className="-mt-3 text-sm text-stone-500">Reprises du devis : ajustez si des travaux ont été ajoutés ou retirés.</p>

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
          {deposit > 0 && <TotalRow label="Acompte déjà reçu" value={`− ${formatPrice(deposit)}`} />}
          <TotalRow label="Reste à payer" value={formatPrice(amountDueCents(totals.totalCents, deposit))} strong />
        </dl>
      </Card>

      <Card title="Conditions">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-stone-700">Fin des travaux</span>
            <input type="date" value={fields.workCompletedOn} onChange={(e) => setField("workCompletedOn", e.target.value)} className={FIELD_CLASSES} />
          </label>
          <SmallSelect
            label="À payer"
            value={String(fields.paymentDueDays)}
            onChange={(value) => setField("paymentDueDays", Number(value) as PaymentDueDays)}
            options={PAYMENT_DUE_DAY_OPTIONS.map((days) => ({ value: String(days), label: paymentTermsLabel(days) }))}
          />
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-stone-700">Acompte déjà reçu (€)</span>
          <input
            inputMode="decimal"
            value={fields.depositReceived}
            onChange={(e) => setField("depositReceived", e.target.value)}
            placeholder="0"
            className={FIELD_CLASSES}
          />
          <span className="mt-1 block text-sm text-stone-500">Il est déduit du reste à payer.</span>
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
          if (!window.confirm("Supprimer ce brouillon de facture ?")) return;
          startDeleting(async () => setError((await deleteInvoiceDraft(invoice.id)).error));
        }}
        className="text-base font-semibold text-red-700 underline"
      >
        Supprimer le brouillon
      </button>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-2xl space-y-2">
          <FormError message={error} />
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-stone-500">{isSaving ? "Enregistrement…" : savedAt ? "Enregistré ✓" : "Reste à payer"}</p>
              <p className="truncate text-xl font-extrabold tabular-nums text-stone-900">
                {formatPrice(amountDueCents(totals.totalCents, deposit))}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isIssuing}
              className="min-h-12 rounded-2xl px-4 text-base font-semibold text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50 disabled:opacity-60"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={handleIssue}
              disabled={isSaving || isIssuing}
              className="min-h-12 rounded-2xl bg-orange-600 px-5 text-base font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {isIssuing ? "Émission…" : "Émettre"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
