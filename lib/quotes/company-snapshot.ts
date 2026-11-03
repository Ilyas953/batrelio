import type { Tables } from "@/lib/supabase/database.types";

// The company's legal details frozen in a quote when it is sent: a later change of address or
// insurer must never alter a quote the customer already received.
export type CompanySnapshot = Pick<
  Tables<"companies">,
  | "name"
  | "legal_name"
  | "legal_form"
  | "siret"
  | "address_line"
  | "postal_code"
  | "city"
  | "vat_regime"
  | "vat_number"
  | "share_capital_cents"
  | "insurer_name"
  | "insurer_address"
  | "insurance_policy_number"
  | "insurance_coverage_area"
  | "mediator_name"
  | "mediator_website"
  | "contact_phone"
  | "contact_email"
>;

export function toCompanySnapshot(company: Tables<"companies">): CompanySnapshot {
  return {
    name: company.name,
    legal_name: company.legal_name,
    legal_form: company.legal_form,
    siret: company.siret,
    address_line: company.address_line,
    postal_code: company.postal_code,
    city: company.city,
    vat_regime: company.vat_regime,
    vat_number: company.vat_number,
    share_capital_cents: company.share_capital_cents,
    insurer_name: company.insurer_name,
    insurer_address: company.insurer_address,
    insurance_policy_number: company.insurance_policy_number,
    insurance_coverage_area: company.insurance_coverage_area,
    mediator_name: company.mediator_name,
    mediator_website: company.mediator_website,
    contact_phone: company.contact_phone,
    contact_email: company.contact_email,
  };
}

export function chargesVat(company: Pick<Tables<"companies">, "vat_regime">): boolean {
  return company.vat_regime === "subject";
}
