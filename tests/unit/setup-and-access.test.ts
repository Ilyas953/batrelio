import { describe, expect, it } from "vitest";
import { hasAdminRole, isTestAccount } from "@/lib/auth/session";
import { returnLink, safeReturnTo, withReturnTo } from "@/lib/espace/return-to";
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
    expect(safeReturnTo("/espace/demarrage", "/espace/reglages")).toBe("/espace/demarrage");
    expect(safeReturnTo("/espace", "/espace/reglages")).toBe("/espace");
    expect(safeReturnTo("https://evil.example", "/espace")).toBe("/espace");
    expect(safeReturnTo("//evil.example", "/espace")).toBe("/espace");
    expect(safeReturnTo("/admin", "/espace")).toBe("/espace");
    expect(safeReturnTo(undefined, "/espace")).toBe("/espace");
    expect(safeReturnTo(["/espace/demarrage"], "/espace")).toBe("/espace");
    expect(safeReturnTo("/espace/devis/../../admin", "/espace")).toBe("/espace");
    expect(safeReturnTo("/espace/devis/not-a-quote", "/espace")).toBe("/espace");
    expect(safeReturnTo("constructor", "/espace")).toBe("/espace");
  });

  it("names the page on the back link", () => {
    const quotePage = "/espace/devis/0b6f1c2e-6a4f-4d3b-9c1e-2f3a4b5c6d7e";
    expect(returnLink(quotePage, "/espace/reglages")).toEqual({ href: quotePage, label: "Le devis" });
    expect(returnLink("/espace/reponse-automatique", "/espace/reglages")).toEqual({
      href: "/espace/reponse-automatique",
      label: "Réponse automatique",
    });
    expect(returnLink(undefined, "/espace/reglages")).toEqual({ href: "/espace/reglages", label: "Réglages" });
    expect(returnLink("https://evil.example", "/espace")).toEqual({ href: "/espace", label: "Demandes" });
  });

  it("builds a link that brings the artisan back", () => {
    expect(withReturnTo("/espace/messages", "/espace/demarrage")).toBe("/espace/messages?retour=/espace/demarrage");
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
