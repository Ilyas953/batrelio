"use server";

import { RATE_RULES, TOO_MANY_ATTEMPTS, consumeRateLimit, isAllowedFromThisVisitor } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { findNewPasswordError } from "./password";
import { requireUser } from "./session";

export type PasswordResetState = { error?: string; sent?: boolean; email?: string };

// Sends the "choose a new password" e-mail (through the project's SMTP, Brevo).
export async function requestPasswordReset(_previous: PasswordResetState, formData: FormData): Promise<PasswordResetState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "L'adresse e-mail n'est pas valide.", email };

  const allowed =
    (await isAllowedFromThisVisitor("passwordResetPerIp")) &&
    (await consumeRateLimit("passwordResetPerEmail", email, RATE_RULES.passwordResetPerEmail));
  if (!allowed) return { error: TOO_MANY_ATTEMPTS, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  // Never tell whether the account exists; the real cause goes to the logs.
  if (error && error.code !== "user_not_found") {
    console.error(`E-mail de mot de passe non envoyé : ${error.code ?? error.status} ${error.message}`);
    if (error.code === "over_email_send_rate_limit") return { error: TOO_MANY_ATTEMPTS, email };
  }
  return { sent: true, email };
}

export type NewPasswordState = { error?: string; saved?: boolean };

// From the e-mail link (the session was opened by /auth/confirm) or from Réglages.
export async function updatePassword(_previous: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const { supabase } = await requireUser();
  const password = String(formData.get("password") ?? "");
  const invalid = findNewPasswordError(password);
  if (invalid) return { error: invalid };

  const { error } = await supabase.auth.updateUser({ password });
  if (!error) return { saved: true };
  if (error.code === "same_password") return { error: "C'est déjà votre mot de passe actuel : choisissez-en un autre." };
  if (error.code === "weak_password") return { error: "Ce mot de passe est trop simple. Choisissez-en un plus long." };
  console.error(`Mot de passe non changé : ${error.code ?? error.status} ${error.message}`);
  return { error: "Le mot de passe n'a pas pu être changé. Réessayez." };
}
