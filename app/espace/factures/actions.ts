"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { listMissingQuoteDetails } from "@/lib/company/legal";
import {
  InvoiceEditorInputSchema,
  formatInvoiceNumber,
  invoiceShareText,
  listMissingBeforeIssuing,
  type InvoiceEditorInput,
} from "@/lib/invoices/invoice";
import { chargesVat, toCompanySnapshot } from "@/lib/quotes/company-snapshot";
import { computeTotals } from "@/lib/quotes/totals";
import { getSiteOrigin } from "@/lib/requests/site-origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UNIQUE_VIOLATION = "23505";
const NUMBER_ATTEMPTS = 5;

type Supabase = Awaited<ReturnType<typeof createClient>>;

function joinWithEt(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`;
}

// Today in Paris, for the "end of works" date picker.
function todayInParis(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

// "Faire la facture" on a sent or signed quote: a draft with the same customer and lines.
export async function createInvoiceFromQuote(quoteId: string): Promise<{ error: string }> {
  if (!UUID_PATTERN.test(quoteId)) return { error: "Devis introuvable." };
  const { supabase } = await requireUser();

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, company_id, status, title, customer_name, customer_address, deposit_cents, deposit_paid_at, invoices(id, status)")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote) return { error: "Devis introuvable." };
  if (quote.status !== "sent" && quote.status !== "signed") return { error: "Envoyez d'abord le devis : la facture se fait à partir d'un devis envoyé." };

  // One draft at a time per quote: reopen it.
  const draft = quote.invoices.find((invoice) => invoice.status === "draft");
  if (draft) redirect(`/espace/factures/${draft.id}`);

  const { data: lines } = await supabase
    .from("quote_lines")
    .select("position, category, designation, quantity, unit, unit_price_cents, vat_rate_bp")
    .eq("quote_id", quote.id)
    .order("position");

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      company_id: quote.company_id,
      quote_id: quote.id,
      title: quote.title,
      customer_name: quote.customer_name,
      customer_address: quote.customer_address,
      work_completed_on: todayInParis(),
      deposit_received_cents: quote.deposit_paid_at && quote.deposit_cents ? quote.deposit_cents : 0,
    })
    .select("id")
    .single();
  if (error) return { error: "La facture n'a pas pu être créée. Réessayez." };

  const { error: linesError } = await supabase.rpc("replace_invoice_lines", { p_invoice_id: invoice.id, p_lines: lines ?? [] });
  if (linesError) console.error("Lignes de la facture non copiées :", linesError.message);

  redirect(`/espace/factures/${invoice.id}`);
}

function readInput(raw: unknown): InvoiceEditorInput | string {
  const parsed = InvoiceEditorInputSchema.safeParse(raw);
  return parsed.success ? parsed.data : (parsed.error.issues[0]?.message ?? "Facture incomplète.");
}

// Saves a draft (RLS: only the artisan's own drafts) and returns its total.
async function persistDraft(
  supabase: Supabase,
  invoiceId: string,
  input: InvoiceEditorInput,
  vatCharged: boolean,
): Promise<{ error: string } | { totalCents: number }> {
  const lines = input.lines.map((line) => ({ ...line, vatRateBp: vatCharged ? line.vatRateBp : 0 }));
  const totals = computeTotals(lines, vatCharged);

  const { data, error } = await supabase
    .from("invoices")
    .update({
      title: input.title || null,
      customer_name: input.customerName || null,
      customer_address: input.customerAddress || null,
      work_completed_on: input.workCompletedOn || null,
      payment_due_days: input.paymentDueDays,
      deposit_received_cents: input.depositReceivedCents,
      subtotal_cents: totals.subtotalCents,
      vat_cents: totals.vatCents,
      total_cents: totals.totalCents,
      notes: input.notes || null,
    })
    .eq("id", invoiceId)
    .select("id");
  if (error || !data?.length) return { error: "Cette facture a déjà été émise : elle ne peut plus être modifiée." };

  const { error: linesError } = await supabase.rpc("replace_invoice_lines", {
    p_invoice_id: invoiceId,
    p_lines: lines.map((line, position) => ({
      position,
      category: line.category,
      designation: line.designation,
      quantity: line.quantity,
      unit: line.unit,
      unit_price_cents: line.unitPriceCents,
      vat_rate_bp: line.vatRateBp,
    })),
  });
  if (linesError) return { error: "Les lignes n'ont pas pu être enregistrées. Réessayez." };
  return { totalCents: totals.totalCents };
}

export async function saveInvoice(invoiceId: string, raw: unknown): Promise<{ error?: string; savedAt?: string }> {
  if (!UUID_PATTERN.test(invoiceId)) return { error: "Facture introuvable." };
  const input = readInput(raw);
  if (typeof input === "string") return { error: input };

  const { supabase } = await requireUser();
  const { data: company } = await supabase.from("companies").select("vat_regime").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };

  const saved = await persistDraft(supabase, invoiceId, input, chargesVat(company));
  return "error" in saved ? { error: saved.error } : { savedAt: new Date().toISOString() };
}

// Next number of the company's unbroken sequence for this year.
async function nextInvoiceNumber(admin: ReturnType<typeof createAdminClient>, companyId: string, attempt: number): Promise<string> {
  const year = Number(new Intl.DateTimeFormat("en", { timeZone: "Europe/Paris", year: "numeric" }).format(new Date()));
  const { count } = await admin
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .like("number", `F${year}-%`);
  return formatInvoiceNumber(year, (count ?? 0) + 1 + attempt);
}

export type IssuedInvoice = { url: string; shareText: string; customerPhone: string | null };

// Saves, then numbers and freezes the invoice. From then on it never changes.
export async function issueInvoice(invoiceId: string, raw: unknown): Promise<{ error: string } | { issued: IssuedInvoice }> {
  if (!UUID_PATTERN.test(invoiceId)) return { error: "Facture introuvable." };
  const input = readInput(raw);
  if (typeof input === "string") return { error: input };

  const { supabase } = await requireUser();
  const { data: company } = await supabase.from("companies").select("*").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };

  const missingCompany = listMissingQuoteDetails(company);
  if (missingCompany.length) return { error: `Avant d'émettre, complétez votre entreprise : il manque ${joinWithEt(missingCompany)}.` };

  const saved = await persistDraft(supabase, invoiceId, input, chargesVat(company));
  if ("error" in saved) return { error: saved.error };
  const missing = listMissingBeforeIssuing(input, saved.totalCents);
  if (missing.length) return { error: `Avant d'émettre, il manque ${joinWithEt(missing)}.` };

  // Number, status and frozen legal details are written by the server only.
  const admin = createAdminClient();
  let issued: { public_token: string; quote: { request: { customer_phone: string } | null } | null } | null = null;
  for (let attempt = 0; attempt < NUMBER_ATTEMPTS && !issued; attempt++) {
    const { data, error } = await admin
      .from("invoices")
      .update({
        number: await nextInvoiceNumber(admin, company.id, attempt),
        status: "issued",
        issued_at: new Date().toISOString(),
        company_snapshot: toCompanySnapshot(company),
      })
      .eq("id", invoiceId)
      .eq("company_id", company.id)
      .eq("status", "draft")
      .select("public_token, quote:quotes(request:requests(customer_phone))")
      .maybeSingle();
    if (error && error.code !== UNIQUE_VIOLATION) return { error: "La facture n'a pas pu être émise. Réessayez." };
    if (!error && !data) return { error: "Cette facture a déjà été émise." };
    issued = data;
  }
  if (!issued) return { error: "La facture n'a pas pu être numérotée. Réessayez." };

  const url = `${await getSiteOrigin()}/facture/${issued.public_token}`;
  return { issued: { url, shareText: invoiceShareText(company.name, url), customerPhone: issued.quote?.request?.customer_phone ?? null } };
}

// "Marquer comme payée": only an issued invoice of the artisan's own company.
export async function markInvoicePaid(invoiceId: string): Promise<{ error?: string }> {
  if (!UUID_PATTERN.test(invoiceId)) return { error: "Facture introuvable." };
  const { supabase } = await requireUser();
  const { data: invoice } = await supabase.from("invoices").select("id, company_id, status").eq("id", invoiceId).maybeSingle();
  if (!invoice || invoice.status !== "issued") return { error: "Seule une facture émise peut être marquée comme payée." };

  const { error } = await createAdminClient()
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", invoice.id)
    .eq("company_id", invoice.company_id)
    .eq("status", "issued");
  if (error) return { error: "La facture n'a pas pu être mise à jour. Réessayez." };
  redirect(`/espace/factures/${invoice.id}`);
}

export async function deleteInvoiceDraft(invoiceId: string): Promise<{ error: string }> {
  if (!UUID_PATTERN.test(invoiceId)) return { error: "Facture introuvable." };
  const { supabase } = await requireUser();
  const { data: invoice } = await supabase.from("invoices").select("quote_id").eq("id", invoiceId).eq("status", "draft").maybeSingle();
  const { error } = await supabase.from("invoices").delete().eq("id", invoiceId).eq("status", "draft");
  if (error || !invoice) return { error: "Ce brouillon n'a pas pu être supprimé." };
  redirect(`/espace/devis/${invoice.quote_id}`);
}
