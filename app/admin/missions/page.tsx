import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { listSharedMissions, type SharedMission } from "@/lib/admin/missions";
import { REGION_LABELS, TRADE_LABELS } from "@/lib/company/details";
import { formatPhone, formatTimeAgo } from "@/lib/format";
import { MAX_ADMIN_NOTE_LENGTH, SHARE_REWARD_PERCENT, MISSION_STATUSES, MISSION_STATUS_LABELS, type MissionStatus } from "@/lib/missions/shared-mission";
import { formatVisit } from "@/lib/requests/visit";
import { updateMission } from "./actions";

export const metadata: Metadata = {
  title: "Missions partagées · Admin Batrelio",
  robots: { index: false },
};

const STATUS_CLASSES: Record<MissionStatus, string> = {
  to_place: "bg-orange-100 text-orange-800",
  in_progress: "bg-sky-100 text-sky-800",
  placed: "bg-emerald-100 text-emerald-800",
  abandoned: "bg-stone-200 text-stone-700",
};

export default function SharedMissionsPage({ searchParams }: PageProps<"/admin/missions">) {
  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">Missions partagées</h1>
      <p className="mb-8 mt-2 text-lg text-stone-600">
        Des demandes que l&apos;artisan ne peut pas prendre. Trouvez-leur un artisan, prévenez le client, puis notez
        ici où vous en êtes.
      </p>
      <Suspense fallback={<p className="text-lg text-stone-500">Chargement des missions…</p>}>
        {searchParams.then((params) => (
          <MissionLists hasError={params.erreur === "1"} />
        ))}
      </Suspense>
    </>
  );
}

async function MissionLists({ hasError }: { hasError: boolean }) {
  const missions = await listSharedMissions();
  const byStatus = (status: MissionStatus) => missions.filter((mission) => mission.status === status);
  const open = [...byStatus("to_place"), ...byStatus("in_progress")];
  const closed = [...byStatus("placed"), ...byStatus("abandoned")];

  return (
    <div className="space-y-10">
      {hasError && (
        <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-base font-medium text-red-700">
          La mission n&apos;a pas été modifiée : la note est trop longue ou le statut inconnu.
        </p>
      )}
      <section>
        <h2 className="mb-4 text-xl font-bold text-stone-900">À traiter ({open.length})</h2>
        {open.length === 0 ? (
          <p className="rounded-3xl border-2 border-dashed border-stone-200 p-5 text-base text-stone-500">
            Aucune mission en attente. Quand un artisan partage une demande, elle arrive ici.
          </p>
        ) : (
          <ul className="space-y-4">
            {open.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </ul>
        )}
      </section>
      {closed.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xl font-bold text-stone-900">Terminées ({closed.length})</summary>
          <ul className="mt-4 space-y-4">
            {closed.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function toMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function MissionCard({ mission }: { mission: SharedMission }) {
  const { request } = mission;
  const company = request?.company ?? null;
  const now = new Date();

  return (
    <li id={`mission-${mission.id}`} className="scroll-mt-6 rounded-3xl border border-stone-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${STATUS_CLASSES[mission.status]}`}>
          {MISSION_STATUS_LABELS[mission.status]}
        </span>
        {company?.trade && (
          <span className="rounded-full bg-stone-100 px-3 py-0.5 text-sm font-semibold text-stone-700">
            {TRADE_LABELS[company.trade]}
          </span>
        )}
        <span className="text-sm text-stone-500">Partagée {formatTimeAgo(mission.created_at, now)}</span>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Le client</h3>
          <p className="text-xl font-bold text-stone-900">{request?.customer_name ?? "Nom non indiqué"}</p>
          {request && (
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${request.customer_phone}`} className="inline-flex min-h-11 items-center rounded-xl bg-orange-600 px-4 font-semibold text-white hover:bg-orange-700">
                Appeler le {formatPhone(request.customer_phone)}
              </a>
              <a href={`sms:${request.customer_phone}`} className="inline-flex min-h-11 items-center rounded-xl border-2 border-stone-200 px-4 font-semibold text-stone-800 hover:border-stone-900">
                SMS
              </a>
            </div>
          )}
          {request?.address && (
            <p className="text-base text-stone-800">
              {request.address} ·{" "}
              <a href={toMapsUrl(request.address)} target="_blank" rel="noopener noreferrer" className="font-semibold text-orange-700 underline">
                carte
              </a>
            </p>
          )}
          {request?.description && <p className="whitespace-pre-line text-base leading-relaxed text-stone-800">{request.description}</p>}
          {request?.visit_at && <p className="text-sm text-stone-600">Visite proposée par l&apos;artisan : {formatVisit(request.visit_at)}</p>}
          {mission.photoUrls.length > 0 && (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {mission.photoUrls.map((url, index) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl bg-stone-100">
                    {/* Private photos behind short-lived signed URLs: they must not go through the shared image cache. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Photo ${index + 1} du client`} className="aspect-square w-full object-cover" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Partagée par</h3>
          {company ? (
            <p className="text-base text-stone-800">
              <Link href={`/admin/comptes/${company.id}`} className="font-bold text-stone-900 underline">
                {company.name}
              </Link>
              {company.city ? ` · ${company.city}` : ""}
              {company.region ? ` · ${REGION_LABELS[company.region]}` : ""}
              {company.contact_phone && (
                <>
                  {" · "}
                  <a href={`tel:${company.contact_phone}`} className="font-semibold text-orange-700 underline">
                    {formatPhone(company.contact_phone)}
                  </a>
                </>
              )}
            </p>
          ) : (
            <p className="text-base text-stone-500">Entreprise supprimée</p>
          )}
          {company && (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-base font-semibold text-emerald-900">
              Promis : {SHARE_REWARD_PERCENT} % du chantier à {company.name} s&apos;il est réalisé.
            </p>
          )}
          {mission.artisan_note && (
            <blockquote className="rounded-2xl bg-violet-50 px-4 py-3 text-base text-violet-950">« {mission.artisan_note} »</blockquote>
          )}

          <form action={updateMission.bind(null, mission.id)} className="space-y-3 rounded-2xl bg-stone-50 p-4">
            <fieldset>
              <legend className="mb-2 text-base font-semibold text-stone-800">Où en est-elle ?</legend>
              <div className="grid grid-cols-2 gap-2">
                {MISSION_STATUSES.map((status) => (
                  <label
                    key={status}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border-2 border-stone-200 bg-white px-3 font-semibold text-stone-800 has-checked:border-stone-900"
                  >
                    <input type="radio" name="status" value={status} defaultChecked={mission.status === status} className="accent-stone-900" />
                    {MISSION_STATUS_LABELS[status]}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor={`note-${mission.id}`} className="mb-2 block text-base font-semibold text-stone-800">
                Notes internes <span className="font-normal text-stone-500">(jamais montrées à l&apos;artisan)</span>
              </label>
              <textarea
                id={`note-${mission.id}`}
                name="adminNote"
                rows={3}
                maxLength={MAX_ADMIN_NOTE_LENGTH}
                defaultValue={mission.admin_note ?? ""}
                placeholder="Ex. : proposée à Toitures Dupont le 6/11, client prévenu"
                className="block w-full rounded-xl border-2 border-stone-200 bg-white px-3 py-2 text-base text-stone-900 outline-none focus:border-orange-500"
              />
            </div>
            <button type="submit" className="min-h-11 rounded-xl bg-stone-900 px-5 font-semibold text-white hover:bg-stone-700">
              Enregistrer
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}
