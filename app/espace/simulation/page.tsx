import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PLACES } from "@/components/espace/places";
import { IconTile } from "@/components/espace/tones";
import { BackLink } from "@/components/espace/BackLink";
import { requireTestAccount } from "@/lib/auth/session";
import { formatPhone } from "@/lib/format";
import { randomFictionMobile } from "@/lib/simulation/fiction-numbers";
import { RestartButton, SimulateCallForm } from "./SimulatorControls";

export const metadata: Metadata = {
  title: "Simulateur · Batrelio",
  robots: { index: false },
};

export default function SimulatorPage() {
  return (
    <>
      <BackLink href="/espace/reglages" label="Réglages" />
      <Suspense fallback={<p className="mt-4 text-lg text-stone-500">Chargement…</p>}>
        <Simulator />
      </Suspense>
    </>
  );
}

const CARD = "rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6";

async function Simulator() {
  const { supabase } = await requireTestAccount();
  const { data: company } = await supabase
    .from("companies")
    .select("phone_number, auto_reply_enabled, sms_sender_name")
    .maybeSingle();

  return (
    <div className="mt-4 space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <IconTile tone={PLACES.simulator.tone}>
            <PLACES.simulator.Icon />
          </IconTile>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Simulateur</h1>
        </div>
        <p className="mt-2 text-lg text-stone-600">
          Compte de test : votre numéro Batrelio est fictif et aucun SMS n&apos;est envoyé. Tout le reste fonctionne
          pour de vrai : la demande arrive dans votre espace et vous pouvez faire le devis.
        </p>
      </header>

      <section className={CARD}>
        <h2 className="text-xl font-bold text-stone-900">Un client vous appelle, vous ne décrochez pas</h2>
        {company?.phone_number ? (
          <div className="mt-4 space-y-4">
            <p className="text-base text-stone-600">
              Appel vers votre numéro fictif <strong className="text-stone-900">{formatPhone(company.phone_number)}</strong>
              {company.auto_reply_enabled ? "" : " · réponse automatique en pause"}
            </p>
            <SimulateCallForm defaultCaller={formatPhone(randomFictionMobile())} />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-base text-stone-600">
              Activez d&apos;abord votre numéro Batrelio dans le guide (étape 2) : aucun numéro n&apos;est acheté, un
              numéro fictif vous est attribué.
            </p>
            <Link
              href="/espace/demarrage"
              className="flex min-h-14 items-center justify-center rounded-2xl bg-orange-600 px-5 text-lg font-semibold text-white hover:bg-orange-700"
            >
              Ouvrir le guide
            </Link>
          </div>
        )}
      </section>

      <section className={CARD}>
        <h2 className="text-xl font-bold text-stone-900">Refaire la mise en place</h2>
        <p className="mt-2 text-base text-stone-600">
          Supprime ce compte de test et en crée un neuf, vierge, pour repasser le guide depuis le début.
        </p>
        <div className="mt-4">
          <RestartButton />
        </div>
      </section>

      <p className="text-center text-sm text-stone-500">
        Pour revenir à l&apos;admin : Déconnexion, puis connectez-vous avec votre compte admin.
      </p>
    </div>
  );
}
