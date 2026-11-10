import "server-only";
import { requireUser } from "@/lib/auth/session";
import { listMissingQuoteDetails } from "@/lib/company/legal";
import { logoUrl } from "@/lib/company/logo";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CompanySnapshot } from "./company-snapshot";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_PATTERN = /^[0-9a-f]{32}$/;

const QUOTE_COLUMNS =
  "id, request_id, status, number, public_token, title, customer_name, customer_address, subtotal_cents, vat_cents, total_cents, deposit_percent, deposit_cents, validity_days, work_start_date, work_duration, waste_management, notes, ai_notes, sent_at, company_snapshot";

const LINE_COLUMNS = "id, position, category, designation, quantity, unit, unit_price_cents, vat_rate_bp";

// RLS restricts the quote, its lines and the company to the artisan's own.
export async function getQuoteForEditor(quoteId: string) {
  if (!UUID_PATTERN.test(quoteId)) return null;
  const { supabase } = await requireUser();

  const [quote, lines, company, priceItems] = await Promise.all([
    supabase
      .from("quotes")
      .select(`${QUOTE_COLUMNS}, request:requests(customer_phone), invoices(id, number, status, total_cents)`)
      .eq("id", quoteId)
      .maybeSingle(),
    supabase.from("quote_lines").select(LINE_COLUMNS).eq("quote_id", quoteId).order("position"),
    supabase.from("companies").select("*").maybeSingle(),
    // "Mes prix", offered while typing a line, most used first.
    supabase
      .from("price_items")
      .select("id, category, designation, unit, unit_price_cents, vat_rate_bp")
      .order("use_count", { ascending: false })
      .limit(300),
  ]);
  if (quote.error) throw quote.error;
  if (!quote.data || !company.data) return null;

  return {
    quote: quote.data,
    lines: lines.data ?? [],
    companyName: company.data.name,
    quoteMessage: company.data.quote_message,
    chargesVat: company.data.vat_regime === "subject",
    missingCompanyDetails: listMissingQuoteDetails(company.data),
    priceItems: priceItems.data ?? [],
  };
}

export type EditorQuote = NonNullable<Awaited<ReturnType<typeof getQuoteForEditor>>>;

// Customers have no account: the quote token is their only credential, checked here with the
// secret key. Drafts are never shown.
export async function getPublicQuote(token: string) {
  if (!TOKEN_PATTERN.test(token)) return null;
  const supabase = createAdminClient();

  const { data: quote, error } = await supabase
    .from("quotes")
    .select(QUOTE_COLUMNS)
    .eq("public_token", token)
    .neq("status", "draft")
    .maybeSingle();
  if (error) throw error;
  if (!quote || !quote.company_snapshot) return null;

  const { data: lines } = await supabase.from("quote_lines").select(LINE_COLUMNS).eq("quote_id", quote.id).order("position");

  const company = quote.company_snapshot as CompanySnapshot;
  return { quote, lines: lines ?? [], company, logoUrl: await logoUrl(company.logo_path) };
}

export type PublicQuote = NonNullable<Awaited<ReturnType<typeof getPublicQuote>>>;
