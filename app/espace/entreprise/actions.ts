"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { isValidSiret, normalizeSiret } from "@/lib/company/details";
import {
  findProfileValidationError,
  readProfileValues,
  toCompanyProfileColumns,
  type ProfileValues,
} from "@/lib/company/profile-form";
import { lookupCompanyBySiret } from "@/lib/company/registry";

export type SiretLookupResult = {
  tone: "success" | "warning" | "error";
  message: string;
  values?: Partial<ProfileValues>;
};

export async function lookupSiret(siretInput: string): Promise<SiretLookupResult> {
  await requireUser();

  const siret = normalizeSiret(siretInput);
  if (!isValidSiret(siret)) {
    return { tone: "error", message: "Ce SIRET n'existe pas : vérifiez les 14 chiffres." };
  }

  const lookup = await lookupCompanyBySiret(siret);
  if (lookup.status === "unavailable") {
    return {
      tone: "warning",
      message: "Le registre des entreprises ne répond pas pour l'instant. Vous pouvez remplir à la main.",
    };
  }
  if (lookup.status === "not_found") {
    return { tone: "error", message: "Aucune entreprise trouvée avec ce SIRET." };
  }

  const { company } = lookup;
  const values: Partial<ProfileValues> = {
    siret,
    name: company.name,
    legalName: company.legalName,
    legalForm: company.legalForm,
    nafCode: company.nafCode,
    trade: company.trade,
    addressLine: company.addressLine,
    postalCode: company.postalCode,
    city: company.city,
    region: company.region,
    vatRegime: company.vatNumber ? "subject" : undefined,
    vatNumber: company.vatNumber,
  };

  if (lookup.closed) {
    return { tone: "warning", message: "Attention : cette entreprise est indiquée comme fermée au registre.", values };
  }
  if (!company.legalName || !company.addressLine) {
    return {
      tone: "warning",
      message: "Une partie de vos informations n'est pas publique : complétez ce qui manque à la main.",
      values,
    };
  }
  return {
    tone: "success",
    message: "Informations trouvées au registre des entreprises. Vérifiez-les avant d'enregistrer.",
    values,
  };
}

export async function saveCompanyProfile(formData: FormData): Promise<{ error: string }> {
  const { supabase, claims } = await requireUser();

  const values = readProfileValues(formData);
  const validationError = findProfileValidationError(values);
  if (validationError) return { error: validationError };

  // RLS limits the update to the artisan's own company.
  const { data, error } = await supabase
    .from("companies")
    .update(toCompanyProfileColumns(values))
    .eq("owner_id", claims.sub)
    .select("id");
  if (error) return { error: "Les modifications n'ont pas pu être enregistrées. Réessayez." };
  if (data.length === 0) return { error: "Aucune entreprise n'est liée à ce compte." };

  redirect("/espace");
}
