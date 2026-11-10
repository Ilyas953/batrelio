import { describe, expect, it } from "vitest";
import { EMAIL_LINK_TARGETS, PASSWORD_RESET_SENT, findNewPasswordError, isEmailLinkType } from "@/lib/auth/password";

describe("new password", () => {
  it("needs 8 characters at least, 72 at most", () => {
    expect(findNewPasswordError("court")).toContain("au moins 8");
    expect(findNewPasswordError("un-bon-mot-de-passe")).toBeNull();
    expect(findNewPasswordError("x".repeat(73))).toContain("trop long");
  });
});

describe("links sent by e-mail", () => {
  it("open the right page once checked", () => {
    expect(EMAIL_LINK_TARGETS.recovery).toBe("/espace/mot-de-passe");
    expect(EMAIL_LINK_TARGETS.email).toBe("/espace/demarrage");
  });

  it("only accept the kinds of link Batrelio sends", () => {
    expect(isEmailLinkType("recovery")).toBe(true);
    expect(isEmailLinkType("magiclink")).toBe(false);
    expect(isEmailLinkType("constructor")).toBe(false);
    expect(isEmailLinkType(null)).toBe(false);
  });

  it("never reveal whether an account exists", () => {
    expect(PASSWORD_RESET_SENT).toMatch(/^Si un compte existe/);
  });
});
