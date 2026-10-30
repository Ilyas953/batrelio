import "server-only";
import { requireUser } from "@/lib/auth/session";
import { listMissingQuoteDetails } from "@/lib/company/legal";

const RECENT_SIGNED_QUOTES = 5;

const QUOTE_COLUMNS =
  "id, total_cents, deposit_cents, sent_at, signed_at, deposit_paid_at, request:requests(customer_name, customer_phone)";

// Everything the artisan needs at a glance. RLS restricts every query to their own company.
export async function getDashboard() {
  const { supabase } = await requireUser();

  const [company, newRequests, pendingQuotes, signedQuotes] = await Promise.all([
    supabase.from("companies").select("*").maybeSingle(),
    supabase
      .from("requests")
      .select("id, source, customer_name, customer_phone, description, address, created_at, photos:request_photos(count), calls:missed_calls(sms_status, created_at)")
      .eq("status", "new")
      .order("created_at", { ascending: false }),
    supabase
      .from("quotes")
      .select(QUOTE_COLUMNS)
      .eq("status", "sent")
      .order("sent_at", { ascending: false }),
    supabase
      .from("quotes")
      .select(QUOTE_COLUMNS)
      .eq("status", "signed")
      .order("signed_at", { ascending: false })
      .limit(RECENT_SIGNED_QUOTES),
  ]);

  for (const result of [company, newRequests, pendingQuotes, signedQuotes]) {
    if (result.error) throw result.error;
  }

  return {
    companyName: company.data?.name ?? null,
    missingQuoteDetails: company.data ? listMissingQuoteDetails(company.data) : [],
    autoReply: company.data
      ? { phoneNumber: company.data.phone_number, enabled: company.data.auto_reply_enabled }
      : null,
    newRequests: newRequests.data ?? [],
    pendingQuotes: pendingQuotes.data ?? [],
    signedQuotes: signedQuotes.data ?? [],
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;
export type NewRequest = Dashboard["newRequests"][number];
export type DashboardQuote = Dashboard["pendingQuotes"][number];
