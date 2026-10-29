import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { toProfileValues } from "@/lib/company/profile-form";
import { CompanyProfileForm } from "./CompanyProfileForm";

export const metadata: Metadata = {
  title: "Mon entreprise · Batrelio",
  robots: { index: false },
};

export default function CompanyProfilePage() {
  return (
    <>
      <Link href="/espace" className="text-base font-semibold text-stone-500 hover:text-stone-900">
        ← Retour
      </Link>
      <h1 className="mb-2 mt-4 text-3xl font-extrabold tracking-tight text-stone-900">Mon entreprise</h1>
      <p className="mb-8 text-lg text-stone-600">Ces informations apparaissent sur vos devis.</p>
      <Suspense fallback={<p className="text-lg text-stone-500">Chargement…</p>}>
        <CompanyProfile />
      </Suspense>
    </>
  );
}

async function CompanyProfile() {
  const { supabase, claims } = await requireUser();
  // RLS only returns the artisan's own company.
  const { data: company, error } = await supabase.from("companies").select("*").maybeSingle();
  if (error) throw error;

  if (!company) {
    return <p className="text-lg text-stone-600">Aucune entreprise n&apos;est liée à ce compte.</p>;
  }

  return <CompanyProfileForm initialValues={toProfileValues(company, claims.email ?? "")} />;
}
