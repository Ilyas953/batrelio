import "server-only";
import { synthesizeSpeech } from "@/lib/speech";
import { createAdminClient } from "@/lib/supabase/admin";
import { greetingAudioPath } from "./greeting-audio-path";
import { greetingText, type GreetingVariant } from "./missed-call";
import { findGreetingVoice } from "./voices";

export const GREETING_AUDIO_BUCKET = "greeting-audio";
const VARIANTS: GreetingVariant[] = ["withSms", "withoutSms", "hiddenCaller"];
// The provider fetches the file at the start of the call.
const CALL_URL_LIFETIME_SECONDS = 10 * 60;

type GreetingCompany = { id: string; name: string; greeting_intro: string | null; greeting_voice: string | null };

function pathsOf(company: GreetingCompany): Record<GreetingVariant, string> {
  return Object.fromEntries(
    VARIANTS.map((variant) => [variant, greetingAudioPath(company.id, company.greeting_voice, greetingText(variant, company))]),
  ) as Record<GreetingVariant, string>;
}

// The recording to play for this call, or null when it is not ready (the provider then reads the text).
export async function findGreetingAudioUrl(company: GreetingCompany, variant: GreetingVariant): Promise<string | null> {
  const { data } = await createAdminClient()
    .storage.from(GREETING_AUDIO_BUCKET)
    .createSignedUrl(pathsOf(company)[variant], CALL_URL_LIFETIME_SECONDS);
  return data?.signedUrl ?? null;
}

// Records the three versions of the greeting (mobile, landline, hidden number) that are missing,
// and removes the old ones. Run after the greeting or the company name changes.
export async function prepareGreetingAudio(company: GreetingCompany): Promise<void> {
  const storage = createAdminClient().storage.from(GREETING_AUDIO_BUCKET);
  const wanted = pathsOf(company);
  const { data: existing } = await storage.list(company.id, { limit: 100 });
  const existingPaths = new Set((existing ?? []).map((file) => `${company.id}/${file.name}`));
  const voice = findGreetingVoice(company.greeting_voice).synthesisVoice;

  for (const variant of VARIANTS) {
    if (existingPaths.has(wanted[variant])) continue;
    const speech = await synthesizeSpeech(greetingText(variant, company), voice);
    if (speech.status === "unavailable") return;
    if (speech.status === "failed") {
      console.error(`Message d'accueil non enregistré (${company.id}, ${variant}) : ${speech.reason}`);
      continue;
    }
    const bytes = Buffer.from(speech.mp3Base64, "base64");
    const { error } = await storage.upload(wanted[variant], bytes, { contentType: "audio/mpeg", upsert: true });
    if (error) console.error(`Message d'accueil non stocké (${company.id}, ${variant}) : ${error.message}`);
  }

  const stale = [...existingPaths].filter((path) => !Object.values(wanted).includes(path));
  if (stale.length > 0) await storage.remove(stale);
}
