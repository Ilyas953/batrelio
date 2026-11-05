import type { Metadata } from "next";
import { Suspense } from "react";
import { ReturnBackLink } from "@/components/espace/BackLink";
import { isTestAccount, requireUser } from "@/lib/auth/session";
import { formatPhone } from "@/lib/format";
import { defaultQuoteMessage } from "@/lib/quotes/share-message";
import { defaultGreetingIntro } from "@/lib/telephony/messages";
import { findGreetingVoice, type GreetingVoiceId } from "@/lib/telephony/voices";
import { GreetingForm, QuoteMessageForm } from "./MessageForms";

export const metadata: Metadata = {
  title: "Vos messages · Batrelio",
  robots: { index: false },
};

export default function MessagesPage({ searchParams }: PageProps<"/espace/messages">) {
  return (
    <>
      <ReturnBackLink searchParams={searchParams} fallback="/espace/reglages" />
      <h1 className="mb-2 mt-4 text-3xl font-extrabold tracking-tight text-stone-900">Vos messages</h1>
      <p className="mb-8 text-lg text-stone-600">
        Tout fonctionne déjà avec nos messages. Personnalisez-les seulement si vous le souhaitez.
      </p>
      <Suspense fallback={<p className="text-lg text-stone-500">Chargement…</p>}>
        <MessageSettings />
      </Suspense>
    </>
  );
}

const CARD = "space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6";

async function MessageSettings() {
  const { supabase, claims } = await requireUser();
  const { data: company } = await supabase
    .from("companies")
    .select("name, greeting_intro, greeting_voice, quote_message, phone_number, phone_number_sid, contact_phone")
    .maybeSingle();
  if (!company) return <p className="text-lg text-stone-600">Aucune entreprise n&apos;est liée à ce compte.</p>;

  const canPreview = Boolean(company.phone_number_sid) && !isTestAccount(claims.app_metadata);

  return (
    <div className="space-y-6">
      <section className={CARD}>
        <div>
          <h2 className="text-xl font-bold text-stone-900">Le message vocal</h2>
          <p className="mt-1 text-base text-stone-600">Ce qu&apos;entend un client quand vous ne décrochez pas.</p>
        </div>
        <GreetingForm
          companyName={company.name}
          initialVoice={findGreetingVoice(company.greeting_voice).id as GreetingVoiceId}
          initialIntro={company.greeting_intro ?? defaultGreetingIntro(company.name)}
          defaultPhone={company.contact_phone ? formatPhone(company.contact_phone) : ""}
          canPreview={canPreview}
        />
      </section>

      <section className={CARD}>
        <div>
          <h2 className="text-xl font-bold text-stone-900">Le message d&apos;envoi des devis</h2>
          <p className="mt-1 text-base text-stone-600">Le texte qui accompagne le lien quand vous envoyez un devis.</p>
        </div>
        <QuoteMessageForm
          companyName={company.name}
          initialMessage={company.quote_message ?? defaultQuoteMessage(company.name)}
          defaultMessage={defaultQuoteMessage(company.name)}
        />
      </section>
    </div>
  );
}
