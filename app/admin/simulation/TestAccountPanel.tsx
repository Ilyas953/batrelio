import { TRADE_LABELS } from "@/lib/company/details";
import { removeTestAccounts, startTestAccount } from "./actions";

// Server-rendered forms: the admin page needs no client JavaScript for them.
export function TestAccountPanel({ testAccountCount }: { testAccountCount: number }) {
  return (
    <section className="mb-8 rounded-3xl border-2 border-sky-200 bg-sky-50 p-5 sm:p-6">
      <h2 className="text-xl font-bold text-stone-900">Tester le produit comme un artisan</h2>
      <p className="mt-2 text-base text-stone-700">
        Crée un compte vierge et l&apos;ouvre à la place de votre session admin : vous arrivez dans le guide de mise en
        place comme un nouvel inscrit. Son numéro est fictif (rien n&apos;est acheté) et les SMS s&apos;affichent à
        l&apos;écran au lieu d&apos;être envoyés.
      </p>
      <form action={startTestAccount} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="test-trade">
          Métier
        </label>
        <select
          id="test-trade"
          name="trade"
          defaultValue="couvreur"
          className="min-h-14 rounded-2xl border-2 border-stone-200 bg-white px-4 text-lg text-stone-900 sm:w-56"
        >
          {Object.entries(TRADE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="min-h-14 flex-1 rounded-2xl bg-sky-700 px-6 text-lg font-semibold text-white hover:bg-sky-800"
        >
          Créer et ouvrir un compte de test
        </button>
      </form>
      {testAccountCount > 0 && (
        <form action={removeTestAccounts} className="mt-3">
          <button type="submit" className="min-h-11 text-base font-semibold text-stone-600 underline hover:text-stone-900">
            Supprimer les {testAccountCount} compte{testAccountCount > 1 ? "s" : ""} de test
          </button>
        </form>
      )}
    </section>
  );
}
