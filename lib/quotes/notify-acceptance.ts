import "server-only";
import { isTestAccount } from "@/lib/auth/session";
import { acceptedQuoteSms, decideArtisanSms, quotePageUrl } from "@/lib/requests/artisan-sms";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificationSmsSender, sendSms } from "@/lib/telephony";

// Tells the artisan their customer accepted the quote online. Best effort: the acceptance is saved,
// a failed SMS only shows in the logs.
export async function notifyArtisanOfAcceptedQuote(quoteId: string, siteUrl: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, number, signed_by_name, company:companies(owner_id, contact_phone, sms_sender_name, sms_sender_approved)")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote?.company || !quote.signed_by_name) return;

  const { data: owner } = await supabase.auth.admin.getUserById(quote.company.owner_id);
  const decision = decideArtisanSms(quote.company.contact_phone, isTestAccount(owner.user?.app_metadata));
  if (decision !== "send" || !quote.company.contact_phone) return;

  const body = acceptedQuoteSms({ signerName: quote.signed_by_name, quoteNumber: quote.number, quoteUrl: quotePageUrl(siteUrl, quote.id) });
  const sms = await sendSms(quote.company.contact_phone, notificationSmsSender(quote.company), body, siteUrl);
  if (sms.status === "failed") console.error(`SMS de devis accepté non envoyé (devis ${quote.id}) : ${sms.reason}`);
}
