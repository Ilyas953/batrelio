import { QUOTE_UNITS, type QuoteLineCategory, type QuoteUnit } from "./catalog";

// "Mes prix": the artisan's own lines, remembered from the quotes they send.

export type PriceItem = {
  id: string;
  category: QuoteLineCategory;
  designation: string;
  unit: string;
  unit_price_cents: number;
  vat_rate_bp: number;
};

// Same rule as the database (price_items.designation_key): capitals and spaces do not matter.
export function designationKey(designation: string): string {
  return designation.trim().replace(/\s+/g, " ").toLowerCase();
}

// Lines whose wording contains what the artisan is typing, most used first (the list comes sorted).
export function suggestPriceItems(items: PriceItem[], typed: string, limit = 3): PriceItem[] {
  const key = designationKey(typed);
  if (key.length < 2) return [];
  return items.filter((item) => designationKey(item.designation).includes(key) && designationKey(item.designation) !== key).slice(0, limit);
}

export function isQuoteUnit(unit: string): unit is QuoteUnit {
  return (QUOTE_UNITS as readonly string[]).includes(unit);
}

// The list as the AI reads it: a short reference per line, never the prices (they stay the artisan's).
export function priceListForPrompt(items: PriceItem[]): { text: string; byRef: Map<string, PriceItem> } {
  const byRef = new Map(items.map((item, index) => [`P${index + 1}`, item]));
  const text = [...byRef].map(([ref, item]) => `[${ref}] ${item.category} | ${item.designation} | ${item.unit}`).join("\n");
  return { text, byRef };
}

type DraftLine = { category: QuoteLineCategory; designation: string; quantity: number; unit: QuoteUnit; priceListRef?: string | null };

export type PricedDraftLine = {
  category: QuoteLineCategory;
  designation: string;
  quantity: number;
  unit: QuoteUnit;
  unit_price_cents: number | null;
  vat_rate_bp: number;
};

// A line the AI matched with one of the artisan's: their wording, unit and price; the AI's quantity.
export function applyPriceList(lines: DraftLine[], byRef: Map<string, PriceItem>, defaultVatBp: number): PricedDraftLine[] {
  return lines.map(({ priceListRef, ...line }) => {
    const item = priceListRef ? byRef.get(priceListRef) : undefined;
    if (!item || !isQuoteUnit(item.unit)) return { ...line, unit_price_cents: null, vat_rate_bp: defaultVatBp };
    return {
      category: item.category,
      designation: item.designation,
      quantity: line.quantity,
      unit: item.unit,
      unit_price_cents: item.unit_price_cents,
      // A company that does not charge VAT never gets a rate from an old line.
      vat_rate_bp: defaultVatBp === 0 ? 0 : item.vat_rate_bp || defaultVatBp,
    };
  });
}
