import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/landing/icons";
import { OFFER } from "@/lib/offer";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Créer mon compte · Batrelio",
  description: `Essayez Batrelio gratuitement pendant ${OFFER.trialDays} jours. Ne perdez plus un client parce que vous étiez sur un chantier.`,
};

const BENEFITS = [
  "Un SMS à votre nom part après chaque appel manqué",
  "Le client vous envoie son besoin, ses photos et son adresse",
  "Vous envoyez le devis depuis votre téléphone",
  "Il signe et paie l'acompte en ligne",
];

export default function SignupPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:py-16">
        <div>
          <Link href="/" className="text-lg font-bold text-stone-900">
            Batrelio
          </Link>
          <h1 className="mt-8 text-4xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-5xl">
            Essayez gratuitement pendant {OFFER.trialDays} jours.
          </h1>
          <ul className="mt-8 hidden space-y-4 lg:block">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex gap-3 text-lg text-stone-700">
                <CheckIcon className="mt-1 size-5 shrink-0 text-emerald-600" />
                {benefit}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-base font-medium text-stone-500 lg:mt-10">
            {OFFER.guarantees.join(" · ")}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
