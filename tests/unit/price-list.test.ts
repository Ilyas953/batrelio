import { describe, expect, it } from "vitest";
import { readPriceItemInput } from "@/lib/quotes/price-item-input";
import { applyPriceList, designationKey, priceListForPrompt, suggestPriceItems, type PriceItem } from "@/lib/quotes/price-list";

const ITEMS: PriceItem[] = [
  { id: "a", category: "equipment", designation: "Location nacelle 12 m", unit: "jour", unit_price_cents: 25_000, vat_rate_bp: 2000 },
  { id: "b", category: "labor", designation: "Élagage chêne", unit: "u", unit_price_cents: 45_000, vat_rate_bp: 1000 },
  { id: "c", category: "labor", designation: "Location broyeur", unit: "jour", unit_price_cents: 18_000, vat_rate_bp: 2000 },
];

describe("Mes prix", () => {
  it("treats the same wording with other capitals or spaces as one line", () => {
    expect(designationKey("  Location   NACELLE 12 m ")).toBe("location nacelle 12 m");
  });

  it("suggests the usual lines while typing, not the one already typed", () => {
    expect(suggestPriceItems(ITEMS, "locat").map((item) => item.id)).toEqual(["a", "c"]);
    expect(suggestPriceItems(ITEMS, "l")).toEqual([]);
    expect(suggestPriceItems(ITEMS, "Location nacelle 12 m")).toEqual([]);
  });

  it("shows the AI the artisan's lines, never their prices", () => {
    const { text, byRef } = priceListForPrompt(ITEMS);
    expect(text).toContain("[P1] equipment | Location nacelle 12 m | jour");
    expect(text).not.toMatch(/250|25000|€/);
    expect(byRef.get("P2")?.id).toBe("b");
  });
});

describe("AI draft priced from the artisan's own list", () => {
  const { byRef } = priceListForPrompt(ITEMS);

  it("takes wording, unit and price from the list, quantity from the AI", () => {
    const [line] = applyPriceList([{ category: "material", designation: "nacelle", quantity: 2, unit: "u", priceListRef: "P1" }], byRef, 2000);
    expect(line).toEqual({ category: "equipment", designation: "Location nacelle 12 m", quantity: 2, unit: "jour", unit_price_cents: 25_000, vat_rate_bp: 2000 });
  });

  it("leaves a new or unknown line unpriced: the artisan sets it", () => {
    const lines = applyPriceList(
      [
        { category: "labor", designation: "Démontage", quantity: 1, unit: "forfait", priceListRef: null },
        { category: "labor", designation: "Inventé", quantity: 1, unit: "u", priceListRef: "P99" },
      ],
      byRef,
      2000,
    );
    expect(lines.map((line) => line.unit_price_cents)).toEqual([null, null]);
    expect(lines[0].designation).toBe("Démontage");
  });

  it("never adds VAT for a company that does not charge it", () => {
    const [line] = applyPriceList([{ category: "labor", designation: "x", quantity: 1, unit: "u", priceListRef: "P2" }], byRef, 0);
    expect(line.vat_rate_bp).toBe(0);
  });
});

describe("a line typed in Mes prix", () => {
  const form = (fields: Record<string, string>) => {
    const data = new FormData();
    for (const [key, value] of Object.entries({ designation: "Location nacelle", category: "equipment", unit: "jour", price: "250", vat: "2000", ...fields })) {
      data.set(key, value);
    }
    return data;
  };

  it("reads wording, type, unit, price and VAT", () => {
    expect(readPriceItemInput(form({ price: "45,50" }), true)).toEqual({
      category: "equipment",
      designation: "Location nacelle",
      unit: "jour",
      unit_price_cents: 4550,
      vat_rate_bp: 2000,
    });
    expect(readPriceItemInput(form({}), false)).toMatchObject({ vat_rate_bp: 0 });
  });

  it("refuses what cannot go on a quote", () => {
    expect(readPriceItemInput(form({ designation: " " }), true)).toEqual({ error: "Décrivez la ligne." });
    expect(readPriceItemInput(form({ category: "pirate" }), true)).toEqual({ error: "Choisissez le type de ligne." });
    expect(readPriceItemInput(form({ unit: "litre" }), true)).toEqual({ error: "Choisissez l'unité." });
    expect(readPriceItemInput(form({ price: "abc" }), true)).toMatchObject({ error: expect.stringContaining("prix") });
    expect(readPriceItemInput(form({ vat: "1500" }), true)).toEqual({ error: "Choisissez le taux de TVA." });
  });
});
