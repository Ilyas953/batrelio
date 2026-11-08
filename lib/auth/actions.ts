"use server";

import { redirect } from "next/navigation";
import { RATE_RULES, TOO_MANY_ATTEMPTS, consumeRateLimit, isAllowedFromThisVisitor } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { NEXT_PATH_PARAM, safeNextPath } from "./next-path";
import { hasAdminRole } from "./session";

export type SignInState = { error?: string; email?: string };

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Per visitor (one person trying many accounts) and per account (many machines on one account).
  const allowed =
    (await isAllowedFromThisVisitor("signInPerIp")) &&
    (await consumeRateLimit("signInPerEmail", email.toLowerCase(), RATE_RULES.signInPerEmail));
  if (!allowed) return { error: TOO_MANY_ATTEMPTS, email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "E-mail ou mot de passe incorrect.", email };
  }

  redirect(safeNextPath(formData.get(NEXT_PATH_PARAM), hasAdminRole(data.user.app_metadata)));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
