import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";
import { chooseSmsSender, sendSms } from "./index";
import { missedCallSms } from "./messages";
import { isFrenchMobile, isIdentifiedCaller } from "./phone-rules";
import type { SmsStatus } from "./sms-status";

const RECENT_CALL_WINDOW_MS = 24 * 60 * 60 * 1000;

export type AnsweringCompany = Pick<
  Tables<"companies">,
  "id" | "name" | "sms_sender_name" | "sms_sender_approved" | "auto_reply_enabled" | "contact_phone"
>;

type SmsDecision = "send" | Exclude<SmsStatus, "pending" | "sent" | "delivered" | "failed" | "skipped_recent">;

type Admin = ReturnType<typeof createAdminClient>;

// Numbers the artisan chose never to auto-reply to (family, suppliers…).
export async function isExcludedCaller(companyId: string, callerPhone: string | undefined): Promise<boolean> {
  if (!isIdentifiedCaller(callerPhone)) return false;
  const { count } = await createAdminClient()
    .from("auto_reply_exclusions")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("phone", callerPhone);
  return (count ?? 0) > 0;
}

// Called while the greeting plays: decides whether this caller gets an SMS.
export function decideSms(company: AnsweringCompany, callerPhone: string | undefined, isExcluded: boolean): SmsDecision {
  if (!isIdentifiedCaller(callerPhone)) return "skipped_anonymous";
  if (callerPhone === company.contact_phone) return "skipped_own_number";
  if (isExcluded) return "skipped_excluded";
  if (!company.auto_reply_enabled) return "skipped_disabled";
  if (!isFrenchMobile(callerPhone)) return "skipped_not_mobile";
  return "send";
}

async function findRecentRequestId(supabase: Admin, companyId: string, callerPhone: string): Promise<string | null> {
  const since = new Date(Date.now() - RECENT_CALL_WINDOW_MS).toISOString();
  const { data } = await supabase
    .from("missed_calls")
    .select("request_id")
    .eq("company_id", companyId)
    .eq("caller_phone", callerPhone)
    .not("request_id", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.request_id ?? null;
}

async function createRequestWithLink(supabase: Admin, companyId: string, callerPhone: string) {
  const { data: request, error } = await supabase
    .from("requests")
    .insert({ company_id: companyId, source: "missed_call", customer_phone: callerPhone })
    .select("id")
    .single();
  if (error) throw error;

  const { data: link, error: linkError } = await supabase
    .from("request_links")
    .insert({ company_id: companyId, customer_phone: callerPhone, request_id: request.id })
    .select("token")
    .single();
  if (linkError) throw linkError;

  return { requestId: request.id, token: link.token };
}

// Runs after the provider got the greeting. Every outcome is recorded in missed_calls,
// so the artisan sees the call even when no SMS could be sent.
export async function handleMissedCall(params: {
  company: AnsweringCompany;
  callSid: string;
  callerPhone: string | undefined;
  isExcluded: boolean;
  siteUrl: string;
}): Promise<void> {
  const { company, callSid, siteUrl } = params;
  const callerPhone = isIdentifiedCaller(params.callerPhone) ? params.callerPhone : null;
  const supabase = createAdminClient();

  // The unique call id makes a retried webhook a no-op.
  const { data: call, error } = await supabase
    .from("missed_calls")
    .insert({ company_id: company.id, call_sid: callSid, caller_phone: callerPhone })
    .select("id")
    .single();
  if (error) return;

  const recordOutcome = (fields: { sms_status: SmsStatus; request_id?: string; sms_sid?: string }) =>
    supabase.from("missed_calls").update(fields).eq("id", call.id);

  if (!callerPhone) {
    await recordOutcome({ sms_status: "skipped_anonymous" });
    return;
  }

  const decision = decideSms(company, callerPhone, params.isExcluded);
  // Not a customer: no request in "À traiter", only the line in the call history.
  if (decision === "skipped_own_number" || decision === "skipped_excluded") {
    await recordOutcome({ sms_status: decision });
    return;
  }

  const recentRequestId = await findRecentRequestId(supabase, company.id, callerPhone);
  if (recentRequestId) {
    await recordOutcome({ sms_status: "skipped_recent", request_id: recentRequestId });
    return;
  }

  // The artisan sees every customer in "À traiter", SMS or not, to call them back.
  const { requestId, token } = await createRequestWithLink(supabase, company.id, callerPhone);
  if (decision !== "send") {
    await recordOutcome({ sms_status: decision, request_id: requestId });
    return;
  }

  const body = missedCallSms(company.name, `${siteUrl}/demande/${token}`);
  const sms = await sendSms(callerPhone, chooseSmsSender(company), body, siteUrl);
  await recordOutcome(
    sms.status === "sent"
      ? { sms_status: "sent", sms_sid: sms.sid, request_id: requestId }
      : { sms_status: "failed", request_id: requestId },
  );
  if (sms.status === "failed") console.error(`SMS non envoyé pour l'appel ${callSid} : ${sms.reason}`);
}
