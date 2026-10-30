import { createAdminClient } from "@/lib/supabase/admin";
import { WEBHOOK_PATHS, readVerifiedWebhook } from "@/lib/telephony";

const FINAL_STATUSES: Record<string, "delivered" | "failed"> = {
  delivered: "delivered",
  undelivered: "failed",
  failed: "failed",
};

// Delivery reports for the missed-call SMS: the artisan sees whether the customer got it.
export async function POST(request: Request) {
  const webhook = await readVerifiedWebhook(request, WEBHOOK_PATHS.smsStatus);
  if (!webhook) return new Response("Signature invalide", { status: 403 });

  const { MessageSid: messageSid, MessageStatus: messageStatus, ErrorCode: errorCode } = webhook.params;
  const status = FINAL_STATUSES[messageStatus ?? ""];
  if (messageSid && status) {
    await createAdminClient().from("missed_calls").update({ sms_status: status }).eq("sms_sid", messageSid);
    if (status === "failed") console.error(`SMS ${messageSid} non distribué (code ${errorCode ?? "inconnu"})`);
  }

  return new Response(null, { status: 204 });
}
