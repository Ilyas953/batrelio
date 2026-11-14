"use client";

import {
  CATEGORY_LABELS,
  QUOTE_LINE_CATEGORIES,
  QUOTE_UNITS,
  UNIT_LABELS,
  VAT_RATES_BP,
  formatVatRate,
  type QuoteLineCategory,
  type QuoteUnit,
} from "@/lib/quotes/catalog";
import { isQuoteUnit, suggestPriceItems, type PriceItem } from "@/lib/quotes/price-list";
import { centsToInput, computeTotals, lineTotalCents, parseEurosInput, parseQuantityInput } from "@/lib/quotes/totals";
import { formatPrice } from "@/lib/format";

// Editing the lines of a quote or an invoice: same cards, same rules, same "Mes prix" suggestions.

export type EditableLine = {
  key: string;
  category: QuoteLineCategory;
  designation: string;
  quantity: string;
  unit: QuoteUnit;
  unitPrice: string;
  vatRateBp: (typeof VAT_RATES_BP)[number];
};

// A line as stored (quote_lines or invoice_lines).
export type StoredLine = {
  id: string;
  category: QuoteLineCategory;
  designation: string;
  quantity: number | string;
  unit: string;
  unit_price_cents: number | null;
  vat_rate_bp: number;
};

export type ParsedLine = {
  category: QuoteLineCategory;
  designation: string;
  quantity: number;
  unit: QuoteUnit;
  unitPriceCents: number | null;
  vatRateBp: EditableLine["vatRateBp"];
};

export const FIELD_CLASSES =
  "block min-h-12 w-full rounded-xl border-2 border-stone-200 bg-white px-3 text-base text-stone-900 outline-none focus:border-orange-500";
export const TEXTAREA_CLASSES =
  "block w-full rounded-xl border-2 border-stone-200 bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-orange-500";

function isUnit(value: string): value is QuoteUnit {
  return (QUOTE_UNITS as readonly string[]).includes(value);
}

export function toEditableLines(lines: StoredLine[], chargesVat: boolean): EditableLine[] {
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
export function toVatRate(rateBp: number): EditableLine["vatRateBp"] {
  return (VAT_RATES_BP as readonly number[]).includes(rateBp) ? (rateBp as EditableLine["vatRateBp"]) : 2000;
}

export function newLine(chargesVat: boolean): EditableLine {
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

// The lines as the server expects them, or a message when a number is unreadable.
export function parseEditableLines(lines: EditableLine[]): ParsedLine[] | string {
  const parsed: ParsedLine[] = [];
  for (const [index, line] of lines.entries()) {
    const quantity = parseQuantityInput(line.quantity);
    const unitPriceCents = parseEurosInput(line.unitPrice);
    if (Number.isNaN(quantity)) return `Ligne ${index + 1} : la quantité n'est pas un nombre.`;
    if (Number.isNaN(unitPriceCents)) return `Ligne ${index + 1} : le prix n'est pas un montant.`;
    parsed.push({ category: line.category, designation: line.designation.trim(), quantity, unit: line.unit, unitPriceCents, vatRateBp: line.vatRateBp });
  }
  return parsed;
}

// Live totals while editing (an unreadable number counts as 0 until fixed).
export function liveTotals(lines: EditableLine[], chargesVat: boolean) {
  return computeTotals(
    lines.map((line) => ({ quantity: parseQuantityInput(line.quantity) || 0, unitPriceCents: parseEurosInput(line.unitPrice) || 0, vatRateBp: line.vatRateBp })),
    chargesVat,
  );
}

type LinesSectionProps = {
  title: string;
  lines: EditableLine[];
  setLines: (update: (current: EditableLine[]) => EditableLine[]) => void;
  chargesVat: boolean;
  priceItems: PriceItem[];
};

export function LinesSection({ title, lines, setLines, chargesVat, priceItems }: LinesSectionProps) {
  const updateLine = (key: string, patch: Partial<EditableLine>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-stone-900">{title}</h2>
      {lines.map((line, index) => (
        <LineCard
          key={line.key}
          line={line}
          index={index}
          chargesVat={chargesVat}
          priceItems={priceItems}
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
  );
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6">
      <h2 className="text-xl font-bold text-stone-900">{title}</h2>
      {children}
    </section>
  );
}

export function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
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

export function SmallSelect({ label, value, onChange, options }: SmallSelectProps) {
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
          <p className="text-sm font-semibold text-stone-600">Vos lignes habituelles</p>
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

      <div className="grid grid-cols-[1fr_1.2fr_1.4fr] items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-stone-600">Quantité</span>
          <input inputMode="decimal" value={line.quantity} onChange={(e) => onChange({ quantity: e.target.value })} className={FIELD_CLASSES} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-stone-600">Unité</span>
          <select value={line.unit} onChange={(e) => onChange({ unit: e.target.value as QuoteUnit })} className={FIELD_CLASSES}>
            {QUOTE_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-stone-600">Prix {chargesVat ? "HT " : ""}(€)</span>
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
