import "server-only";

// Google Cloud Text-to-Speech, REST API with an API key restricted to that API.
const SYNTHESIZE_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

export class SpeechSynthesisError extends Error {}

export function hasGoogleSpeechKey(): boolean {
  return Boolean(process.env.GOOGLE_TTS_API_KEY?.trim());
}

// Returns the MP3 audio, base64 encoded.
export async function synthesizeWithGoogle(text: string, voiceName: string): Promise<string> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY?.trim();
  if (!apiKey) throw new SpeechSynthesisError("Variable d'environnement manquante : GOOGLE_TTS_API_KEY (voir .env.example)");

  const response = await fetch(SYNTHESIZE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: voiceName.slice(0, 5), name: voiceName },
      audioConfig: { audioEncoding: "MP3" },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new SpeechSynthesisError(`Google TTS ${response.status} : ${(await response.text()).slice(0, 300)}`);
  }
  const { audioContent } = (await response.json()) as { audioContent?: string };
  if (!audioContent) throw new SpeechSynthesisError("Google TTS : réponse sans audio");
  return audioContent;
}
