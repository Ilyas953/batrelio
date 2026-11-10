import { z } from "zod";
import { QuoteLineInputSchema } from "@/lib/quotes/editor-input";

// An invoice made from a quote: what the artisan edits, what must be there before issuing,
// and how it is numbered and paid.

export const PAYMENT_DUE_DAY_OPTIONS = [0, 15, 30, 45] as const;
export type PaymentDueDays = (typeof PAYMENT_DUE_DAY_OPTIONS)[number];

export const InvoiceEditorInputSchema = z.object({
  title: z.string().trim().max(200),
  customerName: z.string().trim().max(120),
  customerAddress: z.string().trim().max(500),
  workCompletedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
  paymentDueDays: z.union(PAYMENT_DUE_DAY_OPTIONS.map((days) => z.literal(days))),
  depositReceivedCents: z.number().int().min(0).max(100_000_000),
  notes: z.string().trim().max(2000),
  lines: z.array(QuoteLineInputSchema).max(100),
});

export type InvoiceEditorInput = z.infer<typeof InvoiceEditorInputSchema>;

// What is still missing for a valid invoice ("Avant d'émettre, il manque …").
export function listMissingBeforeIssuing(input: InvoiceEditorInput, totalCents: number): string[] {
  const missing: string[] = [];
  if (!input.customerName) missing.push("le nom du client");
  if (!input.customerAddress) missing.push("son adresse");
  if (input.lines.length === 0) missing.push("au moins une ligne");
  if (input.lines.some((line) => line.unitPriceCents === null)) missing.push("le prix de chaque ligne");
  if (!input.workCompletedOn) missing.push("la date de fin des travaux");
  if (input.depositReceivedCents > totalCents) missing.push("un acompte reçu inférieur au total");
  return missing;
}

// F2026-001, F2026-002…: one unbroken sequence per company and per year.
export function formatInvoiceNumber(year: number, sequence: number): string {
  return `F${year}-${String(sequence).padStart(3, "0")}`;
}

export function amountDueCents(totalCents: number, depositReceivedCents: number): number {
  return Math.max(0, totalCents - depositReceivedCents);
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Null: payable on receipt.
export function invoiceDueDate(issuedAt: string, paymentDueDays: number): Date | null {
  return paymentDueDays > 0 ? new Date(new Date(issuedAt).getTime() + paymentDueDays * DAY_MS) : null;
}

export function paymentTermsLabel(days: number): string {
  return days === 0 ? "À réception" : `${days} jours`;
}

// Sent from the artisan's own phone, with the link appended.
export function invoiceShareText(companyName: string, url: string): string {
  return `Bonjour, voici la facture de ${companyName} pour les travaux réalisés : ${url} Merci !`;
}
