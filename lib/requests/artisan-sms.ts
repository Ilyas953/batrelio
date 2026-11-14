import { formatPhone } from "@/lib/format";
import { isFrenchMobile } from "@/lib/telephony/phone-rules";

// The SMS telling the artisan a customer just described their need.

export type ArtisanSmsStatus = "sent" | "failed" | "skipped_no_phone" | "skipped_not_mobile" | "skipped_test_account";

type ArtisanSmsDecision = "send" | Exclude<ArtisanSmsStatus, "sent" | "failed">;

// Sent to the artisan's contact phone (Mon entreprise), when it can receive SMS.
export function decideArtisanSms(contactPhone: string | null, isTestAccount: boolean): ArtisanSmsDecision {
  // Test accounts use fictional numbers: nothing is ever sent.
  if (isTestAccount) return "skipped_test_account";
  if (!contactPhone) return "skipped_no_phone";
  if (!isFrenchMobile(contactPhone)) return "skipped_not_mobile";
  return "send";
}

type NewRequestSms = { customerName: string | null; customerPhone: string; requestUrl: string };

// Short and without special characters, to fit in one SMS: who, their number (to call back
// straight from the SMS), and the link to the request.
export function newRequestSms({ customerName, customerPhone, requestUrl }: NewRequestSms): string {
  const name = customerName?.trim();
  const who = name ? `de ${name} (${formatPhone(customerPhone)})` : `du ${formatPhone(customerPhone)}`;
  return `Batrelio : nouvelle demande ${who}. Voir : ${requestUrl}`;
}

export function requestPageUrl(siteUrl: string, requestId: string): string {
  return `${siteUrl}/espace/demandes/${requestId}`;
}

// The customer accepted a quote online: the artisan hears it at once, with the quote to open.
export function acceptedQuoteSms({ signerName, quoteNumber, quoteUrl }: { signerName: string; quoteNumber: string | null; quoteUrl: string }): string {
  const quote = quoteNumber ? `le devis ${quoteNumber}` : "votre devis";
  return `Batrelio : ${signerName} a accepté ${quote}. Voir : ${quoteUrl}`;
}

export function quotePageUrl(siteUrl: string, quoteId: string): string {
  return `${siteUrl}/espace/devis/${quoteId}`;
}
