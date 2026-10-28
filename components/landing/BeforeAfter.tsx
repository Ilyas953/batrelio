import { CheckIcon, CrossIcon } from "./icons";

const WITHOUT = [
  "Le client tombe sur la messagerie et appelle quelqu'un d'autre",
  "Le soir, vous rappelez des numéros sans savoir de quoi il s'agit",
  "Vous tapez vos devis tard, sur l'ordinateur",
  "Le devis part par mail et vous n'avez plus de nouvelles",
  "Vous courez après les acomptes",
];

const WITH = [
  "Le client reçoit un SMS à votre nom dans la minute",
  "Vous avez déjà son besoin, ses photos et son adresse",
  "Le devis est pré-rempli : vous mettez vos prix et vous envoyez",
  "Les relances partent toutes seules jusqu'à la réponse",
  "L'acompte est payé en ligne, au moment de la signature",
];

export function BeforeAfter() {
  return (
    <section className="bg-stone-100">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <h2 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-5xl">
          Votre semaine, avant et après.
        </h2>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-7 sm:p-8">
            <p className="text-lg font-bold text-stone-500">Sans Batrelio</p>
            <ul className="mt-5 space-y-4">
              {WITHOUT.map((item) => (
                <li key={item} className="flex gap-3 text-lg text-stone-600">
                  <CrossIcon className="mt-1 size-5 shrink-0 text-red-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border-2 border-orange-500 bg-white p-7 shadow-lg shadow-orange-600/10 sm:p-8">
            <p className="text-lg font-bold text-orange-700">Avec Batrelio</p>
            <ul className="mt-5 space-y-4">
              {WITH.map((item) => (
                <li key={item} className="flex gap-3 text-lg font-medium text-stone-900">
                  <CheckIcon className="mt-1 size-5 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
