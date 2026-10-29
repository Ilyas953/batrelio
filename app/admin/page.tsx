import Link from "next/link";
import { Suspense } from "react";
import { listAccounts, type Account } from "@/lib/admin/accounts";
import { REGION_LABELS, TRADE_LABELS, formatSiret } from "@/lib/company/details";

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
  const { company } = account;

  return (
    <li className="rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-bold text-stone-900">{company?.name ?? "Sans entreprise"}</p>
            {account.isAdmin && (
              <span className="rounded-full bg-orange-100 px-3 py-0.5 text-sm font-semibold text-orange-800">
                Admin
              </span>
            )}
          </div>
          <p className="mt-1 break-all text-base text-stone-600">{account.email}</p>
        </div>
        {company && (
          <Link
            href={`/admin/comptes/${company.id}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-xl border-2 border-stone-200 px-4 text-base font-semibold text-stone-800 hover:border-stone-900"
          >
            Modifier
          </Link>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        <AccountDetail label="Métier" value={company?.trade ? TRADE_LABELS[company.trade] : "–"} />
        <AccountDetail label="Région" value={company?.region ? REGION_LABELS[company.region] : "–"} />
        <AccountDetail label="SIRET" value={company?.siret ? formatSiret(company.siret) : "–"} />
        <AccountDetail label="Expéditeur SMS" value={company?.sms_sender_name ?? "–"} />
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
