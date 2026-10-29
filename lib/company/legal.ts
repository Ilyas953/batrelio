import type { Enums, Tables } from "@/lib/supabase/database.types";

export type LegalForm = Enums<"legal_form">;
export type VatRegime = Enums<"vat_regime">;

export const LEGAL_FORM_LABELS: Record<LegalForm, string> = {
  ei: "Entreprise individuelle (dont micro-entreprise)",
  eurl: "EURL",
  sarl: "SARL",
  sasu: "SASU",
  sas: "SAS",
  sa: "SA",
  snc: "SNC",
  autre: "Autre",
};

export function isLegalForm(value: string): value is LegalForm {
  return value in LEGAL_FORM_LABELS;
}

export function isVatRegime(value: string): value is VatRegime {
  return value === "subject" || value === "franchise";
}

// Companies (as opposed to sole traders) must print their share capital.
export function hasShareCapital(legalForm: LegalForm | "" | null): boolean {
  return legalForm !== "" && legalForm !== null && legalForm !== "ei" && legalForm !== "autre";
}

// 06 12 34 56 78 / +33 6 12 34 56 78 / 0033... -> +33612345678. Returns null if not a phone number.
export function toE164Phone(input: string): string | null {
  const compact = input.replace(/[\s.()-]/g, "").replace(/^00/, "+");
  if (/^0[1-9][0-9]{8}$/.test(compact)) return `+33${compact.slice(1)}`;
  if (/^\+[1-9][0-9]{6,14}$/.test(compact)) return compact;
  return null;
}

// French VAT number: FR + 2-digit key + SIREN, key = (12 + 3 × (SIREN mod 97)) mod 97.
export function toVatNumber(siren: string): string {
  const key = (12 + 3 * (Number(siren) % 97)) % 97;
  return `FR${String(key).padStart(2, "0")}${siren}`;
}

export function normalizeVatNumber(input: string): string {
  return input.replace(/[\s.-]/g, "").toUpperCase();
}

// Mentions a quote cannot do without, as the artisan reads them.
export function listMissingQuoteDetails(company: Tables<"companies">): string[] {
  const missing: string[] = [];

  if (!company.siret) missing.push("votre SIRET");
  if (!company.legal_name || !company.legal_form) missing.push("votre raison sociale");
  if (!company.address_line || !company.postal_code || !company.city) missing.push("votre adresse");
  if (hasShareCapital(company.legal_form) && company.share_capital_cents === null) {
    missing.push("votre capital social");
  }
  if (!company.vat_regime || (company.vat_regime === "subject" && !company.vat_number)) {
    missing.push("votre TVA");
  }
  if (!company.insurer_name || !company.insurance_policy_number || !company.insurance_coverage_area) {
    missing.push("votre assurance");
  }
  if (!company.mediator_name) missing.push("votre médiateur");

  return missing;
}
