import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/session";
import { formatPhone, formatTimeAgo } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";
import { getFallbackSmsSender } from "@/lib/telephony/config";
import { ActivateButton, ForwardingCode, PauseToggle } from "./AutoReplyControls";

const RECENT_CALLS = 10;

export default function AutoReplyPage() {
  return (
    <>
      <Link href="/espace" className="text-base font-semibold text-stone-500 hover:text-stone-900">
        ← Retour
      </Link>
      <h1 className="mb-2 mt-4 text-3xl font-extrabold tracking-tight text-stone-900">Réponse automatique</h1>
      <p className="mb-8 text-lg text-stone-600">
        Quand vous ne décrochez pas, votre client entend un message à votre nom et reçoit un SMS pour vous décrire
        son besoin.
      </p>
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
    .select("id, name, sms_sender_name, sms_sender_approved, phone_number, auto_reply_enabled")
    .maybeSingle();
  if (!company) return <p className="text-lg text-stone-600">Aucune entreprise n&apos;est liée à ce compte.</p>;

  const { data: calls } = await supabase
    .from("missed_calls")
    .select("id, caller_phone, sms_status, created_at")
    .order("created_at", { ascending: false })
    .limit(RECENT_CALLS);

  return (
    <div className="space-y-6">
      <SenderCard company={company} />
      {company.phone_number ? (
        <>
          <StatusCard enabled={company.auto_reply_enabled} phoneNumber={company.phone_number} />
          <ForwardingCard phoneNumber={company.phone_number} />
          <RecentCalls calls={calls ?? []} />
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
        <Link href="/espace/entreprise" className="font-semibold text-orange-700 underline">
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

// French operators share the GSM codes: **004* covers no answer, busy and unreachable.
function ForwardingCard({ phoneNumber }: { phoneNumber: string }) {
  const nationalNumber = formatPhone(phoneNumber).replaceAll(" ", "");

  return (
    <Card title="Renvoyer vos appels manqués">
      <ol className="list-decimal space-y-2 pl-6 text-base text-stone-700">
        <li>Sur le téléphone que vos clients appellent, composez ce code, puis appuyez sur appeler.</li>
        <li>Un message confirme que le renvoi est activé.</li>
        <li>Testez : faites-vous appeler et ne décrochez pas.</li>
      </ol>
      <ForwardingCode code={`**004*${nationalNumber}#`} label="Activer le renvoi (pas de réponse, occupé, injoignable)" />
      <ForwardingCode code="##004#" label="Désactiver le renvoi" />
      <p className="text-sm text-stone-500">
        Fonctionne chez Orange, SFR, Bouygues Telecom et Free. Votre opérateur peut facturer le renvoi d&apos;appel :
        renseignez-vous auprès de lui.
      </p>
    </Card>
  );
}

const SMS_STATUS_LABELS: Record<Tables<"missed_calls">["sms_status"], string> = {
  pending: "En cours",
  sent: "SMS envoyé",
  delivered: "SMS reçu",
  failed: "SMS non distribué",
  skipped_disabled: "Pas de SMS : en pause",
  skipped_anonymous: "Numéro masqué",
  skipped_not_mobile: "Pas de SMS : ligne fixe",
  skipped_own_number: "Votre propre numéro",
  skipped_recent: "Déjà prévenu aujourd'hui",
};

type Call = Pick<Tables<"missed_calls">, "id" | "caller_phone" | "sms_status" | "created_at">;

function RecentCalls({ calls }: { calls: Call[] }) {
  const now = new Date();

  return (
    <Card title="Derniers appels manqués">
      {calls.length === 0 ? (
        <p className="text-base text-stone-500">Aucun appel pour l&apos;instant.</p>
      ) : (
        <ul className="divide-y divide-stone-200">
          {calls.map((call) => (
            <li key={call.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="font-semibold text-stone-900">
                  {call.caller_phone ? formatPhone(call.caller_phone) : "Numéro masqué"}
                </p>
                <p className="text-sm text-stone-500">{formatTimeAgo(call.created_at, now)}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${call.sms_status === "failed" ? "bg-red-50 text-red-700" : "bg-stone-100 text-stone-700"}`}
              >
                {SMS_STATUS_LABELS[call.sms_status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
