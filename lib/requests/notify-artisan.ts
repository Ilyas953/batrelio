import "server-only";
import { isTestAccount } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificationSmsSender, sendSms } from "@/lib/telephony";
import type { SmsDelivery } from "@/lib/telephony/missed-call";
import { decideArtisanSms, newRequestSms, requestPageUrl, type ArtisanSmsStatus } from "./artisan-sms";

// Tells the artisan a customer just sent a request. Best effort: the request is already saved,
// a failed SMS only shows in the logs and in requests.artisan_sms_status.
export async function notifyArtisanOfNewRequest(
  requestId: string,
  siteUrl: string,
  deliverSms: SmsDelivery = sendSms,
): Promise<ArtisanSmsStatus | null> {
  const supabase = createAdminClient();
  const { data: request } = await supabase
    .from("requests")
    .select("id, customer_name, customer_phone, artisan_sms_status, company:companies(owner_id, contact_phone, sms_sender_name, sms_sender_approved)")
    .eq("id", requestId)
    .maybeSingle();
  // Already announced (e.g. a retried call): never twice.
  if (!request?.company || request.artisan_sms_status) return null;

  const { data: owner } = await supabase.auth.admin.getUserById(request.company.owner_id);
  const decision = decideArtisanSms(request.company.contact_phone, isTestAccount(owner.user?.app_metadata));

  let status: ArtisanSmsStatus = decision === "send" ? "sent" : decision;
  if (decision === "send" && request.company.contact_phone) {
    const body = newRequestSms({
      customerName: request.customer_name,
      customerPhone: request.customer_phone,
      requestUrl: requestPageUrl(siteUrl, request.id),
    });
    const sms = await deliverSms(request.company.contact_phone, notificationSmsSender(request.company), body, siteUrl);
    if (sms.status === "failed") {
      console.error(`SMS de nouvelle demande non envoyé (demande ${request.id}) : ${sms.reason}`);
      status = "failed";
    }
  }

  await supabase.from("requests").update({ artisan_sms_status: status }).eq("id", request.id);
  return status;
}
