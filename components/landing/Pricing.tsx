import { VAT_FRANCHISE_MENTION, isVatFranchise } from "@/lib/legal/publisher";
import { OFFER } from "@/lib/offer";
import { CtaButton } from "./CtaButton";
import { CheckIcon } from "./icons";

const INCLUDED = [
  "Votre numéro Batrelio et votre message d'accueil",
  "SMS automatique à votre nom après chaque appel manqué",
  "Formulaire client avec photos et adresse",
  "Devis pré-remplis, envoyés par lien",
  "Signature en ligne et acompte par carte ou virement",
  "Relances automatiques des devis non signés",
];

export function Pricing() {
  return (
    <section id="tarif" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-600">Tarif</p>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-5xl">
            Un seul chantier récupéré, et c&apos;est remboursé.
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-lg rounded-3xl border-2 border-stone-900 p-7 shadow-xl sm:p-10">
          <p className="text-lg font-bold text-stone-900">Batrelio</p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-6xl font-extrabold tracking-tight text-stone-900">
              {OFFER.pricePerMonth}&nbsp;€
            </span>
            <span className="text-lg text-stone-500">{isVatFranchise() ? "/ mois" : "HT / mois"}</span>
          </p>
          {isVatFranchise() && <p className="mt-1 text-sm text-stone-500">{VAT_FRANCHISE_MENTION}</p>}
          <p className="mt-2 text-stone-600">
            {OFFER.trialDays} jours gratuits pour essayer. Sans engagement.
          </p>

          <ul className="mt-8 space-y-4">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-3 text-lg text-stone-800">
                <CheckIcon className="mt-1 size-5 shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>

          <CtaButton label="Commencer l'essai gratuit" className="mt-9 w-full" />
        </div>
      </div>
    </section>
  );
}
