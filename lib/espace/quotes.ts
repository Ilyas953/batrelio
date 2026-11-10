import "server-only";
import { requireUser } from "@/lib/auth/session";

const SIGNED_QUOTES_SHOWN = 50;
const INVOICES_SHOWN = 100;

const QUOTE_COLUMNS =
  "id, title, total_cents, deposit_cents, sent_at, signed_at, deposit_paid_at, updated_at, request:requests(customer_name)";

// The Devis tab: drafts to finish, quotes awaiting signature, signed quotes. RLS: the artisan's own only.
export async function getQuotesOverview() {
  const { supabase } = await requireUser();
  const [drafts, sent, signed, invoices] = await Promise.all([
    supabase.from("quotes").select(QUOTE_COLUMNS).eq("status", "draft").order("updated_at", { ascending: false }),
    supabase.from("quotes").select(QUOTE_COLUMNS).eq("status", "sent").order("sent_at", { ascending: false }),
    supabase
      .from("quotes")
      .select(QUOTE_COLUMNS)
      .eq("status", "signed")
      .order("signed_at", { ascending: false })
      .limit(SIGNED_QUOTES_SHOWN),
    supabase
      .from("invoices")
      .select("id, number, status, title, customer_name, total_cents, deposit_received_cents, issued_at, paid_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(INVOICES_SHOWN),
  ]);
  for (const result of [drafts, sent, signed, invoices]) if (result.error) throw result.error;

  return { drafts: drafts.data ?? [], sent: sent.data ?? [], signed: signed.data ?? [], invoices: invoices.data ?? [] };
}

export type ListedQuote = Awaited<ReturnType<typeof getQuotesOverview>>["drafts"][number];
export type ListedInvoice = Awaited<ReturnType<typeof getQuotesOverview>>["invoices"][number];
