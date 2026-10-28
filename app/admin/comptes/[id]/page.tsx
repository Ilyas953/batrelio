import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCompany } from "@/lib/admin/companies";
import { EditCompanyForm } from "./EditCompanyForm";

export default function EditCompanyPage({ params }: PageProps<"/admin/comptes/[id]">) {
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/admin" className="text-base font-semibold text-stone-500 hover:text-stone-900">
        ← Retour aux comptes
      </Link>
      <Suspense fallback={<p className="mt-8 text-lg text-stone-500">Chargement…</p>}>
        {params.then(({ id }) => (
          <CompanyEditor companyId={id} />
        ))}
      </Suspense>
    </div>
  );
}

async function CompanyEditor({ companyId }: { companyId: string }) {
  const company = await getCompany(companyId);
  if (!company) notFound();

  return (
    <>
      <h1 className="mb-8 mt-4 text-3xl font-extrabold tracking-tight text-stone-900">
        {company.name}
      </h1>
      <EditCompanyForm
        companyId={company.id}
        initialValues={{
          companyName: company.name,
          smsSenderName: company.sms_sender_name,
          siret: company.siret ?? "",
          trade: company.trade ?? "",
          region: company.region ?? "",
        }}
      />
    </>
  );
}
