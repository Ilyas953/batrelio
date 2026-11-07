import { describe, expect, it } from "vitest";
import {
  formatVisit,
  formatVisitShort,
  parisDateTime,
  readVisitInput,
  toVisitInputs,
  visitMessage,
} from "@/lib/requests/visit";
import { MISSION_STATUS_FOR_ARTISAN, SHARE_REWARD_LABEL, SHARE_REWARD_PROMISE, isMissionStatus, readNote } from "@/lib/missions/shared-mission";

const NOW = new Date("2026-11-05T10:00:00Z");

describe("visit date in Paris time", () => {
  it("reads winter and summer time", () => {
    expect(parisDateTime("2026-11-12", "14:00")?.toISOString()).toBe("2026-11-12T13:00:00.000Z");
    expect(parisDateTime("2027-07-01", "09:30")?.toISOString()).toBe("2027-07-01T07:30:00.000Z");
  });

  it("handles the days the clocks change", () => {
    expect(parisDateTime("2027-03-28", "10:00")?.toISOString()).toBe("2027-03-28T08:00:00.000Z");
    expect(parisDateTime("2026-10-25", "10:00")?.toISOString()).toBe("2026-10-25T09:00:00.000Z");
  });

  it("refuses impossible dates and times", () => {
    expect(parisDateTime("2027-02-31", "10:00")).toBeNull();
    expect(parisDateTime("2026-11-12", "24:00")).toBeNull();
    expect(parisDateTime("12/11/2026", "10:00")).toBeNull();
  });

  it("only accepts a coming date, within a year", () => {
    expect(readVisitInput("2026-11-12", "14:00", NOW)).toEqual({ visitAt: new Date("2026-11-12T13:00:00Z") });
    expect(readVisitInput("2026-11-04", "14:00", NOW)).toEqual({ error: expect.stringContaining("déjà passée") });
    expect(readVisitInput("2028-01-10", "14:00", NOW)).toEqual({ error: expect.stringContaining("12 prochains mois") });
    expect(readVisitInput("", "14:00", NOW)).toEqual({ error: "Choisissez le jour de la visite." });
    expect(readVisitInput("2026-11-12", undefined, NOW)).toEqual({ error: "Choisissez l'heure de la visite." });
  });

  it("formats the visit the way people say it", () => {
    const visit = new Date("2026-11-12T13:00:00Z");
    expect(formatVisit(visit)).toBe("jeudi 12 novembre à 14 h");
    expect(formatVisit("2026-11-12T13:30:00Z")).toBe("jeudi 12 novembre à 14 h 30");
    expect(formatVisitShort(visit)).toBe("jeu. 12 nov. à 14 h");
    expect(toVisitInputs(visit)).toEqual({ date: "2026-11-12", time: "14:00" });
  });
});

describe("visit message", () => {
  it("greets the customer by name when known", () => {
    const text = visitMessage({ companyName: "Toitures Martin", customerName: "Mme Le Goff", visitAt: "2026-11-12T13:00:00Z" });
    expect(text).toBe(
      "Bonjour Mme Le Goff, c'est Toitures Martin. Je vous propose de passer voir votre chantier le jeudi 12 novembre à 14 h. " +
        "Est-ce que cela vous convient ? Répondez-moi simplement à ce message.",
    );
  });

  it("stays polite without a name", () => {
    const text = visitMessage({ companyName: "Toitures Martin", customerName: "  ", visitAt: "2026-11-12T13:00:00Z" });
    expect(text.startsWith("Bonjour, c'est Toitures Martin.")).toBe(true);
  });
});

describe("shared missions", () => {
  it("knows the follow-up statuses only", () => {
    expect(isMissionStatus("placed")).toBe(true);
    expect(isMissionStatus("shared")).toBe(false);
    expect(isMissionStatus(undefined)).toBe(false);
  });

  it("promises the same 10 % everywhere", () => {
    expect(SHARE_REWARD_LABEL).toBe("+10 %");
    expect(SHARE_REWARD_PROMISE).toContain("10 %");
    expect(MISSION_STATUS_FOR_ARTISAN.placed).toContain("10 %");
  });

  it("reads an optional note", () => {
    expect(readNote("  Pas mon métier  ", 1000)).toEqual({ note: "Pas mon métier" });
    expect(readNote("   ", 1000)).toEqual({ note: null });
    expect(readNote(null, 1000)).toEqual({ note: null });
    expect(readNote("x".repeat(1001), 1000)).toEqual({ error: expect.stringContaining("trop long") });
  });
});
