import "server-only";
import { isTestAccount, requireUser } from "@/lib/auth/session";
import type { Tables } from "@/lib/supabase/database.types";

// The setup guide: what an artisan does once so Batrelio works. Each step is worked out from
// what is already saved, never ticked by hand, except call forwarding, which only the
// operator knows about: there the first forwarded call is the real proof.

// Only what makes missed calls come back as clients. Insurance and mediator are asked for when
// the artisan sends their first quote, where they are needed.
export type SetupStepId = "company" | "number" | "forwarding" | "test";

export type SetupStep = { id: SetupStepId; done: boolean };

type Company = Tables<"companies">;

export function hasCompanyIdentity(company: Company): boolean {
  return Boolean(
    company.siret &&
      company.legal_name &&
      company.legal_form &&
      company.address_line &&
      company.postal_code &&
      company.city &&
      company.vat_regime &&
      (company.vat_regime === "franchise" || company.vat_number),
  );
}

export function computeSetupSteps(company: Company, hasReceivedCall: boolean): SetupStep[] {
  return [
    { id: "company", done: hasCompanyIdentity(company) },
    { id: "number", done: Boolean(company.phone_number && company.auto_reply_enabled) },
    { id: "forwarding", done: Boolean(company.call_forwarding_confirmed_at) || hasReceivedCall },
    { id: "test", done: hasReceivedCall },
  ];
}

// RLS restricts the company and its calls to the artisan's own.
export async function getSetup() {
  const { supabase, claims } = await requireUser();
  const [{ data: company }, { count }] = await Promise.all([
    supabase.from("companies").select("*").maybeSingle(),
    supabase.from("missed_calls").select("id", { count: "exact", head: true }),
  ]);
  if (!company) return null;

  const steps = computeSetupSteps(company, (count ?? 0) > 0);
  return {
    company,
    steps,
    doneCount: steps.filter((step) => step.done).length,
    isTest: isTestAccount(claims.app_metadata),
  };
}
