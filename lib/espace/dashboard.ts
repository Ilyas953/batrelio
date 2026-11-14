import "server-only";
import { listMissingQuoteDetails } from "@/lib/company/legal";
import { decideArtisanSms } from "@/lib/requests/artisan-sms";
import { isTestAccount, requireUser } from "@/lib/auth/session";
import { computeSetupSteps } from "./setup";
import { MISSED_CALLS_SHOWN_DAYS, groupMissedCalls } from "./missed-calls";
import { PHOTO_BUCKET } from "@/lib/requests/limits";

const DAY_MS = 24 * 60 * 60 * 1000;

const RECENT_HANDLED_REQUESTS = 10;
const PHOTO_PREVIEWS_PER_REQUEST = 3;
const PHOTO_PREVIEW_LIFETIME_SECONDS = 60 * 60;

function countSetupSteps(...args: Parameters<typeof computeSetupSteps>) {
  const steps = computeSetupSteps(...args);
  return { doneCount: steps.filter((step) => step.done).length, total: steps.length };
}

function smsBlocker(contactPhone: string | null, isTest: boolean) {
  const decision = decideArtisanSms(contactPhone, isTest);
  return decision === "skipped_no_phone" || decision === "skipped_not_mobile" ? decision : null;
}

// Everything the artisan needs at a glance. RLS restricts every query to their own company.
export async function getDashboard() {
  const { supabase, claims } = await requireUser();

  const missedSince = new Date(Date.now() - MISSED_CALLS_SHOWN_DAYS * DAY_MS).toISOString();
  const [company, newRequests, missedCallRequests, handledRequests, pendingQuotes, signedQuotes, calls] = await Promise.all([
    supabase.from("companies").select("*").maybeSingle(),
    // Requests received: the customer described their need.
    supabase
      .from("requests")
      .select(
        "id, source, customer_name, customer_phone, description, address, submitted_at, photos:request_photos(storage_path, created_at), quotes(id, status)",
      )
      .eq("status", "new")
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false }),
    // Missed calls to return: the customer called but has not described anything yet.
    supabase
      .from("requests")
      .select("id, customer_phone, created_at, missed_calls(sms_status, created_at)")
      .eq("status", "new")
      .eq("source", "missed_call")
      .is("submitted_at", null)
      .gte("created_at", missedSince)
      .order("created_at", { ascending: false }),
    supabase
      .from("requests")
      .select("id, status, customer_name, customer_phone, description, visit_at, created_at")
      .neq("status", "new")
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(RECENT_HANDLED_REQUESTS),
    // The quotes themselves are listed in the Devis tab: only their counts are shown here.
    supabase.from("quotes").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("quotes").select("id", { count: "exact", head: true }).eq("status", "signed"),
    supabase.from("missed_calls").select("id", { count: "exact", head: true }),
  ]);

  for (const result of [company, newRequests, missedCallRequests, handledRequests, pendingQuotes, signedQuotes]) {
    if (result.error) throw result.error;
  }

  const requests = newRequests.data ?? [];
  const previewPaths = requests.map((request) =>
    request.photos
      .toSorted((a, b) => a.created_at.localeCompare(b.created_at))
      .slice(0, PHOTO_PREVIEWS_PER_REQUEST)
      .map((photo) => photo.storage_path),
  );
  // One call signs every preview on the page.
  const allPaths = previewPaths.flat();
  const { data: signed } = allPaths.length
    ? await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(allPaths, PHOTO_PREVIEW_LIFETIME_SECONDS)
    : { data: [] };
  const urlByPath = new Map((signed ?? []).flatMap((photo) => (photo.path && photo.signedUrl ? [[photo.path, photo.signedUrl]] : [])));

  return {
    companyName: company.data?.name ?? null,
    missingQuoteDetails: company.data ? listMissingQuoteDetails(company.data) : [],
    setup: company.data ? countSetupSteps(company.data, (calls.count ?? 0) > 0) : null,
    autoReply: company.data
      ? { phoneNumber: company.data.phone_number, enabled: company.data.auto_reply_enabled }
      : null,
    newRequests: requests.map(({ quotes, ...request }, index) => ({
      ...request,
      draftQuoteId: quotes.find((quote) => quote.status === "draft")?.id ?? null,
      photoCount: request.photos.length,
      photoPreviews: previewPaths[index].flatMap((path) => urlByPath.get(path) ?? []),
    })),
    missedCalls: groupMissedCalls(missedCallRequests.data ?? []),
    handledRequests: handledRequests.data ?? [],
    // Why the artisan would not get an SMS for a new request, if they would not.
    newRequestSmsBlocker: company.data ? smsBlocker(company.data.contact_phone, isTestAccount(claims.app_metadata)) : null,
    quoteCounts: { pending: pendingQuotes.count ?? 0, signed: signedQuotes.count ?? 0 },
  };
}

export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;
export type NewRequest = Dashboard["newRequests"][number];
export type HandledRequest = Dashboard["handledRequests"][number];
