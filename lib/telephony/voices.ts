// Voices offered for the phone greeting, read by the telephony provider (TwiML <Say>).
// Names come from https://www.twilio.com/docs/voice/twiml/say/text-speech (French voices).
// "Voix IA" are generative voices: the most natural, billed a little more per character.

export type GreetingVoice = {
  id: string;
  label: string;
  description: string;
  providerVoice: string;
};

export const GREETING_VOICES = [
  { id: "classic", label: "Léa", description: "Voix de femme classique", providerVoice: "Polly.Lea" },
  { id: "lea-ai", label: "Léa", description: "Voix de femme IA, très naturelle", providerVoice: "Polly.Lea-Generative" },
  { id: "remi-ai", label: "Rémi", description: "Voix d'homme IA, très naturelle", providerVoice: "Polly.Rémi-Generative" },
  { id: "claire-ai", label: "Claire", description: "Voix de femme IA, chaleureuse", providerVoice: "Google.fr-FR-Chirp3-HD-Aoede" },
  { id: "hugo-ai", label: "Hugo", description: "Voix d'homme IA, posée", providerVoice: "Google.fr-FR-Chirp3-HD-Charon" },
] as const satisfies readonly GreetingVoice[];

export type GreetingVoiceId = (typeof GREETING_VOICES)[number]["id"];

// The voice every call has used so far: proven on the line. Switch once an AI voice is validated.
export const DEFAULT_GREETING_VOICE: GreetingVoiceId = "classic";

export function isGreetingVoiceId(value: string): value is GreetingVoiceId {
  return GREETING_VOICES.some((voice) => voice.id === value);
}

// An unknown stored value (a voice removed since) falls back to the default.
export function findGreetingVoice(id: string | null | undefined): GreetingVoice {
  return GREETING_VOICES.find((voice) => voice.id === id) ?? GREETING_VOICES.find((voice) => voice.id === DEFAULT_GREETING_VOICE)!;
}
