"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FormError, TextField } from "@/components/ui/form";
import { ShareLinkButtons, type ShareableLink } from "@/components/ui/ShareLinkButtons";
import {
  CATEGORY_LABELS,
  DEPOSIT_PERCENT_OPTIONS,
  QUOTE_LINE_CATEGORIES,
  QUOTE_UNITS,
  UNIT_LABELS,
  VALIDITY_DAY_OPTIONS,
  VAT_RATES_BP,
  formatVatRate,
  type QuoteLineCategory,
  type QuoteUnit,
} from "@/lib/quotes/catalog";
import type { QuoteEditorInput } from "@/lib/quotes/editor-input";
import type { EditorQuote } from "@/lib/quotes/queries";
import {
  centsToInput,
  computeTotals,
  depositCents,
  lineTotalCents,
  parseEurosInput,
  parseQuantityInput,
} from "@/lib/quotes/totals";
import { formatPrice } from "@/lib/format";
import { deleteQuote, saveQuote, sendQuote } from "../actions";
import { withReturnTo } from "@/lib/espace/return-to";
import { isQuoteUnit, suggestPriceItems, type PriceItem } from "@/lib/quotes/price-list";

type EditableLine = {
  key: string;
  category: QuoteLineCategory;
  designation: string;
  quantity: string;
  unit: QuoteUnit;
  unitPrice: string;
  vatRateBp: (typeof VAT_RATES_BP)[number];
};

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

const FIELD_CLASSES =
  "block min-h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3 text-base text-stone-900 outline-none focus:border-orange-500";
const TEXTAREA_CLASSES =
  "block w-full rounded-xl border-2 border-stone-200 bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-orange-500";

function isUnit(value: string): value is QuoteUnit {
  return (QUOTE_UNITS as readonly string[]).includes(value);
}

function toEditableLines(lines: EditorQuote["lines"], chargesVat: boolean): EditableLine[] {
  return lines.map((line) => ({
    key: line.id,
    category: line.category,
    designation: line.designation,
    quantity: String(line.quantity).replace(".", ","),
    unit: isUnit(line.unit) ? line.unit : "u",
    unitPrice: centsToInput(line.unit_price_cents),
    vatRateBp: chargesVat ? toVatRate(line.vat_rate_bp) : 0,
  }));
}

// A stored rate the picker offers, else the usual 20 %.
function toVatRate(rateBp: number): EditableLine["vatRateBp"] {
  return (VAT_RATES_BP as readonly number[]).includes(rateBp) ? (rateBp as EditableLine["vatRateBp"]) : 2000;
}

function newLine(chargesVat: boolean): EditableLine {
  return {
    key: crypto.randomUUID(),
    category: "labor",
    designation: "",
    quantity: "1",
    unit: "u",
    unitPrice: "",
    vatRateBp: chargesVat ? 2000 : 0,
  };
}

// The editor's text fields as the server expects them, or a message when a number is unreadable.
function toInput(fields: Fields, lines: EditableLine[]): QuoteEditorInput | string {
  const parsedLines = [];
  for (const [index, line] of lines.entries()) {
    const quantity = parseQuantityInput(line.quantity);
    const unitPriceCents = parseEurosInput(line.unitPrice);
    if (Number.isNaN(quantity)) return `Ligne ${index + 1} : la quantité n'est pas un nombre.`;
    if (Number.isNaN(unitPriceCents)) return `Ligne ${index + 1} : le prix n'est pas un montant.`;
    parsedLines.push({
      category: line.category,
      designation: line.designation.trim(),
      quantity,
      unit: line.unit,
      unitPriceCents,
      vatRateBp: line.vatRateBp,
    });
  }
  return { ...fields, lines: parsedLines };
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
  const [lines, setLines] = useState(() => toEditableLines(editor.lines, chargesVat));
  const [error, setError] = useState<string>();
  const [savedAt, setSavedAt] = useState<string>();
  const [sent, setSent] = useState<ShareableLink>();
  const [isSaving, startSaving] = useTransition();
  const [isSending, startSending] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const setField = <K extends keyof Fields>(name: K, value: Fields[K]) => setFields((current) => ({ ...current, [name]: value }));
  const updateLine = (key: string, patch: Partial<EditableLine>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const pricedLines = lines.map((line) => ({
    quantity: parseQuantityInput(line.quantity) || 0,
    unitPriceCents: parseEurosInput(line.unitPrice) || 0,
    vatRateBp: line.vatRateBp,
  }));
  const totals = computeTotals(pricedLines, chargesVat);
  const deposit = depositCents(totals.totalCents, fields.depositPercent);

  function run(action: (input: QuoteEditorInput) => void) {
    const input = toInput(fields, lines);
    setError(undefined);
    if (typeof input === "string") setError(input);
    else action(input);
  }

  function handleSave() {
    run((input) =>
      startSaving(async () => {
        const result = await saveQuote(quote.id, input);
        if (result.error) setError(result.error);
        else setSavedAt(result.savedAt);
      }),
    );
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
    <div className="space-y-6 pb-32">
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

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-stone-900">Lignes du devis</h2>
        {lines.map((line, index) => (
          <LineCard
            key={line.key}
            line={line}
            index={index}
            chargesVat={chargesVat}
            priceItems={editor.priceItems}
            onChange={(patch) => updateLine(line.key, patch)}
            onRemove={() => setLines((current) => current.filter((item) => item.key !== line.key))}
          />
        ))}
        <button
          type="button"
          onClick={() => setLines((current) => [...current, newLine(chargesVat)])}
          className="flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 text-lg font-semibold text-stone-800 hover:border-stone-900"
        >
          + Ajouter une ligne
        </button>
      </section>

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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-2xl space-y-2">
          <FormError message={error} />
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-stone-500">
                {isSaving ? "Enregistrement…" : savedAt ? "Enregistré ✓" : chargesVat ? "Total TTC" : "Total"}
              </p>
              <p className="truncate text-xl font-extrabold tabular-nums text-stone-900">{formatPrice(totals.totalCents)}</p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isSending}
              className="min-h-12 rounded-2xl px-4 text-base font-semibold text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50 disabled:opacity-60"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSaving || isSending}
              className="min-h-12 rounded-2xl bg-orange-600 px-5 text-base font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {isSending ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6">
      <h2 className="text-xl font-bold text-stone-900">{title}</h2>
      {children}
    </section>
  );
}

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-lg font-extrabold text-stone-900" : "text-stone-700"}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

type SmallSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
};

function SmallSelect({ label, value, onChange, options }: SmallSelectProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-stone-700">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={FIELD_CLASSES}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type LineCardProps = {
  line: EditableLine;
  index: number;
  chargesVat: boolean;
  priceItems: PriceItem[];
  onChange: (patch: Partial<EditableLine>) => void;
  onRemove: () => void;
};

function LineCard({ line, index, chargesVat, priceItems, onChange, onRemove }: LineCardProps) {
  const suggestions = suggestPriceItems(priceItems, line.designation);
  const quantity = parseQuantityInput(line.quantity) || 0;
  const unitPriceCents = parseEurosInput(line.unitPrice);
  const isPriced = unitPriceCents !== null && !Number.isNaN(unitPriceCents);

  return (
    <article className={`space-y-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ${isPriced ? "ring-stone-200" : "ring-orange-300"}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-stone-400">{index + 1}</span>
        <select
          aria-label="Type de ligne"
          value={line.category}
          onChange={(e) => onChange({ category: e.target.value as QuoteLineCategory })}
          className="min-h-10 flex-1 rounded-xl border-0 bg-stone-100 px-3 text-sm font-semibold text-stone-700"
        >
          {QUOTE_LINE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Supprimer la ligne ${index + 1}`}
          className="grid size-10 place-items-center rounded-full text-xl text-stone-400 hover:bg-stone-100 hover:text-red-700"
        >
          ×
        </button>
      </div>

      <textarea
        aria-label="Description"
        rows={2}
        value={line.designation}
        onChange={(e) => onChange({ designation: e.target.value })}
        placeholder="Description de la prestation"
        className={TEXTAREA_CLASSES}
      />
      {suggestions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-stone-500">Vos lignes habituelles</p>
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onChange({
                  designation: item.designation,
                  category: item.category,
                  ...(isQuoteUnit(item.unit) ? { unit: item.unit } : {}),
                  unitPrice: centsToInput(item.unit_price_cents),
                  vatRateBp: chargesVat ? toVatRate(item.vat_rate_bp) : 0,
                })
              }
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 text-left text-sm text-emerald-950 ring-1 ring-emerald-200 hover:bg-emerald-100"
            >
              <span className="min-w-0 truncate font-semibold">{item.designation}</span>
              <span className="shrink-0 tabular-nums">
                {formatPrice(item.unit_price_cents)} / {item.unit}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[1fr_1.2fr_1.4fr] gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-stone-500">Quantité</span>
          <input inputMode="decimal" value={line.quantity} onChange={(e) => onChange({ quantity: e.target.value })} className={FIELD_CLASSES} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-stone-500">Unité</span>
          <select value={line.unit} onChange={(e) => onChange({ unit: e.target.value as QuoteUnit })} className={FIELD_CLASSES}>
            {QUOTE_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-stone-500">Prix unitaire {chargesVat ? "HT" : ""} (€)</span>
          <input
            inputMode="decimal"
            value={line.unitPrice}
            onChange={(e) => onChange({ unitPrice: e.target.value })}
            placeholder="À fixer"
            className={`${FIELD_CLASSES} ${isPriced ? "" : "border-orange-300"}`}
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3">
        {chargesVat ? (
          <select
            aria-label="Taux de TVA"
            value={line.vatRateBp}
            onChange={(e) => onChange({ vatRateBp: Number(e.target.value) as EditableLine["vatRateBp"] })}
            className="min-h-10 rounded-xl border-0 bg-stone-100 px-3 text-sm font-semibold text-stone-700"
          >
            {VAT_RATES_BP.map((rate) => (
              <option key={rate} value={rate}>
                TVA {formatVatRate(rate)}
              </option>
            ))}
          </select>
        ) : (
          <span />
        )}
        <p className="text-base font-bold tabular-nums text-stone-900">
          {isPriced ? formatPrice(lineTotalCents({ quantity, unitPriceCents })) : "Prix à fixer"}
        </p>
      </div>
    </article>
  );
}
