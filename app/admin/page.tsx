import Link from "next/link";
import { Suspense } from "react";
import { listAccounts, type Account } from "@/lib/admin/accounts";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeZone: "Europe/Paris",
});

function formatDate(isoDate: string | null): string {
  return isoDate ? dateFormatter.format(new Date(isoDate)) : "Jamais";
}

export default function AdminPage() {
  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Comptes</h1>
        <Link
          href="/admin/comptes/nouveau"
          className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-orange-600 px-6 text-lg font-semibold text-white hover:bg-orange-700"
        >
          Ajouter un compte
        </Link>
      </div>
      <Suspense fallback={<p className="text-lg text-stone-500">Chargement des comptes…</p>}>
        <AccountList />
      </Suspense>
    </>
  );
}

async function AccountList() {
  const accounts = await listAccounts();

  if (accounts.length === 0) {
    return <p className="text-lg text-stone-600">Aucun compte pour l&apos;instant.</p>;
  }

  return (
    <>
      <p className="mb-4 text-base text-stone-500">
        {accounts.length} compte{accounts.length > 1 ? "s" : ""}
      </p>
      <ul className="space-y-3">
        {accounts.map((account) => (
          <AccountCard key={account.userId} account={account} />
        ))}
      </ul>
    </>
  );
}

function AccountCard({ account }: { account: Account }) {
  return (
    <li className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xl font-bold text-stone-900">
          {account.company?.name ?? "Sans entreprise"}
        </p>
        {account.isAdmin && (
          <span className="rounded-full bg-orange-100 px-3 py-0.5 text-sm font-semibold text-orange-800">
            Admin
          </span>
        )}
      </div>
      <p className="mt-1 break-all text-base text-stone-600">{account.email}</p>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
        <AccountDetail label="Expéditeur SMS" value={account.company?.sms_sender_name ?? "–"} />
        <AccountDetail label="Sous-domaine" value={account.company?.slug ?? "–"} />
        <AccountDetail label="Créé le" value={formatDate(account.createdAt)} />
        <AccountDetail label="Dernière connexion" value={formatDate(account.lastSignInAt)} />
      </dl>
    </li>
  );
}

function AccountDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className="mt-0.5 font-semibold text-stone-900">{value}</dd>
    </div>
  );
}
