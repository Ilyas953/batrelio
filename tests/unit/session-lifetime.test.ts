import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_OPTIONS, withAuthCookieLifetime } from "@/lib/supabase/cookie-options";

const THIRTEEN_MONTHS = 395 * 24 * 60 * 60;

describe("staying signed in", () => {
  it("keeps the session cookie 13 months, even after closing the browser", () => {
    expect(AUTH_COOKIE_OPTIONS.maxAge).toBe(THIRTEEN_MONTHS);
    // What the Supabase library asks for on every refresh: 400 days.
    expect(withAuthCookieLifetime({ maxAge: 400 * 24 * 60 * 60, path: "/" })).toEqual({ maxAge: THIRTEEN_MONTHS, path: "/" });
  });

  it("still lets sign-out remove the cookie", () => {
    expect(withAuthCookieLifetime({ maxAge: 0 })).toEqual({ maxAge: 0 });
    expect(withAuthCookieLifetime({ maxAge: undefined, path: "/" })).toEqual({ maxAge: undefined, path: "/" });
  });
});
