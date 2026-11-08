import { describe, expect, it } from "vitest";
import { loginUrlFor, safeNextPath } from "@/lib/auth/next-path";
import { toFrenchMobile } from "@/lib/telephony/french-mobile";

describe("page to come back to after signing in", () => {
  it("returns to the request opened from the SMS", () => {
    expect(safeNextPath("/espace/demandes/0b6f1c2e-6a4f-4d3b-9c1e-2f3a4b5c6d7e", false)).toBe("/espace/demandes/0b6f1c2e-6a4f-4d3b-9c1e-2f3a4b5c6d7e");
    expect(safeNextPath("/espace/demandes/abc?partager=1#partager", false)).toBe("/espace/demandes/abc?partager=1#partager");
  });

  it("never leaves the app", () => {
    for (const value of ["https://evil.example", "//evil.example", "/espace//evil.example", "/\\\\evil.example", "/espace/../admin", "javascript:alert(1)", "/autre"]) {
      expect(safeNextPath(value, false), value).toBe("/espace");
    }
    expect(safeNextPath(undefined, true)).toBe("/admin");
  });

  it("keeps the admin area for admins", () => {
    expect(safeNextPath("/admin/missions", false)).toBe("/espace");
    expect(safeNextPath("/admin/missions", true)).toBe("/admin/missions");
  });

  it("builds the login link", () => {
    expect(loginUrlFor("/espace/demandes/abc?partager=1")).toBe("/connexion?suite=%2Fespace%2Fdemandes%2Fabc%3Fpartager%3D1");
  });
});

describe("mobile asked at sign-up", () => {
  it("only accepts a French mobile", () => {
    expect(toFrenchMobile("06 12 34 56 78")).toBe("+33612345678");
    expect(toFrenchMobile("+33 7 12 34 56 78")).toBe("+33712345678");
    expect(toFrenchMobile("01 45 67 89 01")).toBeNull();
    expect(toFrenchMobile("")).toBeNull();
  });
});
