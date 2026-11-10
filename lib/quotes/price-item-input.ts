import { QUOTE_LINE_CATEGORIES, VAT_RATES_BP, type QuoteLineCategory } from "./catalog";
import { isQuoteUnit } from "./price-list";
import { parseEurosInput } from "./totals";

export type PriceItemInput = {
  category: QuoteLineCategory;
  designation: string;
  unit: string;
  unit_price_cents: number;
  vat_rate_bp: number;
};

const MAX_DESIGNATION_LENGTH = 500;
const MAX_PRICE_CENTS = 100_000_000;

// A line typed in "Mes prix": wording, type, unit, price (and VAT for companies that charge it).
export function readPriceItemInput(formData: FormData, vatCharged: boolean): PriceItemInput | { error: string } {
  const designation = String(formData.get("designation") ?? "").trim().replace(/\s+/g, " ");
  const category = String(formData.get("category") ?? "");
  const unit = String(formData.get("unit") ?? "");
  const price = parseEurosInput(String(formData.get("price") ?? ""));
  const vat = Number(formData.get("vat") ?? 0);

  if (!designation) return { error: "Décrivez la ligne." };
  if (designation.length > MAX_DESIGNATION_LENGTH) return { error: "La description est trop longue." };
  if (!(QUOTE_LINE_CATEGORIES as readonly string[]).includes(category)) return { error: "Choisissez le type de ligne." };
  if (!isQuoteUnit(unit)) return { error: "Choisissez l'unité." };
  if (price === null || Number.isNaN(price) || price < 0 || price > MAX_PRICE_CENTS) return { error: "Indiquez un prix, par exemple 45 ou 45,50." };
  if (vatCharged && !(VAT_RATES_BP as readonly number[]).includes(vat)) return { error: "Choisissez le taux de TVA." };

  return { category: category as QuoteLineCategory, designation, unit, unit_price_cents: price, vat_rate_bp: vatCharged ? vat : 0 };
}
