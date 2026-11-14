import type { SmsStatus } from "@/lib/telephony/sms-status";

// Missed calls whose customer has not described their need yet: the artisan calls them back.
// They are listed apart from the requests received, which come with a description.

// After this, a call nobody returned is old news: it stays in the call history only.
export const MISSED_CALLS_SHOWN_DAYS = 30;

export type MissedCallRequest = {
  id: string;
  customer_phone: string;
  created_at: string;
  missed_calls: { sms_status: string; created_at: string }[];
};

export type MissedCallToReturn = {
  // The most recent request of this caller: "C'est fait" starts from it.
  requestId: string;
  phone: string;
  lastCallAt: string;
  callCount: number;
  smsStatus: SmsStatus | null;
};

// One line per caller, most recent first, whatever the number of calls.
export function groupMissedCalls(requests: MissedCallRequest[]): MissedCallToReturn[] {
  const byPhone = new Map<string, MissedCallToReturn>();
  const sorted = requests.toSorted((a, b) => b.created_at.localeCompare(a.created_at));

  for (const request of sorted) {
    const calls = request.missed_calls.toSorted((a, b) => b.created_at.localeCompare(a.created_at));
    const lastCallAt = calls[0]?.created_at ?? request.created_at;
    const existing = byPhone.get(request.customer_phone);
    if (existing) {
      existing.callCount += Math.max(calls.length, 1);
      continue;
    }
    byPhone.set(request.customer_phone, {
      requestId: request.id,
      phone: request.customer_phone,
      lastCallAt,
      callCount: Math.max(calls.length, 1),
      // A repeated call only points to the first one: what happened to the first one tells.
      smsStatus: ((calls.find((call) => call.sms_status !== "skipped_recent") ?? calls[0])?.sms_status as SmsStatus | undefined) ?? null,
    });
  }

  return [...byPhone.values()].sort((a, b) => b.lastCallAt.localeCompare(a.lastCallAt));
}

// What the artisan reads under the number: did the customer get a link to describe their need?
export function missedCallSmsNote(status: SmsStatus | null): string {
  switch (status) {
    case "sent":
    case "delivered":
    case "pending":
      return "SMS envoyé : il n'a pas encore décrit son besoin.";
    case "failed":
      return "Le SMS n'est pas arrivé : rappelez-le.";
    case "skipped_not_mobile":
      return "Ligne fixe : pas de SMS possible, rappelez-le.";
    case "skipped_disabled":
      return "Réponse automatique en pause : pas de SMS envoyé.";
    case "skipped_known":
      return "Déjà client : pas de SMS, rappelez-le.";
    default:
      return "Rappelez-le pour connaître son besoin.";
  }
}
