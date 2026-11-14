import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PLACES } from "@/components/espace/places";
import { IconTile } from "@/components/espace/tones";
import { ReturnBackLink } from "@/components/espace/BackLink";
import { CheckIcon } from "@/components/landing/icons";
import { returnLink, withReturnTo, type ReturnLink } from "@/lib/espace/return-to";
import { getSetup, hasCompanyIdentity, type SetupStep, type SetupStepId } from "@/lib/espace/setup";
import { formatPhone } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";
import { CANCEL_FORWARDING_CODE, FORWARDING_RING_SECONDS, forwardingCode } from "@/lib/telephony/forwarding";
import { ActivateButton, ConfirmForwardingButton, ForwardingCode } from "../reponse-automatique/AutoReplyControls";
import { TestCallPanel } from "./TestCallPanel";

export const metadata: Metadata = {
  title: "Mettre Batrelio en place · Batrelio",
  robots: { index: false },
};

const GUIDE = "/espace/demarrage";
const COMPANY_PAGE = withReturnTo("/espace/entreprise", GUIDE);

const STEP_TITLES: Record<SetupStepId, string> = {
  company: "Votre entreprise",
  number: "Votre numéro Batrelio",
  forwarding: "Renvoyer vos appels manqués",
  test: "Faites un essai",
};

// Reached from the Demandes tab (new artisans) or from Réglages: "later" goes back there.
const DEFAULT_RETURN = "/espace";

export default function SetupGuidePage({ searchParams }: PageProps<"/espace/demarrage">) {
  return (
    <>
      <ReturnBackLink searchParams={searchParams} fallback={DEFAULT_RETURN} />
      <Suspense fallback={<p className="mt-4 text-lg text-stone-500">Chargement…</p>}>
        {searchParams.then((params) => (
          <SetupGuide later={returnLink(params.retour, DEFAULT_RETURN)} />
        ))}
      </Suspense>
    </>
  );
}

async function SetupGuide({ later }: { later: ReturnLink }) {
  const setup = await getSetup();
  if (!setup) return <p className="mt-4 text-lg text-stone-600">Aucune entreprise n&apos;est liée à ce compte.</p>;

  const { company, steps, doneCount, isTest } = setup;
  const currentStep = steps.find((step) => !step.done)?.id;
  const progress = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="mt-4 space-y-6">
      <header data-tour="setup">
        <div className="flex items-center gap-3">
          <IconTile tone={PLACES.setup.tone}>
            <PLACES.setup.Icon />
          </IconTile>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Mettez Batrelio en place</h1>
        </div>
        <p className="mt-2 text-lg text-stone-600">4 étapes, environ 5 minutes. Vous pouvez vous arrêter et reprendre quand vous voulez.</p>
        <div className="mt-5">
          <div className="flex justify-between text-sm font-semibold text-stone-600">
            <span>
              {doneCount} étape{doneCount > 1 ? "s" : ""} sur {steps.length}
            </span>
            <span>{progress} %</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-orange-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      {!currentStep && <AllDone />}

      <ol className="space-y-3">
        {steps.map((step, index) => (
          <StepCard key={step.id} step={step} number={index + 1} isCurrent={step.id === currentStep}>
            <StepContent step={step} company={company} isTest={isTest} />
          </StepCard>
        ))}
      </ol>

      <Link
        href={currentStep ? later.href : "/espace"}
        className="flex min-h-12 items-center justify-center text-base font-semibold text-stone-600 underline"
      >
        {currentStep ? "Continuer plus tard" : "Voir mes demandes"}
      </Link>
    </div>
  );
}

function AllDone() {
  return (
    <section className="rounded-3xl bg-emerald-600 p-6 text-white">
      <p className="text-2xl font-extrabold">Tout est prêt 🎉</p>
      <p className="mt-1 text-lg text-emerald-50">
        Quand vous ne décrochez pas, votre client entend votre message et reçoit un SMS pour décrire son besoin.
      </p>
      <Link
        href="/espace"
        className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-white px-5 text-base font-semibold text-emerald-800 hover:bg-emerald-50"
      >
        Voir mes demandes
      </Link>
    </section>
  );
}

type StepCardProps = { step: SetupStep; number: number; isCurrent: boolean; children: React.ReactNode };

function StepCard({ step, number, isCurrent, children }: StepCardProps) {
  const ring = isCurrent ? "ring-2 ring-orange-500" : "ring-1 ring-stone-200";

  return (
    <li className={`rounded-3xl bg-white p-5 shadow-sm sm:p-6 ${ring}`}>
      <div className="flex items-center gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full text-base font-bold ${
            step.done ? "bg-emerald-600 text-white" : isCurrent ? "bg-orange-600 text-white" : "bg-stone-100 text-stone-500"
          }`}
        >
          {step.done ? <CheckIcon className="size-5" /> : number}
        </span>
        <h2 className={`text-lg font-bold ${step.done ? "text-stone-500" : "text-stone-900"}`}>{STEP_TITLES[step.id]}</h2>
      </div>
      <div className="mt-3 space-y-4 pl-12 text-base text-stone-600">{children}</div>
    </li>
  );
}

const PRIMARY_LINK =
  "flex min-h-14 items-center justify-center rounded-2xl bg-orange-600 px-5 text-lg font-semibold text-white hover:bg-orange-700";
const SECONDARY_LINK = "text-base font-semibold text-orange-700 underline";

const SIMULATOR = "/espace/simulation";

type StepContentProps = { step: SetupStep; company: Tables<"companies">; isTest: boolean };

function StepContent({ step, company, isTest }: StepContentProps) {
  switch (step.id) {
    case "company":
      return step.done ? (
        <p>
          {company.legal_name} · SIRET renseigné ·{" "}
          <Link href={COMPANY_PAGE} className={SECONDARY_LINK}>
            modifier
          </Link>
        </p>
      ) : (
        <>
          <p>Tapez votre SIRET : votre nom, votre adresse et votre forme juridique se remplissent tout seuls. Indiquez ensuite si vous facturez la TVA.</p>
          <Link href={COMPANY_PAGE} className={PRIMARY_LINK}>
            Remplir mon entreprise
          </Link>
        </>
      );

    case "number":
      if (step.done) {
        return (
          <p>
            Votre numéro : <strong className="text-stone-900">{formatPhone(company.phone_number ?? "")}</strong> · SMS
            envoyés au nom de <strong className="font-mono text-stone-900">{company.sms_sender_name}</strong> ·{" "}
            <Link href={withReturnTo("/espace/messages", GUIDE)} className={SECONDARY_LINK}>
              personnaliser le message vocal
            </Link>
          </p>
        );
      }
      if (company.phone_number) {
        return (
          <>
            <p>Votre réponse automatique est en pause : vos clients ne reçoivent pas de SMS.</p>
            <Link href={withReturnTo("/espace/reponse-automatique", GUIDE)} className={PRIMARY_LINK}>
              La réactiver
            </Link>
          </>
        );
      }
      if (!hasCompanyIdentity(company)) {
        return <p>Renseignez d&apos;abord votre entreprise (étape 1) : un numéro n&apos;est attribué qu&apos;à une entreprise identifiée.</p>;
      }
      return (
        <>
          <p>Il reçoit les appels que vous ne prenez pas. Votre numéro habituel ne change pas.</p>
          {isTest && <p className="text-sm font-semibold text-sky-800">Compte de test : un numéro fictif vous est attribué, rien n&apos;est acheté.</p>}
          <ActivateButton returnTo={GUIDE} />
        </>
      );

    case "forwarding":
      if (!company.phone_number) return <p>Activez d&apos;abord votre numéro Batrelio (étape 2).</p>;
      if (step.done) {
        return <p>Le renvoi est activé sur votre téléphone. Pour l&apos;arrêter un jour : composez {CANCEL_FORWARDING_CODE}.</p>;
      }
      return (
        <>
          {isTest && (
            <p className="rounded-2xl bg-sky-50 p-4 font-semibold text-sky-900">
              Compte de test : ne composez pas ce code, le numéro est fictif. Touchez simplement « C&apos;est fait ».
            </p>
          )}
          <p>Sur le téléphone que vos clients appellent, composez ce code puis appuyez sur appeler. Un message confirme le renvoi.</p>
          <ForwardingCode
            code={forwardingCode(company.phone_number)}
            label={`Code à composer (pas de réponse après ${FORWARDING_RING_SECONDS} secondes, occupé, injoignable)`}
          />
          <p className="text-sm">
            Sur iPhone, touchez « Copier », ouvrez Téléphone puis Clavier, appuyez longuement pour coller. N&apos;utilisez
            pas Réglages → Renvoi d&apos;appel : il renverrait tous vos appels.
          </p>
          <ConfirmForwardingButton />
        </>
      );

    case "test":
      if (step.done) {
        return (
          <p>
            Premier appel reçu : tout fonctionne.{" "}
            <Link href={withReturnTo("/espace/reponse-automatique", GUIDE)} className={SECONDARY_LINK}>
              Voir l&apos;historique
            </Link>
          </p>
        );
      }
      if (isTest) {
        return (
          <>
            <p>Simulez l&apos;appel d&apos;un client : vous voyez ce qu&apos;il entend et le SMS qu&apos;il reçoit.</p>
            <Link href={SIMULATOR} className={PRIMARY_LINK}>
              Simuler un appel manqué
            </Link>
          </>
        );
      }
      return (
        <>
          <p>Batrelio appelle votre téléphone. Ne décrochez pas : l&apos;appel revient chez Batrelio, et l&apos;étape se coche toute seule.</p>
          <TestCallPanel defaultPhone={company.contact_phone ? formatPhone(company.contact_phone) : ""} />
          <p className="text-sm">
            Vous préférez ? Demandez à un proche de vous appeler sans décrocher, puis{" "}
            <a href={GUIDE} className={SECONDARY_LINK}>
              vérifiez ici
            </a>
            .
          </p>
        </>
      );
  }
}
