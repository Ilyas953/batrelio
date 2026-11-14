import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WEBHOOK_PATHS, readVerifiedWebhook } from "@/lib/telephony";
import { findGreetingAudioUrl, prepareGreetingAudio } from "@/lib/telephony/greeting-audio";
import { toPlayResponse, toVoiceResponse } from "@/lib/telephony/messages";
import {
  ANSWERING_COMPANY_COLUMNS,
  type GreetingVariant,
  greetingText,
  greetingVariantsByExclusion,
  handleMissedCall,
  isExcludedCaller,
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

  // The caller is waiting in silence: the exclusion and the recorded greeting(s) are looked up together.
  // The greeting recorded beforehand when it is ready; otherwise read live, and recorded for next time.
  const variants = greetingVariantsByExclusion(company, params.From);
  const findAudio = (variant: GreetingVariant) => findGreetingAudioUrl(company, variant).catch(() => null);
  const [isExcluded, audioIfNotExcluded, audioIfExcluded] = await Promise.all([
    isExcludedCaller(company.id, params.From),
    findAudio(variants.notExcluded),
    variants.excluded === variants.notExcluded ? null : findAudio(variants.excluded),
  ]);
  const variant = isExcluded ? variants.excluded : variants.notExcluded;
  const audioUrl = variant === variants.notExcluded ? audioIfNotExcluded : audioIfExcluded;

  after(() =>
    handleMissedCall({ company, callSid: params.CallSid, callerPhone: params.From, isExcluded, siteUrl }).catch(
      (error) => console.error(`Appel manqué ${params.CallSid} non traité :`, error),
    ),
  );

  if (audioUrl) return twimlResponse(toPlayResponse(audioUrl));

  after(() => prepareGreetingAudio(company).catch((error) => console.error("Message d'accueil non préparé :", error)));
  return voiceResponse(greetingText(variant, company), liveReadingVoice(company.greeting_voice));
}
