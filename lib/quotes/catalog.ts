import type { Enums } from "@/lib/supabase/database.types";

export type QuoteLineCategory = Enums<"quote_line_category">;

export const QUOTE_LINE_CATEGORIES = ["labor", "material", "equipment", "travel", "waste", "other"] as const satisfies readonly QuoteLineCategory[];

export const CATEGORY_LABELS: Record<QuoteLineCategory, string> = {
  labor: "Main-d'œuvre",
  material: "Fourniture",
  equipment: "Matériel et outils",
  travel: "Déplacement",
  waste: "Déchets",
  other: "Autre",
};

// Units an artisan uses on a quote, in the order of the picker.
export const QUOTE_UNITS = ["u", "m²", "ml", "m³", "h", "jour", "forfait", "kg", "lot"] as const;
export type QuoteUnit = (typeof QUOTE_UNITS)[number];

export const UNIT_LABELS: Record<QuoteUnit, string> = {
  u: "unité",
  "m²": "m²",
  ml: "mètre linéaire",
  "m³": "m³",
  h: "heure",
  jour: "jour",
  forfait: "forfait",
  kg: "kg",
  lot: "lot",
};

// French VAT rates for building work, in basis points (2000 = 20 %). 10 % and 5.5 % apply to
// renovation of homes over 2 years old under conditions the artisan checks with the customer.
export const VAT_RATES_BP = [2000, 1000, 550, 0] as const;

export function formatVatRate(rateBp: number): string {
  return `${(rateBp / 100).toLocaleString("fr-FR")} %`;
}

export const DEPOSIT_PERCENT_OPTIONS = [0, 20, 30, 40, 50] as const;
export const DEFAULT_DEPOSIT_PERCENT = 30;
export const VALIDITY_DAY_OPTIONS = [15, 30, 60, 90] as const;
