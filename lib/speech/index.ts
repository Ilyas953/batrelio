import "server-only";
import { hasGoogleSpeechKey, synthesizeWithGoogle } from "./google";

// The only entry point to speech synthesis: switching providers means rewriting this file.

export type SynthesizedSpeech = { status: "ok"; mp3Base64: string } | { status: "unavailable" } | { status: "failed"; reason: string };

export async function synthesizeSpeech(text: string, voiceName: string): Promise<SynthesizedSpeech> {
  if (!hasGoogleSpeechKey()) return { status: "unavailable" };
  try {
    return { status: "ok", mp3Base64: await synthesizeWithGoogle(text, voiceName) };
  } catch (error) {
    return { status: "failed", reason: String(error) };
  }
}
