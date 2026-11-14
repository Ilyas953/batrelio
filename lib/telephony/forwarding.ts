import { formatPhone } from "@/lib/format";

// GSM codes shared by French operators (Orange, SFR, Bouygues Telecom, Free).
// **004* forwards when there is no answer, the line is busy or unreachable.
// The last field is how long the phone rings before forwarding (5 to 30 s, in steps of 5).
// Without it the operator's default applies, often 20 to 30 s: many customers hang up
// before Batrelio answers, and those calls never reach us (no request, no SMS).
export const FORWARDING_RING_SECONDS = 15;

export const CANCEL_FORWARDING_CODE = "##004#";

// "+33939123452" -> "**004*0939123452**15#"
export function forwardingCode(batrelioNumber: string): string {
  const nationalNumber = formatPhone(batrelioNumber).replaceAll(" ", "");
  return `**004*${nationalNumber}**${FORWARDING_RING_SECONDS}#`;
}
