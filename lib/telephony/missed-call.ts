import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";
import { chooseSmsSender, sendSms } from "./index";
import { missedCallSms } from "./messages";
import { isFrenchMobile, isIdentifiedCaller } from "./phone-rules";

const RECENT_CALL_WINDOW_MS = 24 * 60 * 60 * 1000;

export type AnsweringCompany = Pick<
  Tables<"companies">,
  "id" | "name" | "sms_sender_name" | "sms_sender_approved" | "auto_reply_enabled" | "contact_phone"
>;

type SmsDecision = "send" | Exclude<Tables<"missed_calls">["sms_status"], "pending" | "sent" | "delivered" | "failed">;

// Called while the greeting plays: decides whether this caller gets an SMS.
export function decideSms(company: AnsweringCompany, callerPhone: string | undefined): SmsDecision {
  if (!isIdentifiedCaller(callerPhone)) return "skipped_anonymous";
  if (callerPhone === company.contact_phone) return "skipped_own_number";
  if (!company.auto_reply_enabled) return "skipped_disabled";
  if (!isFrenchMobile(callerPhone)) return "skipped_not_mobile";
  return "send";
}

type Admin = ReturnType<typeof createAdminClient>;

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

  const recordOutcome = (fields: Partial<Tables<"missed_calls">>) =>
    supabase.from("missed_calls").update(fields).eq("id", call.id);

  if (!callerPhone) {
    await recordOutcome({ sms_status: "skipped_anonymous" });
    return;
  }

  const recentRequestId = await findRecentRequestId(supabase, company.id, callerPhone);
  if (recentRequestId) {
    await recordOutcome({ sms_status: "skipped_recent", request_id: recentRequestId });
    return;
  }

  const decision = decideSms(company, callerPhone);
  if (decision === "skipped_own_number") {
    await recordOutcome({ sms_status: decision });
    return;
  }

  // The artisan sees every identified caller in "À traiter", SMS or not, to call them back.
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
