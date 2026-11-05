import type { Metadata } from "next";
import { Suspense } from "react";
import { ReturnBackLink } from "@/components/espace/BackLink";
import { requireUser } from "@/lib/auth/session";
import { toProfileValues } from "@/lib/company/profile-form";
import { safeReturnTo } from "@/lib/espace/return-to";
import { CompanyProfileForm } from "./CompanyProfileForm";

export const metadata: Metadata = {
  title: "Mon entreprise · Batrelio",
  robots: { index: false },
};

export default function CompanyProfilePage({ searchParams }: PageProps<"/espace/entreprise">) {
  return (
    <>
      <ReturnBackLink searchParams={searchParams} fallback="/espace/reglages" />
      <h1 className="mb-2 mt-4 text-3xl font-extrabold tracking-tight text-stone-900">Mon entreprise</h1>
      <p className="mb-8 text-lg text-stone-600">Ces informations apparaissent sur vos devis.</p>
      <Suspense fallback={<p className="text-lg text-stone-500">Chargement…</p>}>
        {searchParams.then((params) => (
          <CompanyProfile returnTo={safeReturnTo(params.retour, "/espace/reglages")} />
        ))}
      </Suspense>
    </>
  );
}

async function CompanyProfile({ returnTo }: { returnTo: string }) {
  const { supabase, claims } = await requireUser();
  // RLS only returns the artisan's own company.
  const { data: company, error } = await supabase.from("companies").select("*").maybeSingle();
  if (error) throw error;

  if (!company) {
    return <p className="text-lg text-stone-600">Aucune entreprise n&apos;est liée à ce compte.</p>;
  }

  return <CompanyProfileForm initialValues={toProfileValues(company, claims.email ?? "")} returnTo={returnTo} />;
}
