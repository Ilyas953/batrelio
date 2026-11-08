import { createHash } from "node:crypto";
import { findGreetingVoice } from "./voices";

// One recording per (voice, exact text): changing either gives a new file, never a stale one.
export function greetingAudioPath(companyId: string, voiceId: string | null | undefined, text: string): string {
  const voice = findGreetingVoice(voiceId).synthesisVoice;
  const hash = createHash("sha256").update(`${voice}\n${text}`).digest("hex").slice(0, 32);
  return `${companyId}/${hash}.mp3`;
}
