import { describe, expect, it } from "vitest";
import { listMissingBeforeSending, QuoteEditorInputSchema, type QuoteEditorInput } from "@/lib/quotes/editor-input";
import {
  centsToInput,
  computeTotals,
  depositCents,
  lineTotalCents,
  parseEurosInput,
  parseQuantityInput,
} from "@/lib/quotes/totals";

describe("quote totals", () => {
  const lines = [
    { quantity: 110, unitPriceCents: 1250, vatRateBp: 1000 }, // 110 m² at 12.50 €, 10 %
    { quantity: 1, unitPriceCents: 35000, vatRateBp: 2000 }, // 350 € at 20 %
    { quantity: 2.5, unitPriceCents: 4500, vatRateBp: 1000 }, // 2.5 h at 45 €, 10 %
  ];

  it("adds VAT per rate, highest rate first", () => {
    const totals = computeTotals(lines, true);
    expect(totals.subtotalCents).toBe(137500 + 35000 + 11250);
    expect(totals.vatBreakdown).toEqual([
      { rateBp: 2000, baseCents: 35000, vatCents: 7000 },
      { rateBp: 1000, baseCents: 148750, vatCents: 14875 },
    ]);
    expect(totals.totalCents).toBe(totals.subtotalCents + 7000 + 14875);
  });

  it("charges no VAT at all under the franchise (art. 293 B du CGI)", () => {
    const totals = computeTotals(lines, false);
    expect(totals.vatCents).toBe(0);
    expect(totals.vatBreakdown).toEqual([]);
    expect(totals.totalCents).toBe(totals.subtotalCents);
  });

  it("counts a line without price as zero, and rounds to the cent", () => {
    expect(lineTotalCents({ quantity: 3, unitPriceCents: null })).toBe(0);
    expect(lineTotalCents({ quantity: 0.33, unitPriceCents: 1001 })).toBe(330);
    expect(computeTotals([], true).totalCents).toBe(0);
  });

  it("computes the deposit, or none", () => {
    expect(depositCents(234000, 30)).toBe(70200);
    expect(depositCents(234000, 0)).toBeNull();
    expect(depositCents(234000, null)).toBeNull();
  });
});

describe("price and quantity fields", () => {
  it("reads euros the way artisans type them", () => {
    expect(parseEurosInput("12,50")).toBe(1250);
    expect(parseEurosInput("12.5")).toBe(1250);
    expect(parseEurosInput("1 250 €")).toBe(125000);
    expect(parseEurosInput("")).toBeNull();
    expect(parseEurosInput("douze")).toBeNaN();
    expect(parseEurosInput("-5")).toBeNaN();
    expect(parseEurosInput("1,234")).toBeNaN();
  });

  it("reads quantities", () => {
    expect(parseQuantityInput("2,5")).toBe(2.5);
    expect(parseQuantityInput("110")).toBe(110);
    expect(parseQuantityInput("-1")).toBeNaN();
    expect(parseQuantityInput("")).toBeNaN();
  });

  it("shows cents back in French format", () => {
    expect(centsToInput(1250)).toBe("12,5");
    expect(centsToInput(125000)).toBe("1250");
    expect(centsToInput(null)).toBe("");
  });
});

describe("before sending a quote", () => {
  const complete: QuoteEditorInput = QuoteEditorInputSchema.parse({
    title: "Réfection de toiture",
    customerName: "Mme Le Goff",
    customerAddress: "14 rue de Brest, Quimper",
    workStartDate: "",
    workDuration: "3 jours",
    validityDays: 30,
    depositPercent: 30,
    wasteManagement: "",
    notes: "",
    lines: [
      { category: "labor", designation: "Dépose et repose", quantity: 1, unit: "forfait", unitPriceCents: 120000, vatRateBp: 1000 },
    ],
  });

  it("lets a complete quote go", () => {
    expect(listMissingBeforeSending(complete)).toEqual([]);
  });

  it("lists what is missing in plain words", () => {
    const missing = listMissingBeforeSending({
      ...complete,
      customerName: "",
      lines: [{ ...complete.lines[0], unitPriceCents: null }],
      workDuration: "",
    });
    expect(missing).toEqual(["le nom du client", "le prix de chaque ligne", "la durée estimée des travaux"]);
  });

  it("refuses a quote without lines", () => {
    expect(listMissingBeforeSending({ ...complete, lines: [] })).toContain("au moins une ligne");
  });
});

describe("what the server accepts from the quote editor", () => {
  const line = { category: "labor", designation: "Main d'oeuvre", quantity: 1, unit: "h", unitPriceCents: 4500, vatRateBp: 1000 };
  const base = {
    title: "",
    customerName: "",
    customerAddress: "",
    depositPercent: 30,
    validityDays: 30,
    workStartDate: "",
    workDuration: "",
    wasteManagement: "",
    notes: "",
  };

  it("refuses a VAT rate that does not exist in France", () => {
    expect(QuoteEditorInputSchema.safeParse({ ...base, lines: [{ ...line, vatRateBp: 1500 }] }).success).toBe(false);
  });

  it("refuses negative prices and absurd deposits", () => {
    expect(QuoteEditorInputSchema.safeParse({ ...base, lines: [{ ...line, unitPriceCents: -100 }] }).success).toBe(false);
    expect(QuoteEditorInputSchema.safeParse({ ...base, depositPercent: 150, lines: [] }).success).toBe(false);
  });

  it("refuses a line without description", () => {
    expect(QuoteEditorInputSchema.safeParse({ ...base, lines: [{ ...line, designation: "  " }] }).success).toBe(false);
  });
});
