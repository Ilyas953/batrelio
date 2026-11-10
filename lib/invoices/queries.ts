import "server-only";
import { requireUser } from "@/lib/auth/session";
import { listMissingQuoteDetails } from "@/lib/company/legal";
import type { CompanySnapshot } from "@/lib/quotes/company-snapshot";
import { logoUrl } from "@/lib/company/logo";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_PATTERN = /^[0-9a-f]{32}$/;

const INVOICE_COLUMNS =
  "id, quote_id, status, number, public_token, title, customer_name, customer_address, work_completed_on, payment_due_days, deposit_received_cents, subtotal_cents, vat_cents, total_cents, notes, company_snapshot, issued_at, paid_at";
const LINE_COLUMNS = "id, position, category, designation, quantity, unit, unit_price_cents, vat_rate_bp";

// RLS restricts the invoice, its lines and the company to the artisan's own.
export async function getInvoiceForEditor(invoiceId: string) {
  if (!UUID_PATTERN.test(invoiceId)) return null;
  const { supabase } = await requireUser();

  const [invoice, lines, company, priceItems] = await Promise.all([
    supabase
      .from("invoices")
      .select(`${INVOICE_COLUMNS}, quote:quotes(number, sent_at, request_id, request:requests(customer_phone))`)
      .eq("id", invoiceId)
      .maybeSingle(),
    supabase.from("invoice_lines").select(LINE_COLUMNS).eq("invoice_id", invoiceId).order("position"),
    supabase.from("companies").select("*").maybeSingle(),
    supabase
      .from("price_items")
      .select("id, category, designation, unit, unit_price_cents, vat_rate_bp")
      .order("use_count", { ascending: false })
      .limit(300),
  ]);
  if (invoice.error) throw invoice.error;
  if (!invoice.data || !company.data) return null;

  return {
    invoice: invoice.data,
    lines: lines.data ?? [],
    companyName: company.data.name,
    chargesVat: company.data.vat_regime === "subject",
    missingCompanyDetails: listMissingQuoteDetails(company.data),
    priceItems: priceItems.data ?? [],
  };
}

export type EditorInvoice = NonNullable<Awaited<ReturnType<typeof getInvoiceForEditor>>>;

// The customer has no account: the token is their only credential. Drafts are never shown.
export async function getPublicInvoice(token: string) {
  if (!TOKEN_PATTERN.test(token)) return null;
  const supabase = createAdminClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select(`${INVOICE_COLUMNS}, quote:quotes(number, sent_at)`)
    .eq("public_token", token)
    .in("status", ["issued", "paid"])
    .maybeSingle();
  if (!invoice?.company_snapshot) return null;

  const { data: lines } = await supabase.from("invoice_lines").select(LINE_COLUMNS).eq("invoice_id", invoice.id).order("position");
  const company = invoice.company_snapshot as CompanySnapshot;
  return { invoice, lines: lines ?? [], company, logoUrl: await logoUrl(company.logo_path) };
}

export type PublicInvoice = NonNullable<Awaited<ReturnType<typeof getPublicInvoice>>>;
