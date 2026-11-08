import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon, CheckIcon, LogOutIcon, PlayIcon } from "@/components/landing/icons";
import { RestartTourButton } from "@/components/espace/OnboardingTour";
import { PLACES, PageTitle, type Place } from "@/components/espace/places";
import { IconTile } from "@/components/espace/tones";
import { signOut } from "@/lib/auth/actions";
import { withReturnTo } from "@/lib/espace/return-to";
import { getSetup } from "@/lib/espace/setup";
import { formatPhone } from "@/lib/format";
import { findGreetingVoice } from "@/lib/telephony/voices";

export const metadata: Metadata = {
  title: "Réglages · Batrelio",
  robots: { index: false },
};

export default function SettingsPage() {
  return (
    <>
      <PageTitle place="settings" />
      <Suspense fallback={<p className="text-lg text-stone-500">Chargement…</p>}>
        <SettingsList />
      </Suspense>
      <RestartTourButton className="mt-3 flex min-h-20 w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-stone-200 transition hover:ring-stone-300 sm:p-5">
        <IconTile tone="orange">
          <PlayIcon />
        </IconTile>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-stone-900">Revoir le tuto</span>
          <span className="block text-sm text-stone-600">Les bulles qui montrent où tout se trouve</span>
        </span>
      </RestartTourButton>
      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 px-6 text-lg font-semibold text-stone-700 hover:border-stone-900"
        >
          <LogOutIcon className="size-5" />
          Se déconnecter
        </button>
      </form>
    </>
  );
}

async function SettingsList() {
  const setup = await getSetup();
  if (!setup) return <p className="text-lg text-stone-600">Aucune entreprise n&apos;est liée à ce compte.</p>;

  const { company, steps, doneCount, isTest } = setup;
  const setupDone = doneCount === steps.length;
  const autoReplyStatus = !company.phone_number
    ? "Pas encore activée"
    : company.auto_reply_enabled
      ? `Activée · ${formatPhone(company.phone_number)}`
      : "En pause";

  return (
    <ul className="space-y-3">
      <SettingsRow
        href={withReturnTo("/espace/demarrage", "/espace/reglages")}
        place="setup"
        done={setupDone}
        detail={setupDone ? "Terminée : revoir le guide" : `${doneCount} étape${doneCount > 1 ? "s" : ""} sur ${steps.length} · à terminer`}
        highlight={!setupDone}
      />
      <SettingsRow
        href="/espace/entreprise"
        place="company"
        detail={steps[0].done ? `${company.legal_name} · SIRET, adresse, assurance` : "SIRET, adresse, TVA et assurance à compléter"}
      />
      <SettingsRow
        href="/espace/reponse-automatique"
        place="autoReply"
        detail={`${autoReplyStatus} · renvoi d'appel, numéros exclus, historique`}
      />
      <SettingsRow
        href="/espace/messages"
        place="messages"
        detail={`Voix ${findGreetingVoice(company.greeting_voice).label} · message d'accueil et envoi des devis`}
      />
      {isTest && (
        <SettingsRow
          href="/espace/simulation"
          place="simulator"
          detail="Compte de test : simuler un appel manqué, recommencer à zéro"
        />
      )}
    </ul>
  );
}

type SettingsRowProps = { href: string; place: Place; detail: string; highlight?: boolean; done?: boolean };

function SettingsRow({ href, place, detail, highlight = false, done = false }: SettingsRowProps) {
  const { label, tone, Icon } = PLACES[place];

  return (
    <li>
      <Link
        href={href}
        className={`flex min-h-20 items-center gap-4 rounded-3xl bg-white p-4 shadow-sm transition sm:p-5 ${
          highlight ? "ring-2 ring-amber-400 hover:ring-amber-500" : "ring-1 ring-stone-200 hover:ring-stone-300"
        }`}
      >
        <IconTile tone={done ? "emerald" : tone}>{done ? <CheckIcon /> : <Icon />}</IconTile>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-stone-900">{label}</span>
          <span className="block text-sm text-stone-600">{detail}</span>
        </span>
        <ArrowRightIcon className="size-5 shrink-0 text-stone-400" />
      </Link>
    </li>
  );
}
