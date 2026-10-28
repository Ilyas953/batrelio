import type { TablesUpdate } from "@/lib/supabase/database.types";
import { isValidSmsSenderName, toSmsSenderName } from "./company-defaults";
import {
  isRegion,
  isTrade,
  isValidSiret,
  normalizeSiret,
  type Region,
  type Trade,
} from "./company-details";

export type CompanyValues = {
  companyName: string;
  smsSenderName: string;
  siret: string;
  trade: Trade | "";
  region: Region | "";
};

function readText(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export function readCompanyValues(formData: FormData): CompanyValues {
  const companyName = readText(formData, "companyName");
  const trade = readText(formData, "trade");
  const region = readText(formData, "region");

  return {
    companyName,
    smsSenderName: readText(formData, "smsSenderName") || toSmsSenderName(companyName),
    siret: normalizeSiret(readText(formData, "siret")),
    trade: isTrade(trade) ? trade : "",
    region: isRegion(region) ? region : "",
  };
}

export function findCompanyValidationError(values: CompanyValues): string | null {
  if (!values.companyName) return "Indiquez le nom de l'entreprise.";
  if (!isValidSmsSenderName(values.smsSenderName)) {
    return "Nom d'expéditeur SMS invalide : 11 caractères max, lettres, chiffres et espaces, avec au moins une lettre.";
  }
  if (values.siret && !/^[0-9]{14}$/.test(values.siret)) {
    return "Le SIRET doit contenir 14 chiffres.";
  }
  if (values.siret && !isValidSiret(values.siret)) {
    return "Ce SIRET n'existe pas : vérifiez les chiffres.";
  }
  return null;
}

export function toCompanyColumns(values: CompanyValues) {
  return {
    name: values.companyName,
    sms_sender_name: values.smsSenderName,
    siret: values.siret || null,
    trade: values.trade || null,
    region: values.region || null,
  } satisfies TablesUpdate<"companies">;
}
