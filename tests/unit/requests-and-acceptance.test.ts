import { describe, expect, it } from "vitest";
import { acceptanceState, canRecordAnswer, quoteExpiresAt, readAcceptance } from "@/lib/quotes/acceptance";
import { groupMissedCalls, missedCallSmsNote, type MissedCallRequest } from "@/lib/espace/missed-calls";

const NOW = new Date("2026-11-14T12:00:00Z");
const sentQuote = { status: "sent", sent_at: "2026-11-01T12:00:00Z", validity_days: 30 };

describe("customer acceptance of a quote", () => {
  it("is open while the quote is valid", () => {
    expect(acceptanceState(sentQuote, NOW)).toBe("open");
    expect(quoteExpiresAt(sentQuote.sent_at, 30).toISOString()).toBe("2026-12-01T12:00:00.000Z");
  });

  it("closes once the validity has passed", () => {
    expect(acceptanceState({ ...sentQuote, validity_days: 10 }, NOW)).toBe("expired");
  });

  it("says when the customer already answered, and never opens a draft", () => {
    expect(acceptanceState({ ...sentQuote, status: "signed" }, NOW)).toBe("signed");
    expect(acceptanceState({ ...sentQuote, status: "declined" }, NOW)).toBe("declined");
    expect(acceptanceState({ status: "draft", sent_at: null, validity_days: 30 }, NOW)).toBe("not_sent");
  });

  it("needs the customer's name and the ticked « bon pour accord »", () => {
    expect(readAcceptance("  Marie   Le Goff ", "on")).toEqual({ name: "Marie Le Goff" });
    expect(readAcceptance("", "on")).toHaveProperty("error");
    expect(readAcceptance("Marie Le Goff", null)).toHaveProperty("error");
    expect(readAcceptance("x".repeat(121), "on")).toHaveProperty("error");
  });
});

describe("answer recorded by the artisan", () => {
  it("records an answer given by phone or on paper", () => {
    expect(canRecordAnswer({ status: "sent", signed_ip: null }, "signed")).toBe(true);
    expect(canRecordAnswer({ status: "sent", signed_ip: null }, "declined")).toBe(true);
    expect(canRecordAnswer({ status: "draft", signed_ip: null }, "signed")).toBe(false);
  });

  it("can undo what the artisan recorded, never an online acceptance", () => {
    expect(canRecordAnswer({ status: "declined", signed_ip: null }, "sent")).toBe(true);
    expect(canRecordAnswer({ status: "signed", signed_ip: null }, "sent")).toBe(true);
    expect(canRecordAnswer({ status: "signed", signed_ip: "203.0.113.5" }, "sent")).toBe(false);
  });
});

const call = (id: string, phone: string, at: string, sms = "sent"): MissedCallRequest => ({
  id,
  customer_phone: phone,
  created_at: at,
  missed_calls: [{ sms_status: sms, created_at: at }],
});

describe("missed calls to return", () => {
  it("shows one line per caller, with the number of calls, most recent first", () => {
    const grouped = groupMissedCalls([
      call("old", "+33639981111", "2026-11-10T08:00:00Z", "skipped_not_mobile"),
      call("other", "+33639982222", "2026-11-12T08:00:00Z"),
      call("recent", "+33639981111", "2026-11-13T08:00:00Z", "skipped_not_mobile"),
    ]);
    expect(grouped.map((line) => [line.requestId, line.callCount])).toEqual([
      ["recent", 2],
      ["other", 1],
    ]);
  });

  it("tells the artisan whether the customer got a link", () => {
    expect(missedCallSmsNote("delivered")).toContain("SMS envoyé");
    expect(missedCallSmsNote("skipped_not_mobile")).toContain("Ligne fixe");
    expect(missedCallSmsNote(null)).toContain("Rappelez-le");
  });
});

describe("repeated missed calls", () => {
  it("tells what happened to the first call, not the repeat", () => {
    const [line] = groupMissedCalls([
      {
        id: "r1",
        customer_phone: "+33139981111",
        created_at: "2026-11-13T08:00:00Z",
        missed_calls: [
          { sms_status: "skipped_not_mobile", created_at: "2026-11-13T08:00:00Z" },
          { sms_status: "skipped_recent", created_at: "2026-11-13T10:00:00Z" },
        ],
      },
    ]);
    expect(line).toMatchObject({ callCount: 2, smsStatus: "skipped_not_mobile", lastCallAt: "2026-11-13T10:00:00Z" });
    expect(missedCallSmsNote("skipped_known")).toContain("Déjà client");
  });
});
