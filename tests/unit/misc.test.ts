import { describe, expect, it } from "vitest";
import { formatTimeAgo } from "@/lib/format";
import { estimateRecoveredRevenue } from "@/lib/roi";
import { toSmsStatus } from "@/lib/telephony/sms-status";

describe("landing page estimate", () => {
  it("grows with missed calls and is zero without any", () => {
    const base = { missedCallsPerWeek: 5, averageJobValue: 2000, quoteSignRate: 0.3 };
    expect(estimateRecoveredRevenue({ ...base, missedCallsPerWeek: 0 }).revenuePerYear).toBe(0);
    expect(estimateRecoveredRevenue({ ...base, missedCallsPerWeek: 10 }).revenuePerYear).toBeCloseTo(
      2 * estimateRecoveredRevenue(base).revenuePerYear,
    );
  });

  it("keeps the yearly and monthly figures consistent", () => {
    const estimate = estimateRecoveredRevenue({ missedCallsPerWeek: 5, averageJobValue: 2000, quoteSignRate: 0.3 });
    expect(estimate.revenuePerMonth * 12).toBeCloseTo(estimate.revenuePerYear);
    expect(estimate.extraJobsPerYear).toBeLessThan(estimate.requestsPerYear);
  });
});

describe("SMS statuses from the database", () => {
  it("falls back to pending for an unknown value", () => {
    expect(toSmsStatus("delivered")).toBe("delivered");
    expect(toSmsStatus("whatever")).toBe("pending");
  });
});

describe("relative times", () => {
  const now = new Date("2026-11-05T12:00:00Z");
  it("speaks like a person", () => {
    expect(formatTimeAgo("2026-11-05T11:59:30Z", now)).toBe("à l'instant");
    expect(formatTimeAgo("2026-11-05T10:00:00Z", now)).toBe("il y a 2 heures");
    expect(formatTimeAgo("2026-11-04T12:00:00Z", now)).toBe("hier");
  });
});
