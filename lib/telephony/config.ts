import "server-only";
import { PRODUCTION_SITE_URL } from "@/lib/site";

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function requireEnv(name: string): string {
  const value = readEnv(name);
  if (!value) throw new Error(`Variable d'environnement manquante : ${name} (voir .env.example)`);
  return value;
}

export function getTwilioCredentials() {
  return { accountSid: requireEnv("TWILIO_ACCOUNT_SID"), authToken: requireEnv("TWILIO_AUTH_TOKEN") };
}

// Public address of the app: the provider calls our webhooks there, and SMS links point to it.
// On the Vercel production deployment it is the production domain unless SITE_URL says otherwise.
export function getPublicSiteUrl(): string | undefined {
  const siteUrl = readEnv("SITE_URL") ?? (process.env.VERCEL_ENV === "production" ? PRODUCTION_SITE_URL : undefined);
  return siteUrl?.replace(/\/+$/, "");
}

export function isReachableFromInternet(siteUrl: string): boolean {
  return siteUrl.startsWith("https://") && !/\/\/(localhost|127\.0\.0\.1)/.test(siteUrl);
}

// French numbers require a regulatory bundle (business identity and address) approved by Twilio.
export function getNumberPurchaseSettings() {
  return {
    bundleSid: readEnv("TWILIO_BUNDLE_SID"),
    addressSid: readEnv("TWILIO_ADDRESS_SID"),
    // The bundle address must be in the number's area, e.g. +331 for an address in Île-de-France.
    numberPrefix: readEnv("TWILIO_NUMBER_PREFIX") ?? "+339",
  };
}

// Registered sender used while an artisan's own sender name awaits registration.
export function getFallbackSmsSender(): string | undefined {
  return readEnv("SMS_FALLBACK_SENDER");
}
