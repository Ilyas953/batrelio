import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WEBHOOK_PATHS, readVerifiedWebhook } from "@/lib/telephony";
import {
  greetingForHiddenCaller,
  greetingWithSms,
  greetingWithoutSms,
  toVoiceResponse,
} from "@/lib/telephony/messages";
import { decideSms, handleMissedCall, isExcludedCaller } from "@/lib/telephony/missed-call";

const UNASSIGNED_NUMBER_MESSAGE = "Ce numéro n'est pas attribué. Merci de votre appel.";

function voiceResponse(text: string): Response {
  return new Response(toVoiceResponse(text), { headers: { "Content-Type": "text/xml; charset=utf-8" } });
}

// A forwarded missed call reaches the artisan's Batrelio number: greet the caller right away,
// then create the request and send the SMS once the response is gone.
export async function POST(request: Request) {
  const webhook = await readVerifiedWebhook(request, WEBHOOK_PATHS.voice);
  if (!webhook) return new Response("Signature invalide", { status: 403 });

  const { params, siteUrl } = webhook;
  const { data: company } = await createAdminClient()
    .from("companies")
    .select("id, name, sms_sender_name, sms_sender_approved, auto_reply_enabled, contact_phone")
    .eq("phone_number", params.To ?? "")
    .maybeSingle();
  if (!company || !params.CallSid) return voiceResponse(UNASSIGNED_NUMBER_MESSAGE);

  const isExcluded = await isExcludedCaller(company.id, params.From);
  after(() =>
    handleMissedCall({ company, callSid: params.CallSid, callerPhone: params.From, isExcluded, siteUrl }).catch(
      (error) => console.error(`Appel manqué ${params.CallSid} non traité :`, error),
    ),
  );

  const decision = decideSms(company, params.From, isExcluded);
  if (decision === "send") return voiceResponse(greetingWithSms(company.name));
  if (decision === "skipped_anonymous") return voiceResponse(greetingForHiddenCaller(company.name));
  return voiceResponse(greetingWithoutSms(company.name));
}
