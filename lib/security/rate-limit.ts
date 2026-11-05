import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// Our server talks to Supabase Auth for every visitor, so Supabase only sees our servers' address:
// attempts are limited here, per visitor address and per account.

type RateRule = { limit: number; windowSeconds: number };

const MINUTE = 60;
const HOUR = 60 * MINUTE;

export const RATE_RULES = {
  signInPerIp: { limit: 20, windowSeconds: 15 * MINUTE },
  signInPerEmail: { limit: 8, windowSeconds: 15 * MINUTE },
  signUpPerIp: { limit: 5, windowSeconds: HOUR },
  customerRequestPerIp: { limit: 15, windowSeconds: HOUR },
} satisfies Record<string, RateRule>;

export type RateScope = keyof typeof RATE_RULES | "numberPurchase" | "greetingPreview";

// The hosting platform sets these headers itself; a visitor cannot choose their value there.
export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-real-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}

function bucketKey(scope: RateScope, identifier: string): string {
  return `${scope}:${createHash("sha256").update(identifier).digest("hex")}`;
}

// Counts the attempt. Fails open: a database hiccup must not lock everybody out.
export async function consumeRateLimit(scope: RateScope, identifier: string, rule: RateRule): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("consume_rate_limit", {
    p_key: bucketKey(scope, identifier),
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  });
  if (error) {
    console.error(`Limiteur de tentatives indisponible (${scope}) :`, error.message);
    return true;
  }
  return data;
}

export async function isAllowedFromThisVisitor(scope: keyof typeof RATE_RULES): Promise<boolean> {
  return consumeRateLimit(scope, await getClientIp(), RATE_RULES[scope]);
}

export const TOO_MANY_ATTEMPTS = "Trop de tentatives. Patientez quelques minutes, puis réessayez.";
