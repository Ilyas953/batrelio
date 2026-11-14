import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";
import { chooseSmsSender, sendSms, type SentSms } from "./index";
import { greetingForHiddenCaller, greetingWithSms, greetingWithoutSms, missedCallSms } from "./messages";
import { isFrenchMobile, isIdentifiedCaller } from "./phone-rules";
import type { SmsStatus } from "./sms-status";

const RECENT_CALL_WINDOW_MS = 24 * 60 * 60 * 1000;

export type AnsweringCompany = Pick<
  Tables<"companies">,
  "id" | "name" | "sms_sender_name" | "sms_sender_approved" | "auto_reply_enabled" | "contact_phone" | "greeting_intro" | "phone_number"
>;

// Columns to read for a call: the voice is only needed to answer it.
export const ANSWERING_COMPANY_COLUMNS =
  "id, name, sms_sender_name, sms_sender_approved, auto_reply_enabled, contact_phone, greeting_intro, greeting_voice, phone_number";

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
  // The artisan's own phone, or the setup test call placed from their Batrelio number.
  if (callerPhone === company.contact_phone || callerPhone === company.phone_number) return "skipped_own_number";
  if (isExcluded) return "skipped_excluded";
  if (!company.auto_reply_enabled) return "skipped_disabled";
  if (!isFrenchMobile(callerPhone)) return "skipped_not_mobile";
  return "send";
}

export type GreetingVariant = "withSms" | "withoutSms" | "hiddenCaller";

export function chooseGreetingVariant(decision: SmsDecision): GreetingVariant {
  if (decision === "send") return "withSms";
  if (decision === "skipped_anonymous") return "hiddenCaller";
  return "withoutSms";
}

// The greeting this caller hears, depending on whether the artisan excluded their number.
// Known before the exclusion is looked up, so both lookups can run while the caller waits.
export function greetingVariantsByExclusion(
  company: AnsweringCompany,
  callerPhone: string | undefined,
): Record<"excluded" | "notExcluded", GreetingVariant> {
  return {
    excluded: chooseGreetingVariant(decideSms(company, callerPhone, true)),
    notExcluded: chooseGreetingVariant(decideSms(company, callerPhone, false)),
  };
}

type GreetingCompany = Pick<AnsweringCompany, "name" | "greeting_intro">;

const GREETING_BUILDERS: Record<GreetingVariant, (companyName: string, intro?: string | null) => string> = {
  withSms: greetingWithSms,
  withoutSms: greetingWithoutSms,
  hiddenCaller: greetingForHiddenCaller,
};

export function greetingText(variant: GreetingVariant, company: GreetingCompany): string {
  return GREETING_BUILDERS[variant](company.name, company.greeting_intro);
}

// What the caller hears, decided before the request is created.
export function chooseGreeting(decision: SmsDecision, company: GreetingCompany): string {
  return greetingText(chooseGreetingVariant(decision), company);
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

export type SmsDelivery = (to: string, from: string, body: string, siteUrl: string) => Promise<SentSms>;

// What happened to the call, for the simulator. Null when the call was already handled.
export type MissedCallOutcome = {
  status: SmsStatus;
  sms?: { from: string; body: string; requestUrl: string };
};

// Runs after the provider got the greeting. Every outcome is recorded in missed_calls,
// so the artisan sees the call even when no SMS could be sent.
// The simulator passes its own deliverSms: everything else runs exactly as for a real call.
export async function handleMissedCall(params: {
  company: AnsweringCompany;
  callSid: string;
  callerPhone: string | undefined;
  isExcluded: boolean;
  siteUrl: string;
  deliverSms?: SmsDelivery;
}): Promise<MissedCallOutcome | null> {
  const { company, callSid, siteUrl, deliverSms = sendSms } = params;
  const callerPhone = isIdentifiedCaller(params.callerPhone) ? params.callerPhone : null;
  const supabase = createAdminClient();

  // The unique call id makes a retried webhook a no-op.
  const { data: call, error } = await supabase
    .from("missed_calls")
    .insert({ company_id: company.id, call_sid: callSid, caller_phone: callerPhone })
    .select("id")
    .single();
  if (error) return null;

  const recordOutcome = async (fields: { sms_status: SmsStatus; request_id?: string; sms_sid?: string }) => {
    await supabase.from("missed_calls").update(fields).eq("id", call.id);
    return { status: fields.sms_status };
  };

  if (!callerPhone) return recordOutcome({ sms_status: "skipped_anonymous" });

  const decision = decideSms(company, callerPhone, params.isExcluded);
  // Not a customer: no request in "À traiter", only the line in the call history.
  if (decision === "skipped_own_number" || decision === "skipped_excluded") {
    return recordOutcome({ sms_status: decision });
  }

  const recentRequestId = await findRecentRequestId(supabase, company.id, callerPhone);
  if (recentRequestId) return recordOutcome({ sms_status: "skipped_recent", request_id: recentRequestId });

  // The artisan sees every customer in "À traiter", SMS or not, to call them back.
  const { requestId, token } = await createRequestWithLink(supabase, company.id, callerPhone);
  if (decision !== "send") return recordOutcome({ sms_status: decision, request_id: requestId });

  const requestUrl = `${siteUrl}/demande/${token}`;
  const from = chooseSmsSender(company);
  const body = missedCallSms(company.name, requestUrl);
  const sms = await deliverSms(callerPhone, from, body, siteUrl);
  if (sms.status === "failed") {
    console.error(`SMS non envoyé pour l'appel ${callSid} : ${sms.reason}`);
    return recordOutcome({ sms_status: "failed", request_id: requestId });
  }

  await recordOutcome({ sms_status: "sent", sms_sid: sms.sid, request_id: requestId });
  return { status: "sent", sms: { from, body, requestUrl } };
}
