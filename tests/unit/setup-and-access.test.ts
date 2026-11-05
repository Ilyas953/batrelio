import { describe, expect, it } from "vitest";
import { hasAdminRole, isTestAccount } from "@/lib/auth/session";
import { safeReturnTo } from "@/lib/espace/return-to";
import { computeSetupSteps, hasCompanyIdentity } from "@/lib/espace/setup";
import { blankCompany, IDENTIFIED, INSURED } from "./fixtures";

const doneIds = (steps: ReturnType<typeof computeSetupSteps>) => steps.filter((step) => step.done).map((step) => step.id);

describe("setup guide", () => {
  it("starts with nothing done after signup", () => {
    expect(doneIds(computeSetupSteps(blankCompany(), false))).toEqual([]);
  });

  it("follows the artisan's progress, step by step", () => {
    const identified = blankCompany(IDENTIFIED);
    expect(doneIds(computeSetupSteps(identified, false))).toEqual(["company"]);

    const insured = blankCompany({ ...IDENTIFIED, ...INSURED });
    expect(doneIds(computeSetupSteps(insured, false))).toEqual(["company", "insurance"]);

    const withNumber = blankCompany({ ...IDENTIFIED, ...INSURED, phone_number: "+33939000003", auto_reply_enabled: true });
    expect(doneIds(computeSetupSteps(withNumber, false))).toEqual(["company", "insurance", "number"]);

    const forwarded = { ...withNumber, call_forwarding_confirmed_at: "2026-11-05T10:00:00Z" };
    expect(doneIds(computeSetupSteps(forwarded, false))).toEqual(["company", "insurance", "number", "forwarding"]);
    expect(doneIds(computeSetupSteps(forwarded, true))).toHaveLength(5);
  });

  it("does not count a paused number as set up", () => {
    const paused = blankCompany({ phone_number: "+33939000003", auto_reply_enabled: false });
    expect(doneIds(computeSetupSteps(paused, false))).not.toContain("number");
  });

  it("takes a first real call as proof that forwarding works", () => {
    expect(doneIds(computeSetupSteps(blankCompany({ phone_number: "+33939000003" }), true))).toContain("forwarding");
  });

  it("requires a VAT number only from companies that charge VAT", () => {
    expect(hasCompanyIdentity(blankCompany({ ...IDENTIFIED, vat_regime: "franchise" }))).toBe(true);
    expect(hasCompanyIdentity(blankCompany({ ...IDENTIFIED, vat_regime: "subject", vat_number: null }))).toBe(false);
    expect(hasCompanyIdentity(blankCompany({ ...IDENTIFIED, vat_regime: "subject", vat_number: "FR00132122201" }))).toBe(true);
  });

  it("requires every identity field before a number can be given", () => {
    for (const field of Object.keys(IDENTIFIED)) {
      expect(hasCompanyIdentity(blankCompany({ ...IDENTIFIED, [field]: null })), field).toBe(false);
    }
  });
});

describe("return address after a form", () => {
  it("only sends the artisan back to known pages", () => {
    expect(safeReturnTo("/espace/demarrage", "/espace")).toBe("/espace/demarrage");
    expect(safeReturnTo("https://evil.example", "/espace")).toBe("/espace");
    expect(safeReturnTo("//evil.example", "/espace")).toBe("/espace");
    expect(safeReturnTo("/admin", "/espace")).toBe("/espace");
    expect(safeReturnTo(undefined, "/espace")).toBe("/espace");
    expect(safeReturnTo(["/espace/demarrage"], "/espace")).toBe("/espace");
  });
});

describe("roles", () => {
  it("only grants admin for the exact role", () => {
    expect(hasAdminRole({ role: "admin" })).toBe(true);
    expect(hasAdminRole({ role: "Admin" })).toBe(false);
    expect(hasAdminRole({ role: ["admin"] })).toBe(false);
    expect(hasAdminRole(null)).toBe(false);
    expect(hasAdminRole("admin")).toBe(false);
  });

  it("only treats an account as test when the flag is exactly true", () => {
    expect(isTestAccount({ test_account: true })).toBe(true);
    expect(isTestAccount({ test_account: "true" })).toBe(false);
    expect(isTestAccount({})).toBe(false);
    expect(isTestAccount(undefined)).toBe(false);
  });
});
