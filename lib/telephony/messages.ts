import { findGreetingVoice } from "./voices";

// What the caller hears and reads. Plain words, no advertising: the SMS answers the call the
// customer made (otherwise it would be marketing, which requires prior consent, art. L. 34-5 CPCE).
// The SMS text only uses characters of the GSM alphabet (é is one, ê or ç are not), so it is not
// sent as UCS-2, which fits 70 characters per part instead of 160.

export const MAX_GREETING_INTRO_LENGTH = 300;

// The part the artisan may rewrite. Batrelio always appends what happens next,
// so the caller is never told about an SMS that will not come.
export function defaultGreetingIntro(companyName: string): string {
  return `Bonjour, vous êtes bien chez ${companyName}. Nous ne pouvons pas vous répondre pour le moment.`;
}

function greeting(intro: string | null | undefined, companyName: string, nextStep: string): string {
  const opening = intro?.trim() || defaultGreetingIntro(companyName);
  const separator = /[.!?…]$/.test(opening) ? " " : ". ";
  return `${opening}${separator}${nextStep}`;
}

export const GREETING_NEXT_STEPS = {
  withSms: "Vous allez recevoir un SMS avec un lien pour nous décrire votre besoin. Merci, et à très bientôt.",
  withoutSms: "Nous avons bien noté votre appel et nous vous rappelons dès que possible. Merci, et à très bientôt.",
  // A hidden number cannot be called back.
  hiddenCaller: "Votre numéro est masqué : merci de nous rappeler un peu plus tard. À très bientôt.",
} as const;

export function greetingWithSms(companyName: string, intro?: string | null): string {
  return greeting(intro, companyName, GREETING_NEXT_STEPS.withSms);
}

export function greetingWithoutSms(companyName: string, intro?: string | null): string {
  return greeting(intro, companyName, GREETING_NEXT_STEPS.withoutSms);
}

export function greetingForHiddenCaller(companyName: string, intro?: string | null): string {
  return greeting(intro, companyName, GREETING_NEXT_STEPS.hiddenCaller);
}

export function missedCallSms(companyName: string, requestUrl: string): string {
  return (
    `Bonjour, ici ${companyName}. Nous n'avons pas pu décrocher. ` +
    `Décrivez votre besoin (photos possibles) ici, nous vous recontactons vite : ${requestUrl}`
  );
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// TwiML: read the greeting in French with the chosen voice, then hang up.
// Plays the greeting recorded beforehand: no live reading, so no provider beta and no per-call cost.
export function toPlayResponse(audioUrl: string): string {
  return '<?xml version="1.0" encoding="UTF-8"?>' + `<Response><Play>${escapeXml(audioUrl)}</Play><Hangup/></Response>`;
}

export function toVoiceResponse(text: string, voiceId?: string | null): string {
  const voice = escapeXml(findGreetingVoice(voiceId).providerVoice);
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<Response><Say language="fr-FR" voice="${voice}">${escapeXml(text)}</Say><Hangup/></Response>`
  );
}
