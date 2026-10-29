"use client";

import { useState } from "react";
import { OFFER } from "@/lib/offer";
import { ROI_ASSUMPTIONS, estimateRecoveredRevenue, formatEuros } from "@/lib/roi";
import { CtaButton } from "./CtaButton";

type SliderProps = {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
};

function Slider({ id, label, value, displayValue, min, max, step, onChange }: SliderProps) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-lg font-semibold text-stone-800">
          {label}
        </label>
        <span className="shrink-0 text-2xl font-extrabold tabular-nums text-stone-900">{displayValue}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full cursor-pointer accent-orange-600"
      />
    </div>
  );
}

function formatJobs(jobs: number): string {
  return jobs.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

function toPercent(share: number): string {
  return `${Math.round(share * 100)} %`;
}

const ASSUMPTION_NOTE = `Estimation réaliste. On considère que ${toPercent(ROI_ASSUMPTIONS.newClientShare)} des appels manqués viennent de nouveaux clients (le reste : démarchage, clients actuels, fournisseurs), que ${toPercent(ROI_ASSUMPTIONS.formCompletionRate)} d'entre eux remplissent le formulaire, et on ne compte que ${toPercent(ROI_ASSUMPTIONS.lostWithoutReplyShare)} de ces demandes : celles que vous auriez perdues sans réponse.`;

export function RoiCalculator() {
  const [missedCallsPerWeek, setMissedCallsPerWeek] = useState(5);
  const [averageJobValue, setAverageJobValue] = useState(1500);
  const [quoteSignRatePercent, setQuoteSignRatePercent] = useState(30);

  const estimate = estimateRecoveredRevenue({
    missedCallsPerWeek,
    averageJobValue,
    quoteSignRate: quoteSignRatePercent / 100,
  });
  const returnOnPrice = Math.floor(estimate.revenuePerMonth / OFFER.pricePerMonth);

  return (
    <section id="calcul" className="scroll-mt-20 bg-orange-50">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-600">
            Faites le calcul
          </p>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-5xl">
            Combien vous rapportent les clients que vous ne rappelez pas&nbsp;?
          </h2>
          <p className="mt-5 text-lg text-stone-600">Bougez les curseurs avec vos chiffres.</p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.05fr]">
          <div className="space-y-8 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <Slider
              id="missed-calls"
              label="Appels manqués par semaine"
              value={missedCallsPerWeek}
              displayValue={String(missedCallsPerWeek)}
              min={1}
              max={30}
              step={1}
              onChange={setMissedCallsPerWeek}
            />
            <Slider
              id="job-value"
              label="Montant moyen d'un chantier"
              value={averageJobValue}
              displayValue={formatEuros(averageJobValue)}
              min={200}
              max={10000}
              step={100}
              onChange={setAverageJobValue}
            />
            <Slider
              id="sign-rate"
              label="Devis acceptés sur 10"
              value={quoteSignRatePercent}
              displayValue={`${quoteSignRatePercent / 10} sur 10`}
              min={10}
              max={80}
              step={10}
              onChange={setQuoteSignRatePercent}
            />
            <p className="text-sm leading-relaxed text-stone-500">{ASSUMPTION_NOTE}</p>
          </div>

          <div className="flex flex-col justify-between rounded-3xl bg-stone-900 p-6 text-white sm:p-8" aria-live="polite">
            <div>
              <p className="text-lg font-medium text-stone-300">Chiffre d&apos;affaires récupéré</p>
              <p className="mt-2 text-5xl font-extrabold tabular-nums tracking-tight text-orange-400 sm:text-6xl">
                {formatEuros(estimate.revenuePerYear)}
                <span className="ml-2 text-2xl font-bold text-stone-400">/ an</span>
              </p>
              <p className="mt-2 text-xl font-semibold tabular-nums">
                soit {formatEuros(estimate.revenuePerMonth)} par mois
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-stone-800 p-4">
                  <dt className="text-sm text-stone-400">Demandes reçues</dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums">
                    {Math.round(estimate.requestsPerYear)} / an
                  </dd>
                </div>
                <div className="rounded-2xl bg-stone-800 p-4">
                  <dt className="text-sm text-stone-400">Chantiers en plus</dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums">
                    {formatJobs(estimate.extraJobsPerYear)} / an
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-8 border-t border-stone-700 pt-6">
              <p className="mb-5 text-lg leading-snug text-stone-200">
                Batrelio coûte {OFFER.pricePerMonth}&nbsp;€ par mois.
                {returnOnPrice >= 2 && (
                  <>
                    {" "}
                    Vous récupérez{" "}
                    <strong className="text-white">{returnOnPrice} fois ce prix</strong>.
                  </>
                )}
              </p>
              <CtaButton label="Je récupère mes clients" className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
