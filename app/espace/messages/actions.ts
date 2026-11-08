"use server";

import { isTestAccount, requireUser } from "@/lib/auth/session";
import { toE164Phone } from "@/lib/company/legal";
import { MAX_QUOTE_MESSAGE_LENGTH, defaultQuoteMessage } from "@/lib/quotes/share-message";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { playGreetingByPhone } from "@/lib/telephony";
import { MAX_GREETING_INTRO_LENGTH, defaultGreetingIntro, greetingWithSms, toVoiceResponse } from "@/lib/telephony/messages";
import { synthesizeSpeech } from "@/lib/speech";
import { refreshGreetingAudioLater } from "@/lib/telephony/refresh-greeting";
import { findGreetingVoice, isGreetingVoiceId, type GreetingVoiceId } from "@/lib/telephony/voices";

export type MessageFormState = { error?: string; saved?: boolean; called?: boolean };

const GREETING_PREVIEWS_PER_DAY = 5;
// Listening in the page costs a fraction of a cent: generous, only against abuse.
const GREETING_LISTENS_PER_DAY = 100;
const DAY_SECONDS = 24 * 60 * 60;

type GreetingInput = { voice: GreetingVoiceId; intro: string };

function readGreeting(formData: FormData): GreetingInput | { error: string } {
  const voice = String(formData.get("voice") ?? "");
  const intro = String(formData.get("intro") ?? "").replace(/\s+/g, " ").trim();
  if (!isGreetingVoiceId(voice)) return { error: "Choisissez une voix." };
  if (intro.length > MAX_GREETING_INTRO_LENGTH) {
    return { error: `Votre message est trop long (${MAX_GREETING_INTRO_LENGTH} caractères au maximum).` };
  }
  return { voice, intro };
}

// The default is stored as null: it then follows the company name and future improvements.
function toStoredText(text: string, defaultText: string): string | null {
  return text && text !== defaultText ? text : null;
}

export async function saveGreeting(_previous: MessageFormState, formData: FormData): Promise<MessageFormState> {
  const { supabase } = await requireUser();
  const input = readGreeting(formData);
  if ("error" in input) return input;

  const { data: company } = await supabase.from("companies").select("id, name").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };

  // RLS and column privileges: only the artisan's own messages can change.
  const { error } = await supabase
    .from("companies")
    .update({ greeting_voice: input.voice, greeting_intro: toStoredText(input.intro, defaultGreetingIntro(company.name)) })
    .eq("id", company.id);
  if (error) return { error: "Le message n'a pas pu être enregistré. Réessayez." };
  refreshGreetingAudioLater(company.id);
  return { saved: true };
}

export async function saveQuoteMessage(_previous: MessageFormState, formData: FormData): Promise<MessageFormState> {
  const { supabase } = await requireUser();
  const message = String(formData.get("message") ?? "").replace(/\s+/g, " ").trim();
  if (message.length > MAX_QUOTE_MESSAGE_LENGTH) {
    return { error: `Votre message est trop long (${MAX_QUOTE_MESSAGE_LENGTH} caractères au maximum).` };
  }

  const { data: company } = await supabase.from("companies").select("id, name").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };

  const { error } = await supabase
    .from("companies")
    .update({ quote_message: toStoredText(message, defaultQuoteMessage(company.name)) })
    .eq("id", company.id);
  if (error) return { error: "Le message n'a pas pu être enregistré. Réessayez." };
  return { saved: true };
}

// Plays the greeting being edited (saved or not), with the chosen voice, on the artisan's phone.
export async function previewGreeting(_previous: MessageFormState, formData: FormData): Promise<MessageFormState> {
  const { supabase, claims } = await requireUser();
  const input = readGreeting(formData);
  if ("error" in input) return input;

  if (isTestAccount(claims.app_metadata)) {
    return { error: "En compte de test, le numéro est fictif : l'appel d'écoute se fait depuis un compte avec un vrai numéro." };
  }

  const { data: company } = await supabase.from("companies").select("id, name, phone_number, phone_number_sid").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };
  if (!company.phone_number || !company.phone_number_sid) {
    return { error: "Activez d'abord votre numéro Batrelio : c'est lui qui vous appelle." };
  }

  const to = toE164Phone(String(formData.get("phone") ?? ""));
  if (!to?.startsWith("+33")) return { error: "Indiquez un numéro de téléphone français." };

  // Each call is billed: a few listens a day are plenty.
  const allowed = await consumeRateLimit("greetingPreview", company.id, {
    limit: GREETING_PREVIEWS_PER_DAY,
    windowSeconds: DAY_SECONDS,
  });
  if (!allowed) return { error: `Vous avez déjà écouté votre message ${GREETING_PREVIEWS_PER_DAY} fois aujourd'hui. Réessayez demain.` };

  const twiml = toVoiceResponse(greetingWithSms(company.name, input.intro), input.voice);
  const call = await playGreetingByPhone(to, company.phone_number, twiml);
  if (call.status === "failed") {
    console.error(`Appel d'écoute impossible : ${call.reason}`);
    return { error: "L'appel n'a pas pu partir. Réessayez dans un instant." };
  }
  return { called: true };
}

export type GreetingAudio = { mp3Base64: string } | { error: string };

// The greeting being edited (saved or not), read by the chosen voice, to play in the page.
export async function listenToGreeting(voiceId: string, intro: string): Promise<GreetingAudio> {
  const { supabase } = await requireUser();
  const formData = new FormData();
  formData.set("voice", voiceId);
  formData.set("intro", intro);
  const input = readGreeting(formData);
  if ("error" in input) return input;

  const { data: company } = await supabase.from("companies").select("id, name").maybeSingle();
  if (!company) return { error: "Aucune entreprise n'est liée à ce compte." };

  const allowed = await consumeRateLimit("greetingAudio", company.id, { limit: GREETING_LISTENS_PER_DAY, windowSeconds: DAY_SECONDS });
  if (!allowed) return { error: "Vous avez beaucoup écouté aujourd'hui. Réessayez demain." };

  const speech = await synthesizeSpeech(greetingWithSms(company.name, input.intro), findGreetingVoice(input.voice).synthesisVoice);
  if (speech.status === "ok") return { mp3Base64: speech.mp3Base64 };
  if (speech.status === "failed") console.error(`Écoute du message impossible : ${speech.reason}`);
  return { error: "L'écoute n'est pas disponible pour le moment. Utilisez « M'appeler pour écouter »." };
}
