"use client";

import { useActionState } from "react";
import { FormError, SubmitButton } from "@/components/ui/form";
import type { CompanyValues } from "@/lib/admin/company-form";
import { updateCompany, type UpdateCompanyState } from "../actions";
import { CompanyFields } from "../CompanyFields";

const INITIAL_STATE: UpdateCompanyState = {};

type EditCompanyFormProps = {
  companyId: string;
  initialValues: CompanyValues;
};

export function EditCompanyForm({ companyId, initialValues }: EditCompanyFormProps) {
  const [state, formAction] = useActionState(updateCompany.bind(null, companyId), INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <CompanyFields defaults={state.values ?? initialValues} />
      <FormError message={state.error} />
      <SubmitButton label="Enregistrer" pendingLabel="Enregistrement…" />
    </form>
  );
}
