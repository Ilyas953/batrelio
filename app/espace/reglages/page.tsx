import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon, CheckIcon, DocumentIcon, MessageIcon, PhoneMissedIcon, SettingsIcon } from "@/components/landing/icons";
import { signOut } from "@/lib/auth/actions";
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
      <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-stone-900">Réglages</h1>
      <Suspense fallback={<p className="text-lg text-stone-500">Chargement…</p>}>
        <SettingsList />
      </Suspense>
      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="flex min-h-14 w-full items-center justify-center rounded-2xl border-2 border-stone-200 px-6 text-lg font-semibold text-stone-700 hover:border-stone-900"
        >
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
        href="/espace/demarrage"
        icon={setupDone ? <CheckIcon /> : <SettingsIcon />}
        title="Mise en place"
        detail={setupDone ? "Terminée : revoir le guide" : `${doneCount} étape${doneCount > 1 ? "s" : ""} sur ${steps.length} · à terminer`}
        highlight={!setupDone}
      />
      <SettingsRow
        href="/espace/entreprise"
        icon={<DocumentIcon />}
        title="Mon entreprise"
        detail={steps[0].done ? `${company.legal_name} · SIRET, adresse, assurance` : "SIRET, adresse, TVA et assurance à compléter"}
      />
      <SettingsRow
        href="/espace/reponse-automatique"
        icon={<PhoneMissedIcon />}
        title="Réponse automatique"
        detail={`${autoReplyStatus} · renvoi d'appel, numéros exclus, historique`}
      />
      <SettingsRow
        href="/espace/messages"
        icon={<MessageIcon />}
        title="Vos messages"
        detail={`Voix ${findGreetingVoice(company.greeting_voice).label} · message d'accueil et envoi des devis`}
      />
      {isTest && (
        <SettingsRow
          href="/espace/simulation"
          icon={<PhoneMissedIcon />}
          title="Simulateur"
          detail="Compte de test : simuler un appel manqué, recommencer à zéro"
        />
      )}
    </ul>
  );
}

type SettingsRowProps = { href: string; icon: React.ReactNode; title: string; detail: string; highlight?: boolean };

function SettingsRow({ href, icon, title, detail, highlight = false }: SettingsRowProps) {
  return (
    <li>
      <Link
        href={href}
        className={`flex min-h-20 items-center gap-4 rounded-3xl bg-white p-4 shadow-sm transition sm:p-5 ${
          highlight ? "ring-2 ring-orange-500 hover:ring-orange-600" : "ring-1 ring-stone-200 hover:ring-stone-300"
        }`}
      >
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
            highlight ? "bg-orange-100 text-orange-700" : "bg-stone-100 text-stone-600"
          }`}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-stone-900">{title}</span>
          <span className="block text-sm text-stone-600">{detail}</span>
        </span>
        <ArrowRightIcon className="size-5 shrink-0 text-stone-400" />
      </Link>
    </li>
  );
}
