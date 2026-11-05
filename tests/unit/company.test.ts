import { describe, expect, it } from "vitest";
import { formatSiret, isValidSiret, normalizeSiret } from "@/lib/company/details";
import { normalizeVatNumber, toE164Phone, toVatNumber } from "@/lib/company/legal";
import { isValidSmsSenderName, toSmsSenderName, toSmsSenderNameOrFallback } from "@/lib/company/sms-sender";
import { formatPhone } from "@/lib/format";

describe("SIRET", () => {
  it("accepts a real SIRET and rejects a mistyped one", () => {
    expect(isValidSiret("13212220100016")).toBe(true);
    expect(isValidSiret("13212220100017")).toBe(false);
    expect(isValidSiret("1321222010001")).toBe(false);
  });

  // La Poste's establishments share one SIREN: their SIRET digits add up to a multiple of 5
  // instead of passing the Luhn check. Both numbers below are built for the test.
  it("applies La Poste's special rule", () => {
    expect(isValidSiret("35600000000001")).toBe(true); // digits sum to 15, fails Luhn
    expect(isValidSiret("35600000000002")).toBe(false);
  });

  it("cleans and formats what the artisan types", () => {
    expect(normalizeSiret("132 122 201 00016")).toBe("13212220100016");
    expect(formatSiret("13212220100016")).toBe("132 122 201 00016");
  });
});

describe("intra-community VAT number", () => {
  it("computes the key from the SIREN", () => {
    const siren = "132122201";
    const key = (12 + 3 * (Number(siren) % 97)) % 97;
    expect(toVatNumber(siren)).toBe(`FR${String(key).padStart(2, "0")}${siren}`);
    expect(toVatNumber(siren)).toMatch(/^FR\d{2}\d{9}$/);
  });

  it("normalises what is typed", () => {
    expect(normalizeVatNumber("fr 12.345 678 901")).toBe("FR12345678901");
  });
});

describe("phone numbers", () => {
  it("turns French formats into E.164", () => {
    expect(toE164Phone("06 12 34 56 78")).toBe("+33612345678");
    expect(toE164Phone("06.12.34.56.78")).toBe("+33612345678");
    expect(toE164Phone("0033612345678")).toBe("+33612345678");
    expect(toE164Phone("+33 6 12 34 56 78")).toBe("+33612345678");
  });

  it("rejects what is not a phone number", () => {
    expect(toE164Phone("abc")).toBeNull();
    expect(toE164Phone("0612")).toBeNull();
    expect(toE164Phone("")).toBeNull();
  });

  it("shows French numbers the French way", () => {
    expect(formatPhone("+33612345678")).toBe("06 12 34 56 78");
    expect(formatPhone("+447700900123")).toBe("+447700900123");
  });
});

describe("SMS sender name (11 characters, letters and digits)", () => {
  it("derives it from the company name", () => {
    expect(toSmsSenderName("Élagage du Val")).toBe("ELAGAGEDUVA");
    expect(toSmsSenderName("Toitures Martin & Fils")).toBe("TOITURESMAR");
  });

  it("falls back to BATRELIO when nothing usable is left", () => {
    expect(toSmsSenderNameOrFallback("123")).toBe("BATRELIO");
    expect(toSmsSenderNameOrFallback("***")).toBe("BATRELIO");
  });

  it("requires at least one letter (operators refuse digits only)", () => {
    expect(isValidSmsSenderName("12345")).toBe(false);
    expect(isValidSmsSenderName("PLOMBROUX")).toBe(true);
    expect(isValidSmsSenderName("TROPLONGNOM1")).toBe(false);
  });
});
