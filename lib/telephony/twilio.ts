import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getTwilioCredentials } from "./config";

const API_BASE = "https://api.twilio.com/2010-04-01";
const REQUEST_TIMEOUT_MS = 10_000;

export class TwilioError extends Error {
  readonly status: number;
  readonly code?: number;

  constructor(message: string, status: number, code?: number) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function twilioRequest<T>(method: "GET" | "POST", path: string, params?: Record<string, string>): Promise<T> {
  const { accountSid, authToken } = getTwilioCredentials();
  const query = method === "GET" && params ? `?${new URLSearchParams(params)}` : "";
  const response = await fetch(`${API_BASE}/Accounts/${accountSid}${path}${query}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: method === "POST" && params ? new URLSearchParams(params) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const body = (await response.json().catch(() => ({}))) as T & { message?: string; code?: number };
  if (!response.ok) throw new TwilioError(body.message ?? "Erreur Twilio", response.status, body.code);
  return body;
}

// https://www.twilio.com/docs/usage/webhooks/webhooks-security
// HMAC-SHA1 of the exact webhook URL followed by every POST parameter, sorted by name.
export function isValidTwilioSignature(url: string, params: Record<string, string>, signature: string): boolean {
  const { authToken } = getTwilioCredentials();
  const payload = Object.keys(params)
    .sort()
    .reduce((data, key) => data + key + params[key], url);
  const expected = createHmac("sha1", authToken).update(payload, "utf8").digest("base64");

  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(signature);
  return expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes);
}

type OwnedNumber = { sid: string; phone_number: string; voice_url: string | null };

export async function listOwnedNumbers(): Promise<OwnedNumber[]> {
  const body = await twilioRequest<{ incoming_phone_numbers: OwnedNumber[] }>("GET", "/IncomingPhoneNumbers.json", {
    PageSize: "1000",
  });
  return body.incoming_phone_numbers;
}

export async function findAvailableFrenchNumber(prefix: string): Promise<string | null> {
  const body = await twilioRequest<{ available_phone_numbers: { phone_number: string }[] }>(
    "GET",
    "/AvailablePhoneNumbers/FR/Local.json",
    { Contains: prefix, VoiceEnabled: "true", PageSize: "1" },
  );
  return body.available_phone_numbers[0]?.phone_number ?? null;
}

export async function purchaseNumber(phoneNumber: string, voiceUrl: string, bundleSid: string, addressSid: string) {
  return twilioRequest<OwnedNumber>("POST", "/IncomingPhoneNumbers.json", {
    PhoneNumber: phoneNumber,
    VoiceUrl: voiceUrl,
    VoiceMethod: "POST",
    BundleSid: bundleSid,
    AddressSid: addressSid,
    FriendlyName: "Batrelio",
  });
}

export async function setNumberVoiceUrl(numberSid: string, voiceUrl: string) {
  return twilioRequest<OwnedNumber>("POST", `/IncomingPhoneNumbers/${numberSid}.json`, {
    VoiceUrl: voiceUrl,
    VoiceMethod: "POST",
  });
}

export async function createMessage(params: { to: string; from: string; body: string; statusCallback: string }) {
  return twilioRequest<{ sid: string; status: string }>("POST", "/Messages.json", {
    To: params.to,
    From: params.from,
    Body: params.body,
    StatusCallback: params.statusCallback,
  });
}
