import { z } from "zod";
import { QUOTE_LINE_CATEGORIES, QUOTE_UNITS, VAT_RATES_BP } from "./catalog";

// What the quote editor sends to the server. Always re-validated on the server.

export const QuoteLineInputSchema = z.object({
  category: z.enum(QUOTE_LINE_CATEGORIES),
  designation: z.string().trim().min(1, "Chaque ligne doit avoir une description.").max(500),
  quantity: z.number().min(0).max(1_000_000),
  unit: z.enum(QUOTE_UNITS),
  unitPriceCents: z.number().int().min(0).max(100_000_000).nullable(),
  vatRateBp: z.union(VAT_RATES_BP.map((rate) => z.literal(rate))),
});

export const QuoteEditorInputSchema = z.object({
  title: z.string().trim().max(200),
  customerName: z.string().trim().max(120),
  customerAddress: z.string().trim().max(500),
  depositPercent: z.number().int().min(0).max(100),
  validityDays: z.number().int().min(1).max(365),
  workStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
  workDuration: z.string().trim().max(120),
  wasteManagement: z.string().trim().max(2000),
  notes: z.string().trim().max(2000),
  lines: z.array(QuoteLineInputSchema).max(100),
});

export type QuoteEditorInput = z.infer<typeof QuoteEditorInputSchema>;
export type QuoteLineInput = z.infer<typeof QuoteLineInputSchema>;

// What still prevents sending, in the artisan's words.
export function listMissingBeforeSending(input: QuoteEditorInput): string[] {
  const missing: string[] = [];
  if (!input.customerName) missing.push("le nom du client");
  if (!input.customerAddress) missing.push("l'adresse du chantier");
  if (input.lines.length === 0) missing.push("au moins une ligne");
  if (input.lines.some((line) => line.unitPriceCents === null)) missing.push("le prix de chaque ligne");
  if (!input.workDuration) missing.push("la durée estimée des travaux");
  return missing;
}
