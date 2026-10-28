import { OFFER } from "@/lib/offer";
import { CtaButton } from "./CtaButton";
import { CheckIcon } from "./icons";
import { PhoneMockup } from "./PhoneMockup";

export function Hero() {
  return (
    <section className="overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pb-28 lg:pt-20">
        <div>
          <p className="mb-5 inline-flex rounded-full bg-orange-100 px-4 py-1.5 text-sm font-semibold text-orange-800">
            Couvreurs, élagueurs, paysagistes, plombiers…
          </p>
          <h1 className="text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-stone-900 sm:text-6xl">
            Vous êtes sur le chantier.{" "}
            <span className="text-orange-600">Vos clients ne partent plus chez le concurrent.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600 sm:text-xl">
            Quand vous ne pouvez pas décrocher, Batrelio répond à votre place, envoie un SMS à votre
            nom et récupère la demande du client avec ses photos. Vous faites le devis depuis votre
            téléphone, il le signe et paie l&apos;acompte en ligne.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <CtaButton label={`Essayer gratuitement ${OFFER.trialDays} jours`} />
            <CtaButton label="Combien je perds aujourd'hui ?" variant="secondary" href="#calcul" />
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-medium text-stone-600">
            {OFFER.guarantees.map((guarantee) => (
              <li key={guarantee} className="flex items-center gap-2">
                <CheckIcon className="size-5 text-emerald-600" />
                {guarantee}
              </li>
            ))}
          </ul>
        </div>

        <PhoneMockup />
      </div>
    </section>
  );
}
