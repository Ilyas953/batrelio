import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WEBHOOK_PATHS, readVerifiedWebhook } from "@/lib/telephony";
import { findGreetingAudioUrl, prepareGreetingAudio } from "@/lib/telephony/greeting-audio";
import { toPlayResponse, toVoiceResponse } from "@/lib/telephony/messages";
import {
  ANSWERING_COMPANY_COLUMNS,
  type GreetingVariant,
  greetingText,
  greetingVariantsForCaller,
  handleMissedCall,
  isExcludedCaller,
  isKnownCaller,
} from "@/lib/telephony/missed-call";
import { liveReadingVoice } from "@/lib/telephony/voices";

const UNASSIGNED_NUMBER_MESSAGE = "Ce numéro n'est pas attribué. Merci de votre appel.";

function twimlResponse(twiml: string): Response {
  return new Response(twiml, { headers: { "Content-Type": "text/xml; charset=utf-8" } });
}

function voiceResponse(text: string, voiceId?: string | null): Response {
  return twimlResponse(toVoiceResponse(text, voiceId));
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

  // The caller is waiting in silence: whether the number is excluded or already known, and the
  // recorded greeting(s), are looked up together. Only a stranger is told about an SMS.
  // The greeting recorded beforehand when it is ready; otherwise read live, and recorded for next time.
  const variants = greetingVariantsForCaller(company, params.From);
  const findAudio = (variant: GreetingVariant) => findGreetingAudioUrl(company, variant).catch(() => null);
  const [isExcluded, isKnown, audioIfUnknown, audioIfKnown] = await Promise.all([
    isExcludedCaller(company.id, params.From),
    isKnownCaller(company.id, params.From),
    findAudio(variants.ifUnknown),
    variants.ifKnown === variants.ifUnknown ? null : findAudio(variants.ifKnown),
  ]);
  const variant = isExcluded || isKnown ? variants.ifKnown : variants.ifUnknown;
  const audioUrl = variant === variants.ifUnknown ? audioIfUnknown : audioIfKnown;

  after(() =>
    handleMissedCall({ company, callSid: params.CallSid, callerPhone: params.From, isExcluded, isKnown, siteUrl }).catch(
      (error) => console.error(`Appel manqué ${params.CallSid} non traité :`, error),
    ),
  );

  if (audioUrl) return twimlResponse(toPlayResponse(audioUrl));

  after(() => prepareGreetingAudio(company).catch((error) => console.error("Message d'accueil non préparé :", error)));
  return voiceResponse(greetingText(variant, company), liveReadingVoice(company.greeting_voice));
}
