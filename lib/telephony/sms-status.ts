// Outcome of a missed call, stored in missed_calls.sms_status (checked by the database).
export const SMS_STATUSES = [
  "pending",
  "sent",
  "delivered",
  "failed",
  "skipped_disabled",
  "skipped_anonymous",
  "skipped_not_mobile",
  "skipped_own_number",
  "skipped_recent",
  "skipped_excluded",
] as const;

export type SmsStatus = (typeof SMS_STATUSES)[number];

export function toSmsStatus(value: string): SmsStatus {
  return (SMS_STATUSES as readonly string[]).includes(value) ? (value as SmsStatus) : "pending";
}
