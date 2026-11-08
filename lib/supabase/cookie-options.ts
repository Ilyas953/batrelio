import type { CookieOptionsWithName } from "@supabase/ssr";

// The CNIL recommends that trackers live 13 months at most. The session cookie is renewed
// while the artisan keeps using Batrelio, so they stay signed in on their phone.
const AUTH_COOKIE_LIFETIME_DAYS = 395;

export const AUTH_COOKIE_LIFETIME_LABEL = "13 mois";

export const AUTH_COOKIE_OPTIONS: CookieOptionsWithName = {
  maxAge: AUTH_COOKIE_LIFETIME_DAYS * 24 * 60 * 60,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

const AUTH_COOKIE_MAX_AGE = AUTH_COOKIE_LIFETIME_DAYS * 24 * 60 * 60;

// The Supabase library writes its own lifetime (400 days) on every session cookie: keep ours,
// as announced in the privacy policy. A removal (max-age 0) stays a removal.
export function withAuthCookieLifetime<T extends { maxAge?: number }>(options: T): T {
  return options.maxAge && options.maxAge > AUTH_COOKIE_MAX_AGE ? { ...options, maxAge: AUTH_COOKIE_MAX_AGE } : options;
}
