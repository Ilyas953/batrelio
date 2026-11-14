// The customer's answer to a sent quote: accepted online, or recorded by the artisan
// (answer given by phone or on paper).

export const MAX_SIGNER_NAME_LENGTH = 120;

// The words of the paper "bon pour accord", ticked by the customer instead of written by hand.
export const ACCEPTANCE_MENTION = "Devis reçu avant l'exécution des travaux, bon pour accord.";

const DAY_MS = 24 * 60 * 60 * 1000;

type AnswerableQuote = { status: string; sent_at: string | null; validity_days: number };

export type AcceptanceState = "open" | "signed" | "declined" | "expired" | "not_sent";

export function quoteExpiresAt(sentAt: string, validityDays: number): Date {
  return new Date(new Date(sentAt).getTime() + validityDays * DAY_MS);
}

// Whether the customer can still accept, and if not, why.
export function acceptanceState(quote: AnswerableQuote, now: Date): AcceptanceState {
  if (quote.status === "signed") return "signed";
  if (quote.status === "declined") return "declined";
  if (quote.status !== "sent" || !quote.sent_at) return "not_sent";
  return quoteExpiresAt(quote.sent_at, quote.validity_days) <= now ? "expired" : "open";
}

// The name typed by the customer and the ticked mention: both are the proof of acceptance.
export function readAcceptance(name: unknown, agreed: unknown): { name: string } | { error: string } {
  const signer = typeof name === "string" ? name.trim().replace(/\s+/g, " ") : "";
  if (!signer) return { error: "Indiquez votre nom et votre prénom." };
  if (signer.length > MAX_SIGNER_NAME_LENGTH) return { error: "Le nom est trop long." };
  if (agreed !== "on") return { error: "Cochez « bon pour accord » pour accepter le devis." };
  return { name: signer };
}

export type ArtisanAnswer = "signed" | "declined" | "sent";

// The artisan may record the customer's answer, or undo what they recorded themselves.
// An acceptance made online by the customer is a proof: it is never undone from the artisan space.
export function canRecordAnswer(
  quote: { status: string; signed_ip: string | null },
  answer: ArtisanAnswer,
): boolean {
  if (answer === "sent") return quote.status === "declined" || (quote.status === "signed" && quote.signed_ip === null);
  return quote.status === "sent";
}
