// Voices offered for the phone greeting. All are Google voices: the provider reads them in calls
// (TwiML <Say>), and the same voice is synthesised in the artisan space to listen before saving,
// so what the artisan hears is what customers hear.
// Names come from https://www.twilio.com/docs/voice/twiml/say/text-speech (fr-FR).
// "Voix IA" (Chirp3-HD) are the most natural, but still a Public Beta at the provider.

export type GreetingVoice = {
  id: string;
  label: string;
  description: string;
  kind: "standard" | "ai";
  // Voice name for the telephony provider (<Say voice="…">).
  providerVoice: string;
  // The same voice for speech synthesis in the artisan space.
  synthesisVoice: string;
};

// Ids are stored in companies.greeting_voice: keep them stable, change labels freely.
export const GREETING_VOICES = [
  { id: "classic", label: "Léa", description: "Voix de femme, claire", kind: "standard", providerVoice: "Google.fr-FR-Neural2-F", synthesisVoice: "fr-FR-Neural2-F" },
  { id: "mathieu", label: "Mathieu", description: "Voix d'homme, claire", kind: "standard", providerVoice: "Google.fr-FR-Neural2-G", synthesisVoice: "fr-FR-Neural2-G" },
  { id: "claire-ai", label: "Claire", description: "Voix de femme IA, chaleureuse", kind: "ai", providerVoice: "Google.fr-FR-Chirp3-HD-Aoede", synthesisVoice: "fr-FR-Chirp3-HD-Aoede" },
  { id: "lea-ai", label: "Inès", description: "Voix de femme IA, dynamique", kind: "ai", providerVoice: "Google.fr-FR-Chirp3-HD-Kore", synthesisVoice: "fr-FR-Chirp3-HD-Kore" },
  { id: "hugo-ai", label: "Hugo", description: "Voix d'homme IA, posée", kind: "ai", providerVoice: "Google.fr-FR-Chirp3-HD-Charon", synthesisVoice: "fr-FR-Chirp3-HD-Charon" },
  { id: "remi-ai", label: "Rémi", description: "Voix d'homme IA, dynamique", kind: "ai", providerVoice: "Google.fr-FR-Chirp3-HD-Puck", synthesisVoice: "fr-FR-Chirp3-HD-Puck" },
] as const satisfies readonly GreetingVoice[];

export type GreetingVoiceId = (typeof GREETING_VOICES)[number]["id"];

// The greeting is recorded once with this voice and played on calls: the most natural by default.
export const DEFAULT_GREETING_VOICE: GreetingVoiceId = "claire-ai";

// When the recording is not ready, the provider reads the text live: an AI voice is then replaced
// by the standard one, which is outside the provider's beta, so a call never goes silent.
export const LIVE_FALLBACK_VOICE: GreetingVoiceId = "classic";

export function liveReadingVoice(id: string | null | undefined): GreetingVoiceId {
  const voice = findGreetingVoice(id);
  return voice.kind === "ai" ? LIVE_FALLBACK_VOICE : (voice.id as GreetingVoiceId);
}

export function isGreetingVoiceId(value: string): value is GreetingVoiceId {
  return GREETING_VOICES.some((voice) => voice.id === value);
}

// An unknown stored value (a voice removed since) falls back to the default.
export function findGreetingVoice(id: string | null | undefined): GreetingVoice {
  return GREETING_VOICES.find((voice) => voice.id === id) ?? GREETING_VOICES.find((voice) => voice.id === DEFAULT_GREETING_VOICE)!;
}
