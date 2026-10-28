import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { CreateAccountForm } from "./CreateAccountForm";

export default function NewAccountPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Link href="/admin" className="text-base font-semibold text-stone-500 hover:text-stone-900">
        ← Retour aux comptes
      </Link>
      <h1 className="mb-8 mt-4 text-3xl font-extrabold tracking-tight text-stone-900">
        Ajouter un compte
      </h1>
      <Suspense fallback={<p className="text-lg text-stone-500">Chargement…</p>}>
        <AdminOnlyForm />
      </Suspense>
    </div>
  );
}

async function AdminOnlyForm() {
  await requireAdmin();
  return <CreateAccountForm />;
}
