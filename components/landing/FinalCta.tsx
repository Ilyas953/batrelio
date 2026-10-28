import { OFFER } from "@/lib/offer";
import { CtaButton } from "./CtaButton";

export function FinalCta() {
  return (
    <section className="bg-orange-600 text-white">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:py-24">
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Le prochain appel que vous manquerez est peut-être votre plus beau chantier du mois.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-orange-50 sm:text-xl">
          Activez Batrelio aujourd&apos;hui. {OFFER.trialDays} jours gratuits, sans engagement.
        </p>
        <CtaButton label="Essayer gratuitement" variant="light" className="mt-9 w-full sm:w-auto" />
      </div>
    </section>
  );
}
