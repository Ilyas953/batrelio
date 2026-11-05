import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  chooseGreeting,
  decideSms,
  handleMissedCall,
  isExcludedCaller,
  type MissedCallOutcome,
  type SmsDelivery,
} from "@/lib/telephony/missed-call";

export type SimulatedCall = { greeting: string; outcome: MissedCallOutcome };

// Nothing leaves: the SMS is shown on screen instead of being sent.
const showSmsInstead: SmsDelivery = async () => ({ status: "sent", sid: `SIM-${randomUUID()}` });

// Runs a missed call through the real pipeline (greeting choice, request, link, call history),
// as if the provider had forwarded it to the company's number.
export async function simulateMissedCall(companyId: string, callerPhone: string | undefined, siteUrl: string) {
  const { data: company, error } = await createAdminClient()
    .from("companies")
    .select("id, name, sms_sender_name, sms_sender_approved, auto_reply_enabled, contact_phone")
    .eq("id", companyId)
    .single();
  if (error) throw error;

  const isExcluded = await isExcludedCaller(company.id, callerPhone);
  const greeting = chooseGreeting(decideSms(company, callerPhone, isExcluded), company.name);
  const outcome = await handleMissedCall({
    company,
    callSid: `SIM-${randomUUID()}`,
    callerPhone,
    isExcluded,
    siteUrl,
    deliverSms: showSmsInstead,
  });
  if (!outcome) throw new Error("L'appel simulé n'a pas pu être enregistré.");

  return { greeting, outcome } satisfies SimulatedCall;
}
