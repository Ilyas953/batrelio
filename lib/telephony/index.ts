import "server-only";
import { getFallbackSmsSender, getNumberPurchaseSettings, getPublicSiteUrl } from "./config";
import {
  TwilioError,
  createMessage,
  findAvailableFrenchNumber,
  isValidTwilioSignature,
  listOwnedNumbers,
  purchaseNumber,
  setNumberVoiceUrl,
} from "./twilio";

// The only entry point to the telephony provider: switching providers means rewriting this file.

export const WEBHOOK_PATHS = {
  voice: "/api/twilio/voice",
  smsStatus: "/api/twilio/sms-status",
} as const;

export function webhookUrl(siteUrl: string, path: (typeof WEBHOOK_PATHS)[keyof typeof WEBHOOK_PATHS]): string {
  return `${siteUrl}${path}`;
}

export type ProvisionedNumber = { phoneNumber: string; sid: string };

export type ProvisionResult =
  | { status: "ok"; number: ProvisionedNumber }
  | { status: "no_regulatory_bundle" }
  | { status: "no_number_available" };

// Reuses a number bought in the console and not given to anyone yet; otherwise buys one.
export async function provisionPhoneNumber(siteUrl: string, assignedNumbers: Set<string>): Promise<ProvisionResult> {
  const voiceUrl = webhookUrl(siteUrl, WEBHOOK_PATHS.voice);

  const freeNumber = (await listOwnedNumbers()).find((number) => !assignedNumbers.has(number.phone_number));
  if (freeNumber) {
    await setNumberVoiceUrl(freeNumber.sid, voiceUrl);
    return { status: "ok", number: { phoneNumber: freeNumber.phone_number, sid: freeNumber.sid } };
  }

  const { bundleSid, addressSid, numberPrefix } = getNumberPurchaseSettings();
  if (!bundleSid || !addressSid) return { status: "no_regulatory_bundle" };

  const available = await findAvailableFrenchNumber(numberPrefix);
  if (!available) return { status: "no_number_available" };

  const purchased = await purchaseNumber(available, voiceUrl, bundleSid, addressSid);
  return { status: "ok", number: { phoneNumber: purchased.phone_number, sid: purchased.sid } };
}

// Points the number to the current webhook, e.g. after the site moved to its own domain.
export async function connectPhoneNumber(numberSid: string, siteUrl: string): Promise<void> {
  await setNumberVoiceUrl(numberSid, webhookUrl(siteUrl, WEBHOOK_PATHS.voice));
}

export function chooseSmsSender(company: { sms_sender_name: string; sms_sender_approved: boolean }): string {
  if (company.sms_sender_approved) return company.sms_sender_name;
  return getFallbackSmsSender() ?? company.sms_sender_name;
}

export type SentSms = { status: "sent"; sid: string } | { status: "failed"; reason: string };

export async function sendSms(to: string, from: string, body: string, siteUrl: string): Promise<SentSms> {
  try {
    const message = await createMessage({
      to,
      from,
      body,
      statusCallback: webhookUrl(siteUrl, WEBHOOK_PATHS.smsStatus),
    });
    return { status: "sent", sid: message.sid };
  } catch (error) {
    return { status: "failed", reason: error instanceof TwilioError ? `${error.code}: ${error.message}` : String(error) };
  }
}

// Reads a provider webhook and checks it was really sent by the provider. Null when it was not.
export async function readVerifiedWebhook(
  request: Request,
  path: (typeof WEBHOOK_PATHS)[keyof typeof WEBHOOK_PATHS],
): Promise<{ params: Record<string, string>; siteUrl: string } | null> {
  const siteUrl = getPublicSiteUrl();
  const signature = request.headers.get("x-twilio-signature");
  if (!siteUrl || !signature) return null;

  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") params[key] = value;
  });

  const url = webhookUrl(siteUrl, path) + new URL(request.url).search;
  return isValidTwilioSignature(url, params, signature) ? { params, siteUrl } : null;
}
