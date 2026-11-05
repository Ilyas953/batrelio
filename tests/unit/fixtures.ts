import type { Tables } from "@/lib/supabase/database.types";

type Company = Tables<"companies">;

// A company right after signup: only what the signup trigger fills in.
// Columns the rules never read are left out (the cast keeps the fixture short).
export function blankCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    owner_id: "00000000-0000-4000-8000-000000000002",
    name: "Toitures Martin",
    sms_sender_name: "TOITMARTIN",
    sms_sender_approved: false,
    auto_reply_enabled: false,
    contact_phone: null,
    siret: null,
    legal_name: null,
    legal_form: null,
    address_line: null,
    postal_code: null,
    city: null,
    vat_regime: null,
    vat_number: null,
    insurer_name: null,
    insurance_policy_number: null,
    insurance_coverage_area: null,
    mediator_name: null,
    phone_number: null,
    phone_number_sid: null,
    call_forwarding_confirmed_at: null,
    ...overrides,
  } as Company;
}

export const IDENTIFIED: Partial<Company> = {
  siret: "13212220100016",
  legal_name: "Toitures Martin",
  legal_form: "ei",
  address_line: "22 rue des Ardoises",
  postal_code: "29000",
  city: "Quimper",
  vat_regime: "franchise",
};

export const INSURED: Partial<Company> = {
  insurer_name: "Assurance BTP",
  insurance_policy_number: "DEC-123",
  insurance_coverage_area: "France métropolitaine",
  mediator_name: "Médiateur du bâtiment",
};
