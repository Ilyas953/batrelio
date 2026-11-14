import Link from "next/link";
import { Suspense } from "react";
import { PageTitle } from "@/components/espace/places";
import { ReturnBackLink } from "@/components/espace/BackLink";
import { withReturnTo } from "@/lib/espace/return-to";
import { requireUser } from "@/lib/auth/session";
import { formatPhone, formatTimeAgo } from "@/lib/format";
import { decideArtisanSms } from "@/lib/requests/artisan-sms";
import type { Tables } from "@/lib/supabase/database.types";
import { getFallbackSmsSender } from "@/lib/telephony/config";
import { CANCEL_FORWARDING_CODE, FORWARDING_RING_SECONDS, forwardingCode } from "@/lib/telephony/forwarding";
import { isIdentifiedCaller } from "@/lib/telephony/phone-rules";
import { toSmsStatus, type SmsStatus } from "@/lib/telephony/sms-status";
import {
  ActivateButton,
  ExcludeCallerButton,
  ExclusionForm,
  ForwardingCode,
  PauseToggle,
  RemoveExclusionButton,
} from "./AutoReplyControls";

const RECENT_CALLS = 10;
const PAGE = "/espace/reponse-automatique";

export default function AutoReplyPage({ searchParams }: PageProps<"/espace/reponse-automatique">) {
  return (
    <>
      <ReturnBackLink searchParams={searchParams} fallback="/espace/reglages" />
      <PageTitle
        place="autoReply"
        intro="Quand vous ne décrochez pas, votre client entend un message à votre nom et reçoit un SMS pour vous décrire son besoin."
      />
      <Suspense fallback={<p className="text-lg text-stone-500">Chargement…</p>}>
        <AutoReplySettings />
      </Suspense>
    </>
  );
}

async function AutoReplySettings() {
  const { supabase } = await requireUser();
  const { data: company } = await supabase
    .from("companies")
    .select("id, name, sms_sender_name, sms_sender_approved, phone_number, auto_reply_enabled, contact_phone")
    .maybeSingle();
  if (!company) return <p className="text-lg text-stone-600">Aucune entreprise n&apos;est liée à ce compte.</p>;

  const [{ data: calls }, { data: exclusions }] = await Promise.all([
    supabase
      .from("missed_calls")
      .select("id, caller_phone, sms_status, created_at")
      .order("created_at", { ascending: false })
      .limit(RECENT_CALLS),
    supabase.from("auto_reply_exclusions").select("id, phone, label").order("created_at", { ascending: false }),
  ]);
  const excludedPhones = new Set((exclusions ?? []).map((exclusion) => exclusion.phone));

  return (
    <div className="space-y-6">
      <SenderCard company={company} />
      <ArtisanSmsCard contactPhone={company.contact_phone} />
      <Card title="Votre message d'accueil">
        <p className="text-base text-stone-700">
          Voix et texte de votre message vocal, et message d&apos;envoi de vos devis.{" "}
          <Link href={withReturnTo("/espace/messages", PAGE)} className="font-semibold text-orange-700 underline">
            Personnaliser
          </Link>
        </p>
      </Card>
      {company.phone_number ? (
        <>
          <StatusCard enabled={company.auto_reply_enabled} phoneNumber={company.phone_number} />
          <ForwardingCard phoneNumber={company.phone_number} />
          <RecentCalls calls={calls ?? []} excludedPhones={excludedPhones} />
          <ExclusionsCard exclusions={exclusions ?? []} />
        </>
      ) : (
        <Card title="Activer">
          <p className="text-base text-stone-600">
            Nous vous attribuons un numéro Batrelio. Vous y renverrez les appels que vous ne prenez pas : votre numéro
            habituel ne change pas.
          </p>
          <ActivateButton />
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-bold text-stone-900">{title}</h2>
      {children}
    </section>
  );
}

type Company = Pick<Tables<"companies">, "sms_sender_name" | "sms_sender_approved">;

function SenderCard({ company }: { company: Company }) {
  const fallbackSender = getFallbackSmsSender();

  return (
    <Card title="Le SMS envoyé à vos clients">
      <p className="text-base text-stone-700">
        Nom d&apos;expéditeur : <strong className="font-mono">{company.sms_sender_name}</strong> ·{" "}
        <Link href={withReturnTo("/espace/entreprise", PAGE)} className="font-semibold text-orange-700 underline">
          modifier
        </Link>
      </p>
      {company.sms_sender_approved ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-base text-emerald-800">
          Ce nom est validé auprès des opérateurs : vos SMS partent à votre nom.
        </p>
      ) : (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-base text-amber-900">
          En France, chaque nom d&apos;expéditeur doit être enregistré auprès des opérateurs. Nous nous en
          occupons : comptez quelques jours.{" "}
          {fallbackSender
            ? `En attendant, vos SMS partent au nom de ${fallbackSender} et citent votre entreprise.`
            : "En attendant, certains opérateurs peuvent filtrer vos SMS."}
        </p>
      )}
    </Card>
  );
}

// The SMS the artisan receives for each new request.
function ArtisanSmsCard({ contactPhone }: { contactPhone: string | null }) {
  const reachable = decideArtisanSms(contactPhone, false) === "send";

  return (
    <Card title="Vous êtes prévenu par SMS">
      {reachable && contactPhone ? (
        <p className="text-base text-stone-700">
          À chaque nouvelle demande, un SMS part au <strong>{formatPhone(contactPhone)}</strong> avec le nom et le
          numéro du client.{" "}
          <Link href={withReturnTo("/espace/entreprise", PAGE)} className="font-semibold text-orange-700 underline">
            changer de numéro
          </Link>
        </p>
      ) : (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-base text-amber-900">
          Pour recevoir un SMS à chaque nouvelle demande, indiquez votre portable (06 ou 07) dans{" "}
          <Link href={withReturnTo("/espace/entreprise", PAGE)} className="font-semibold underline">
            Mon entreprise
          </Link>
          .
        </p>
      )}
      <p className="text-sm text-stone-500">
        Seuls les clients qui décrivent leur besoin deviennent des demandes. Les autres appels restent dans
        l&apos;historique des appels.
      </p>
    </Card>
  );
}

function StatusCard({ enabled, phoneNumber }: { enabled: boolean; phoneNumber: string }) {
  return (
    <Card title={enabled ? "Activée ✓" : "En pause"}>
      <p className="text-base text-stone-700">
        Votre numéro Batrelio : <strong className="text-lg">{formatPhone(phoneNumber)}</strong>
      </p>
      {!enabled && (
        <p className="text-base text-stone-600">
          Les appels renvoyés entendent toujours votre message d&apos;accueil, mais aucun SMS n&apos;est envoyé.
        </p>
      )}
      <PauseToggle enabled={enabled} />
    </Card>
  );
}

// The codes and the ring time are explained in lib/telephony/forwarding.ts.
function ForwardingCard({ phoneNumber }: { phoneNumber: string }) {
  return (
    <Card title="Renvoyer vos appels manqués">
      <ol className="list-decimal space-y-2 pl-6 text-base text-stone-700">
        <li>Sur le téléphone que vos clients appellent, composez ce code, puis appuyez sur appeler.</li>
        <li>Un message confirme que le renvoi est activé.</li>
        <li>Testez : faites-vous appeler et ne décrochez pas.</li>
      </ol>
      <ForwardingCode
        code={forwardingCode(phoneNumber)}
        label={`Activer le renvoi (pas de réponse après ${FORWARDING_RING_SECONDS} secondes, occupé, injoignable)`}
      />
      <ForwardingCode code={CANCEL_FORWARDING_CODE} label="Désactiver le renvoi" />
      <p className="text-sm text-stone-500">
        Déjà activé avec l&apos;ancien code ? Composez ce code une fois de plus : vos clients attendront moins
        longtemps avant d&apos;entendre votre message.
      </p>
      <p className="text-sm text-stone-500">
        Fonctionne chez Orange, SFR, Bouygues Telecom et Free. Votre opérateur peut facturer le renvoi d&apos;appel :
        renseignez-vous auprès de lui.
      </p>
    </Card>
  );
}

const SMS_STATUS_LABELS: Record<SmsStatus, string> = {
  pending: "En cours",
  sent: "SMS envoyé",
  delivered: "SMS reçu",
  failed: "SMS non distribué",
  skipped_disabled: "Pas de SMS : en pause",
  skipped_anonymous: "Numéro masqué",
  skipped_not_mobile: "Pas de SMS : ligne fixe",
  skipped_own_number: "Votre propre numéro",
  skipped_recent: "Déjà prévenu aujourd'hui",
  skipped_excluded: "Numéro exclu",
};

type Call = Pick<Tables<"missed_calls">, "id" | "caller_phone" | "sms_status" | "created_at">;

function RecentCalls({ calls, excludedPhones }: { calls: Call[]; excludedPhones: Set<string> }) {
  const now = new Date();

  return (
    <Card title="Derniers appels manqués">
      {calls.length === 0 ? (
        <p className="text-base text-stone-500">Aucun appel pour l&apos;instant.</p>
      ) : (
        <ul className="divide-y divide-stone-200">
          {calls.map((call) => {
            const status = toSmsStatus(call.sms_status);
            const excludablePhone =
              isIdentifiedCaller(call.caller_phone) && !excludedPhones.has(call.caller_phone) ? call.caller_phone : null;

            return (
              <li key={call.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900">
                    {call.caller_phone ? formatPhone(call.caller_phone) : "Numéro masqué"}
                  </p>
                  <p className="text-sm text-stone-500">{formatTimeAgo(call.created_at, now)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${status === "failed" ? "bg-red-50 text-red-700" : "bg-stone-100 text-stone-700"}`}
                  >
                    {SMS_STATUS_LABELS[status]}
                  </span>
                  {excludablePhone && <ExcludeCallerButton phone={excludablePhone} />}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

type Exclusion = Pick<Tables<"auto_reply_exclusions">, "id" | "phone" | "label">;

function ExclusionsCard({ exclusions }: { exclusions: Exclusion[] }) {
  return (
    <Card title="Numéros exclus">
      <p className="text-base text-stone-600">
        Famille, fournisseurs, associés : ces numéros ne reçoivent jamais de SMS, et leurs appels n&apos;arrivent pas
        dans vos demandes.
      </p>
      {exclusions.length > 0 && (
        <ul className="divide-y divide-stone-200">
          {exclusions.map((exclusion) => (
            <li key={exclusion.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">{formatPhone(exclusion.phone)}</p>
                {exclusion.label && <p className="truncate text-sm text-stone-500">{exclusion.label}</p>}
              </div>
              <RemoveExclusionButton exclusionId={exclusion.id} />
            </li>
          ))}
        </ul>
      )}
      <ExclusionForm />
    </Card>
  );
}
