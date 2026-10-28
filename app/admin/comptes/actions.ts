"use server";

import { redirect } from "next/navigation";
import {
  findCompanyValidationError,
  readCompanyValues,
  toCompanyColumns,
  type CompanyValues,
} from "@/lib/admin/company-form";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const MIN_PASSWORD_LENGTH = 8;

type AccountValues = CompanyValues & { email: string };

export type CreateAccountState = { error?: string; values?: AccountValues };
export type UpdateCompanyState = { error?: string; values?: CompanyValues };

function findAccountValidationError(values: AccountValues, password: string): string | null {
  if (!values.email.includes("@")) return "L'adresse e-mail n'est pas valide.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`;
  }
  return findCompanyValidationError(values);
}

export async function createAccount(
  _previous: CreateAccountState,
  formData: FormData,
): Promise<CreateAccountState> {
  await requireAdmin();

  const values: AccountValues = {
    ...readCompanyValues(formData),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  };
  const password = String(formData.get("password") ?? "");
  const validationError = findAccountValidationError(values, password);
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

  const { error: companyError } = await supabase
    .from("companies")
    .insert({ owner_id: data.user.id, ...toCompanyColumns(values) });
  if (companyError) {
    // Never leave a user without a company.
    await supabase.auth.admin.deleteUser(data.user.id);
    return { error: "L'entreprise n'a pas pu être créée. Réessayez.", values };
  }

  redirect("/admin");
}

export async function updateCompany(
  companyId: string,
  _previous: UpdateCompanyState,
  formData: FormData,
): Promise<UpdateCompanyState> {
  await requireAdmin();

  const values = readCompanyValues(formData);
  const validationError = findCompanyValidationError(values);
  if (validationError) return { error: validationError, values };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("companies")
    .update(toCompanyColumns(values))
    .eq("id", companyId);
  if (error) {
    return { error: "Les modifications n'ont pas pu être enregistrées. Réessayez.", values };
  }

  redirect("/admin");
}
