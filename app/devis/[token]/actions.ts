"use server";

import { after } from "next/server";
import { acceptanceState, readAcceptance } from "@/lib/quotes/acceptance";
import { notifyArtisanOfAcceptedQuote } from "@/lib/quotes/notify-acceptance";
import { getSiteOrigin } from "@/lib/requests/site-origin";
import { getPublicSiteUrl } from "@/lib/telephony/config";
import { TOO_MANY_ATTEMPTS, getClientIp, isAllowedFromThisVisitor } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_PATTERN = /^[0-9a-f]{32}$/;

export type AcceptQuoteResult = { error: string } | { accepted: { name: string; signedAt: string } };

const CLOSED_MESSAGES = {
  signed: "Ce devis a déjà été accepté.",
  declined: "Ce devis a été refusé. Contactez l'entreprise pour en parler.",
  expired: "Ce devis a expiré. Demandez un nouveau devis à l'entreprise.",
  not_sent: "Ce devis n'existe pas.",
} as const;

// Public: the customer has no account. The quote token is the only credential; the typed name,
// the time and the address are kept as the proof of acceptance.
export async function acceptQuote(token: string, formData: FormData): Promise<AcceptQuoteResult> {
  if (!TOKEN_PATTERN.test(token)) return { error: CLOSED_MESSAGES.not_sent };
  if (!(await isAllowedFromThisVisitor("quoteAnswerPerIp"))) return { error: TOO_MANY_ATTEMPTS };

  const acceptance = readAcceptance(formData.get("name"), formData.get("agreed"));
  if ("error" in acceptance) return acceptance;

  const supabase = createAdminClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, status, sent_at, validity_days")
    .eq("public_token", token)
    .maybeSingle();
  if (!quote) return { error: CLOSED_MESSAGES.not_sent };

  const state = acceptanceState(quote, new Date());
  if (state !== "open") return { error: CLOSED_MESSAGES[state] };

  const signedAt = new Date().toISOString();
  // Only from "sent", in one statement: a double tap or a late artisan answer cannot overwrite it.
  const { data: signed } = await supabase
    .from("quotes")
    .update({ status: "signed", signed_at: signedAt, signed_by_name: acceptance.name, signed_ip: await getClientIp() })
    .eq("id", quote.id)
    .eq("status", "sent")
    .select("id")
    .maybeSingle();
  if (!signed) return { error: CLOSED_MESSAGES.signed };

  // After the answer: the customer does not wait for the artisan's SMS.
  const siteUrl = getPublicSiteUrl() ?? (await getSiteOrigin());
  after(() => notifyArtisanOfAcceptedQuote(signed.id, siteUrl));

  return { accepted: { name: acceptance.name, signedAt } };
}
