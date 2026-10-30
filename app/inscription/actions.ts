"use server";

import type { AuthError } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { toSmsSenderNameOrFallback } from "@/lib/company/sms-sender";
import { isTrade, type Trade } from "@/lib/company/details";
import { LEGAL_VERSION } from "@/lib/legal/publisher";
import { createClient } from "@/lib/supabase/server";

const MIN_PASSWORD_LENGTH = 8;
const MAX_COMPANY_NAME_LENGTH = 120;

type SignUpValues = { companyName: string; trade: Trade | ""; email: string };

export type SignUpState = { error?: string; values?: SignUpValues; checkEmail?: boolean };

function readSignUpValues(formData: FormData): SignUpValues {
  const trade = String(formData.get("trade") ?? "");

  return {
    companyName: String(formData.get("companyName") ?? "").trim(),
    trade: isTrade(trade) ? trade : "",
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  };
}

function findSignUpValidationError(
  values: SignUpValues,
  password: string,
  acceptedTerms: boolean,
): string | null {
  if (!values.companyName) return "Indiquez le nom de votre entreprise.";
  if (values.companyName.length > MAX_COMPANY_NAME_LENGTH) {
    return "Le nom de l'entreprise est trop long.";
  }
  if (!values.email.includes("@")) return "L'adresse e-mail n'est pas valide.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Choisissez un mot de passe d'au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }
  if (!acceptedTerms) {
    return "Pour créer votre compte, acceptez les conditions générales et la politique de confidentialité.";
  }
  return null;
}

function toSignUpErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "user_already_exists":
    case "email_exists":
      return "Un compte existe déjà avec cette adresse e-mail. Connectez-vous.";
    case "weak_password":
      return "Ce mot de passe est trop simple. Choisissez-en un plus long.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Trop de tentatives. Réessayez dans quelques minutes.";
    // Supabase settings, not the artisan's fault: Authentication > Sign In / Providers.
    case "email_provider_disabled":
    case "signup_disabled":
      return "Les inscriptions sont momentanément indisponibles. Réessayez un peu plus tard.";
    default:
      return "Le compte n'a pas pu être créé. Réessayez.";
  }
}

export async function signUp(_previous: SignUpState, formData: FormData): Promise<SignUpState> {
  const values = readSignUpValues(formData);
  const password = String(formData.get("password") ?? "");
  const acceptedTerms = formData.get("acceptTerms") === "on";
  const validationError = findSignUpValidationError(values, password, acceptedTerms);
  if (validationError) return { error: validationError, values };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      // Read by the create_company_on_signup trigger.
      data: {
        company_name: values.companyName,
        sms_sender_name: toSmsSenderNameOrFallback(values.companyName),
        trade: values.trade || null,
        // The trigger records this version and the acceptance time on the company.
        terms_version: LEGAL_VERSION,
      },
    },
  });
  if (error) {
    // The artisan gets a plain message; the real cause goes to the server logs.
    console.error(`Inscription refusée par Supabase : ${error.code ?? error.status} ${error.message}`);
    return { error: toSignUpErrorMessage(error), values };
  }

  // No session: email confirmation is enabled, the account opens from the link.
  if (!data.session) return { checkEmail: true, values };

  redirect("/espace");
}
