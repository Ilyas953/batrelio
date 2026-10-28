"use server";

import { redirect } from "next/navigation";
import {
  SLUG_PATTERN,
  isValidSmsSenderName,
  toSlug,
  toSmsSenderName,
} from "@/lib/admin/company-defaults";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const MIN_PASSWORD_LENGTH = 8;
const UNIQUE_VIOLATION = "23505";

type AccountValues = {
  companyName: string;
  email: string;
  smsSenderName: string;
  slug: string;
};

export type CreateAccountState = { error?: string; values?: AccountValues };

function readAccountValues(formData: FormData): AccountValues {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const smsSenderName = String(formData.get("smsSenderName") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();

  return {
    companyName,
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    smsSenderName: smsSenderName || toSmsSenderName(companyName),
    slug: slug || toSlug(companyName),
  };
}

function findValidationError(values: AccountValues, password: string): string | null {
  if (!values.companyName) return "Indiquez le nom de l'entreprise.";
  if (!values.email.includes("@")) return "L'adresse e-mail n'est pas valide.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }
  if (!isValidSmsSenderName(values.smsSenderName)) {
    return "Nom d'expéditeur SMS invalide : 11 caractères max, lettres, chiffres et espaces, avec au moins une lettre.";
  }
  if (!SLUG_PATTERN.test(values.slug)) {
    return "Sous-domaine invalide : lettres minuscules, chiffres et tirets uniquement.";
  }
  return null;
}

export async function createAccount(
  _previous: CreateAccountState,
  formData: FormData,
): Promise<CreateAccountState> {
  await requireAdmin();

  const values = readAccountValues(formData);
  const password = String(formData.get("password") ?? "");
  const validationError = findValidationError(values, password);
  if (validationError) return { error: validationError, values };

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: values.email,
    password,
    email_confirm: true,
  });
  if (error) {
    const message =
      error.code === "email_exists"
        ? "Un compte existe déjà avec cette adresse e-mail."
        : "Le compte n'a pas pu être créé. Réessayez.";
    return { error: message, values };
  }

  const { error: companyError } = await supabase.from("companies").insert({
    owner_id: data.user.id,
    name: values.companyName,
    sms_sender_name: values.smsSenderName,
    slug: values.slug,
  });
  if (companyError) {
    // Never leave a user without a company.
    await supabase.auth.admin.deleteUser(data.user.id);
    const message =
      companyError.code === UNIQUE_VIOLATION
        ? "Ce sous-domaine est déjà utilisé par une autre entreprise."
        : "L'entreprise n'a pas pu être créée. Réessayez.";
    return { error: message, values };
  }

  redirect("/admin");
}
