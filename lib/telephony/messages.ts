// What the caller hears and reads. Plain words, no advertising: the SMS answers the call the
// customer made (otherwise it would be marketing, which requires prior consent, art. L. 34-5 CPCE).
// The SMS text only uses characters of the GSM alphabet (é is one, ê or ç are not), so it is not
// sent as UCS-2, which fits 70 characters per part instead of 160.

export function greetingWithSms(companyName: string): string {
  return (
    `Bonjour, vous êtes bien chez ${companyName}. Nous ne pouvons pas vous répondre pour le moment. ` +
    "Vous allez recevoir un SMS avec un lien pour nous décrire votre besoin. Merci, et à très bientôt."
  );
}

export function greetingWithoutSms(companyName: string): string {
  return (
    `Bonjour, vous êtes bien chez ${companyName}. Nous ne pouvons pas vous répondre pour le moment. ` +
    "Nous avons bien noté votre appel et nous vous rappelons dès que possible. Merci, et à très bientôt."
  );
}

// A hidden number cannot be called back.
export function greetingForHiddenCaller(companyName: string): string {
  return (
    `Bonjour, vous êtes bien chez ${companyName}. Nous ne pouvons pas vous répondre pour le moment, ` +
    "et votre numéro est masqué : merci de nous rappeler un peu plus tard. À très bientôt."
  );
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

// TwiML: read the greeting in French, then hang up.
export function toVoiceResponse(text: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<Response><Say language="fr-FR" voice="Polly.Lea">${escapeXml(text)}</Say><Hangup/></Response>`
  );
}
