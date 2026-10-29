import type { Metadata } from "next";
import { Suspense } from "react";
import { signOut } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Mon espace · Batrelio",
  robots: { index: false },
};

export default function ArtisanSpacePage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12 sm:px-6">
      <Suspense fallback={<p className="text-lg text-stone-500">Chargement…</p>}>
        <Welcome />
      </Suspense>
    </main>
  );
}

async function Welcome() {
  const { supabase } = await requireUser();
  // RLS only returns the artisan's own company.
  const { data: company } = await supabase.from("companies").select("name").maybeSingle();

  return (
    <div className="rounded-3xl bg-white p-7 shadow-sm sm:p-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
        Bienvenue{company ? `, ${company.name}` : ""}
      </h1>
      <p className="mt-3 text-lg text-stone-600">Votre compte Batrelio est bien créé.</p>
      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="min-h-12 rounded-2xl border-2 border-stone-200 px-5 text-base font-semibold text-stone-800 hover:border-stone-900"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
