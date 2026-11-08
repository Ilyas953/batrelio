import { describe, expect, it } from "vitest";
import { TOUR_STEPS, hasFinishedTour, placeBubble, stepsForPage } from "@/lib/onboarding/tour";

const PHONE = { width: 390, height: 844 };
const BUBBLE = { width: 358, height: 220 };

describe("tour steps", () => {
  it("skips what is not on the page, keeps the messages worth saying anyway", () => {
    const onSettingsPage = stepsForPage(TOUR_STEPS, (target) => target.startsWith("tab-"));
    expect(onSettingsPage.map((step) => step.id)).toEqual(["welcome", "requests-tab", "share", "quotes-tab", "settings-tab", "done"]);
  });

  it("shows everything on a full home page", () => {
    expect(stepsForPage(TOUR_STEPS, () => true)).toHaveLength(TOUR_STEPS.length);
  });

  it("starts with a welcome and ends with a goodbye", () => {
    expect(TOUR_STEPS[0].target).toBeNull();
    expect(TOUR_STEPS.at(-1)?.target).toBeNull();
  });

  it("talks about the 10 % of a shared mission", () => {
    expect(TOUR_STEPS.find((step) => step.id === "share")?.text).toContain("10 %");
  });
});

describe("bubble placement", () => {
  it("goes below an element at the top of the screen", () => {
    const placement = placeBubble({ top: 120, left: 16, width: 358, height: 200 }, PHONE, BUBBLE);
    expect(placement).toMatchObject({ side: "below", top: 334, left: 16 });
  });

  it("goes above the bottom tab bar", () => {
    const tab = { top: 780, left: 0, width: 130, height: 64 };
    const placement = placeBubble(tab, PHONE, BUBBLE);
    expect(placement.side).toBe("above");
    expect(placement.top).toBe(780 - 14 - 220);
    expect(placement.left).toBe(16);
    // The arrow points at the tab, not at the middle of the bubble.
    expect(placement.arrowLeft).toBe(49);
  });

  it("never leaves the screen", () => {
    const placement = placeBubble({ top: 400, left: 360, width: 30, height: 30 }, PHONE, BUBBLE);
    expect(placement.left + BUBBLE.width).toBeLessThanOrEqual(PHONE.width - 16);
    expect(placement.arrowLeft).toBeLessThanOrEqual(BUBBLE.width - 24);
  });

  it("centres a message without an element", () => {
    expect(placeBubble(null, PHONE, BUBBLE)).toMatchObject({ side: "center", left: 16, top: 312 });
  });
});

describe("tour done", () => {
  it("is read from the account", () => {
    expect(hasFinishedTour({ tour_done_at: "2026-11-07T10:00:00Z" })).toBe(true);
    expect(hasFinishedTour({ company_name: "X" })).toBe(false);
    expect(hasFinishedTour(undefined)).toBe(false);
  });
});
