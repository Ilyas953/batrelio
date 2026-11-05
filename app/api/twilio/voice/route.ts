import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WEBHOOK_PATHS, readVerifiedWebhook } from "@/lib/telephony";
import { toVoiceResponse } from "@/lib/telephony/messages";
import {
  ANSWERING_COMPANY_COLUMNS,
  chooseGreeting,
  decideSms,
  handleMissedCall,
  isExcludedCaller,
} from "@/lib/telephony/missed-call";

const UNASSIGNED_NUMBER_MESSAGE = "Ce numéro n'est pas attribué. Merci de votre appel.";

function voiceResponse(text: string, voiceId?: string | null): Response {
  return new Response(toVoiceResponse(text, voiceId), { headers: { "Content-Type": "text/xml; charset=utf-8" } });
}

// A forwarded missed call reaches the artisan's Batrelio number: greet the caller right away,
// then create the request and send the SMS once the response is gone.
export async function POST(request: Request) {
  const webhook = await readVerifiedWebhook(request, WEBHOOK_PATHS.voice);
  if (!webhook) return new Response("Signature invalide", { status: 403 });

  const { params, siteUrl } = webhook;
  const { data: company } = await createAdminClient()
    .from("companies")
    .select(ANSWERING_COMPANY_COLUMNS)
    .eq("phone_number", params.To ?? "")
    .maybeSingle();
  if (!company || !params.CallSid) return voiceResponse(UNASSIGNED_NUMBER_MESSAGE);

  const isExcluded = await isExcludedCaller(company.id, params.From);
  after(() =>
    handleMissedCall({ company, callSid: params.CallSid, callerPhone: params.From, isExcluded, siteUrl }).catch(
      (error) => console.error(`Appel manqué ${params.CallSid} non traité :`, error),
    ),
  );

  return voiceResponse(chooseGreeting(decideSms(company, params.From, isExcluded), company), company.greeting_voice);
}
