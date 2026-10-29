import type { Tables, TablesUpdate } from "@/lib/supabase/database.types";
import { isRegion, isTrade, isValidSiret, normalizeSiret } from "./details";
import {
  hasShareCapital,
  isLegalForm,
  isVatRegime,
  normalizeVatNumber,
  toE164Phone,
  toVatNumber,
} from "./legal";
import { isValidSmsSenderName } from "./sms-sender";

// Every field as typed in the form. Saving accepts an incomplete profile:
// only malformed values are refused, missing ones are listed on the dashboard.
export type ProfileValues = {
  siret: string;
  name: string;
  smsSenderName: string;
  legalName: string;
  legalForm: string;
  nafCode: string;
  trade: string;
  shareCapital: string;
  addressLine: string;
  postalCode: string;
  city: string;
  region: string;
  vatRegime: string;
  vatNumber: string;
  insurerName: string;
  insurerAddress: string;
  insurancePolicyNumber: string;
  insuranceCoverageArea: string;
  mediatorName: string;
  mediatorWebsite: string;
  contactPhone: string;
  contactEmail: string;
};

const PROFILE_FIELDS = [
  "siret", "name", "smsSenderName", "legalName", "legalForm", "nafCode", "trade", "shareCapital",
  "addressLine", "postalCode", "city", "region", "vatRegime", "vatNumber", "insurerName",
  "insurerAddress", "insurancePolicyNumber", "insuranceCoverageArea", "mediatorName",
  "mediatorWebsite", "contactPhone", "contactEmail",
] as const satisfies readonly (keyof ProfileValues)[];

export function readProfileValues(formData: FormData): ProfileValues {
  return Object.fromEntries(
    PROFILE_FIELDS.map((field) => [field, String(formData.get(field) ?? "").trim()]),
  ) as ProfileValues;
}

function centsToEuros(cents: number | null): string {
  return cents === null ? "" : String(cents / 100);
}

export function toProfileValues(company: Tables<"companies">, fallbackEmail: string): ProfileValues {
  return {
    siret: company.siret ?? "",
    name: company.name,
    smsSenderName: company.sms_sender_name,
    legalName: company.legal_name ?? "",
    legalForm: company.legal_form ?? "",
    nafCode: company.naf_code ?? "",
    trade: company.trade ?? "",
    shareCapital: centsToEuros(company.share_capital_cents),
    addressLine: company.address_line ?? "",
    postalCode: company.postal_code ?? "",
    city: company.city ?? "",
    region: company.region ?? "",
    vatRegime: company.vat_regime ?? "",
    vatNumber: company.vat_number ?? "",
    insurerName: company.insurer_name ?? "",
    insurerAddress: company.insurer_address ?? "",
    insurancePolicyNumber: company.insurance_policy_number ?? "",
    insuranceCoverageArea: company.insurance_coverage_area ?? "",
    mediatorName: company.mediator_name ?? "",
    mediatorWebsite: company.mediator_website ?? "",
    contactPhone: company.contact_phone ?? "",
    contactEmail: company.contact_email ?? fallbackEmail,
  };
}

// "10 000,50" -> 1000050 cents. Null when empty, NaN when not a number.
function parseEurosToCents(input: string): number | null {
  if (!input) return null;
  const normalized = input.replace(/[\s€]/g, "").replace(",", ".");
  if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(normalized)) return Number.NaN;
  return Math.round(Number(normalized) * 100);
}

export function findProfileValidationError(values: ProfileValues): string | null {
  const siret = normalizeSiret(values.siret);

  if (!values.name) return "Indiquez le nom de votre entreprise.";
  if (!isValidSmsSenderName(values.smsSenderName)) {
    return "Nom d'expéditeur SMS invalide : 11 caractères max, lettres, chiffres et espaces, avec au moins une lettre.";
  }
  if (siret && !isValidSiret(siret)) return "Ce SIRET n'existe pas : vérifiez les 14 chiffres.";
  if (values.postalCode && !/^[0-9]{5}$/.test(values.postalCode)) {
    return "Le code postal doit contenir 5 chiffres.";
  }
  if (Number.isNaN(parseEurosToCents(values.shareCapital))) {
    return "Le capital social doit être un montant, par exemple 1 000.";
  }

  const vatNumber = normalizeVatNumber(values.vatNumber);
  if (vatNumber && !/^FR[0-9A-Z]{2}[0-9]{9}$/.test(vatNumber)) {
    return "Le numéro de TVA doit ressembler à FR12 345678901.";
  }
  if (vatNumber && siret && /^FR[0-9]{2}/.test(vatNumber) && vatNumber !== toVatNumber(siret.slice(0, 9))) {
    return "Ce numéro de TVA ne correspond pas à votre SIRET.";
  }

  if (values.contactPhone && !toE164Phone(values.contactPhone)) {
    return "Le numéro de téléphone n'est pas valide.";
  }
  if (values.contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.contactEmail)) {
    return "L'adresse e-mail n'est pas valide.";
  }
  return null;
}

function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

export function toCompanyProfileColumns(values: ProfileValues) {
  const legalForm = isLegalForm(values.legalForm) ? values.legalForm : null;
  const vatRegime = isVatRegime(values.vatRegime) ? values.vatRegime : null;

  return {
    siret: emptyToNull(normalizeSiret(values.siret)),
    name: values.name,
    sms_sender_name: values.smsSenderName,
    legal_name: emptyToNull(values.legalName),
    legal_form: legalForm,
    naf_code: /^[0-9]{2}\.[0-9]{2}[A-Z]$/.test(values.nafCode) ? values.nafCode : null,
    trade: isTrade(values.trade) ? values.trade : null,
    share_capital_cents: hasShareCapital(legalForm) ? parseEurosToCents(values.shareCapital) : null,
    address_line: emptyToNull(values.addressLine),
    postal_code: emptyToNull(values.postalCode),
    city: emptyToNull(values.city),
    region: isRegion(values.region) ? values.region : null,
    vat_regime: vatRegime,
    vat_number: vatRegime === "subject" ? emptyToNull(normalizeVatNumber(values.vatNumber)) : null,
    insurer_name: emptyToNull(values.insurerName),
    insurer_address: emptyToNull(values.insurerAddress),
    insurance_policy_number: emptyToNull(values.insurancePolicyNumber),
    insurance_coverage_area: emptyToNull(values.insuranceCoverageArea),
    mediator_name: emptyToNull(values.mediatorName),
    mediator_website: emptyToNull(values.mediatorWebsite),
    contact_phone: values.contactPhone ? toE164Phone(values.contactPhone) : null,
    contact_email: emptyToNull(values.contactEmail),
  } satisfies TablesUpdate<"companies">;
}
