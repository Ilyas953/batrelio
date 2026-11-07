import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink } from "@/components/espace/BackLink";
import { CameraIcon, ForwardIcon, LinkIcon, MapPinIcon, MessageIcon, PhoneIcon, PhoneMissedIcon } from "@/components/landing/icons";
import { QuoteStatusPill, QuoteStatusTile } from "@/components/espace/places";
import { IconTile, type Tone } from "@/components/espace/tones";
import { getRequestDetail } from "@/lib/espace/request-detail";
import { formatPhone, formatPrice, formatTimeAgo } from "@/lib/format";
import { MISSION_STATUS_FOR_ARTISAN, SHARE_REWARD_PROMISE } from "@/lib/missions/shared-mission";
import { formatVisit, toVisitInputs, visitMessage } from "@/lib/requests/visit";
import { MakeQuoteButton } from "./MakeQuoteButton";
import { ShareMissionPanel, VisitPanel, type ExistingVisit } from "./RequestActions";

// Preparing a quote with the AI can take several dozen seconds.
export const maxDuration = 120;

export default function RequestDetailPage({ params, searchParams }: PageProps<"/espace/demandes/[id]">) {
  return (
    <>
      <BackLink href="/espace" label="Demandes" />
      <Suspense fallback={<p className="mt-8 text-lg text-stone-500">Chargement…</p>}>
        {Promise.all([params, searchParams]).then(([{ id }, query]) => (
          <RequestDetail requestId={id} openSharing={query.partager === "1"} />
        ))}
      </Suspense>
    </>
  );
}

function toMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

async function RequestDetail({ requestId, openSharing }: { requestId: string; openSharing: boolean }) {
  const request = await getRequestDetail(requestId);
  if (!request) notFound();

  return (
    <article className="mt-4 space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">{request.customer_name ?? "Client"}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-base text-stone-500">
          {request.source === "link" ? <LinkIcon className="size-4" /> : <PhoneMissedIcon className="size-4" />}
          {request.source === "link" ? "Demande envoyée par lien" : "Après un appel manqué"} ·{" "}
          {formatTimeAgo(request.created_at, new Date())}
        </p>
      </header>

      <a
        href={`tel:${request.customer_phone}`}
        className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 text-lg font-semibold text-white hover:bg-orange-700"
      >
        <PhoneIcon className="size-5" />
        Appeler le {formatPhone(request.customer_phone)}
      </a>

      <RequestActions request={request} openSharing={openSharing} />

      {request.description && (
        <section className="rounded-3xl bg-white p-5 sm:p-6">
          <SectionLabel icon={<MessageIcon />} tone="violet">Son besoin</SectionLabel>
          <p className="mt-2 whitespace-pre-line text-lg leading-relaxed text-stone-900">{request.description}</p>
        </section>
      )}

      {request.address && (
        <section className="rounded-3xl bg-white p-5 sm:p-6">
          <SectionLabel icon={<MapPinIcon />} tone="emerald">Adresse du chantier</SectionLabel>
          <p className="mt-2 text-lg text-stone-900">{request.address}</p>
          <a
            href={toMapsUrl(request.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-base font-semibold text-orange-700 underline"
          >
            Voir sur la carte
          </a>
        </section>
      )}

      {request.photoUrls.length > 0 && (
        <section>
          <div className="mb-3">
            <SectionLabel icon={<CameraIcon />} tone="sky">Photos ({request.photoUrls.length})</SectionLabel>
          </div>
          <ul className="grid grid-cols-2 gap-3">
            {request.photoUrls.map((url, index) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl bg-stone-100">
                  {/* Private photos behind short-lived signed URLs: they must not go through the shared image cache. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${index + 1} envoyée par le client`} className="aspect-square w-full object-cover" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

type RequestWithQuotes = NonNullable<Awaited<ReturnType<typeof getRequestDetail>>>;

function toExistingVisit(request: RequestWithQuotes): ExistingVisit | null {
  if (!request.visit_at) return null;
  return {
    label: formatVisit(request.visit_at),
    ...toVisitInputs(request.visit_at),
    message: {
      shareText: visitMessage({ companyName: request.companyName, customerName: request.customer_name, visitAt: request.visit_at }),
      customerPhone: request.customer_phone,
    },
  };
}

// Three answers to a request: a quote, a visit, or sharing the mission with Batrelio.
function RequestActions({ request, openSharing }: { request: RequestWithQuotes; openSharing: boolean }) {
  const quotes = request.quotes.toSorted((a, b) => b.created_at.localeCompare(a.created_at));
  const draft = quotes.find((quote) => quote.status === "draft");
  const mission = request.sharedMission;

  return (
    <section className="space-y-3">
      {quotes.length > 0 && (
        <ul className="space-y-2">
          {quotes.map((quote) => (
            <li key={quote.id}>
              <Link
                href={`/espace/devis/${quote.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 hover:ring-stone-300"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <QuoteStatusTile status={quote.status} size="sm" />
                  <span>
                    <span className="block font-semibold text-stone-900">
                      Devis {quote.number ? `n° ${quote.number}` : ""}
                    </span>
                    <QuoteStatusPill status={quote.status} />
                  </span>
                </span>
                <span className="font-bold tabular-nums text-stone-900">{formatPrice(quote.total_cents)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {mission ? (
        <SharedMissionCard status={mission.status} />
      ) : (
        <>
          {draft ? (
            <Link
              href={`/espace/devis/${draft.id}`}
              className="flex min-h-14 items-center justify-center rounded-2xl bg-stone-900 px-5 text-lg font-semibold text-white hover:bg-stone-700"
            >
              Reprendre le devis
            </Link>
          ) : (
            <MakeQuoteButton requestId={request.id} label={quotes.length ? "Faire un autre devis" : "Faire le devis"} />
          )}
          <VisitPanel requestId={request.id} existing={toExistingVisit(request)} minDate={toVisitInputs(new Date()).date} />
          <ShareMissionPanel requestId={request.id} initiallyOpen={openSharing} />
        </>
      )}
    </section>
  );
}

function SharedMissionCard({ status }: { status: keyof typeof MISSION_STATUS_FOR_ARTISAN }) {
  return (
    <section className="flex items-start gap-4 rounded-3xl bg-violet-50 p-5 ring-1 ring-violet-200 sm:p-6">
      <IconTile tone="violet">
        <ForwardIcon />
      </IconTile>
      <div>
        <p className="text-lg font-bold text-violet-950">Mission partagée</p>
        <p className="mt-1 text-base text-violet-900">{MISSION_STATUS_FOR_ARTISAN[status]}</p>
        {(status === "to_place" || status === "in_progress") && (
          <p className="mt-2 text-sm font-semibold text-emerald-800">{SHARE_REWARD_PROMISE}</p>
        )}
      </div>
    </section>
  );
}

function SectionLabel({ icon, tone, children }: { icon: React.ReactNode; tone: Tone; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
      <IconTile tone={tone} size="sm">
        {icon}
      </IconTile>
      {children}
    </h2>
  );
}
