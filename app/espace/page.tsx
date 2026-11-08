import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  DocumentIcon,
  FlagIcon,
  ForwardIcon,
  InboxIcon,
  LinkIcon,
  MapPinIcon,
  PhoneIcon,
  PhoneMissedIcon,
} from "@/components/landing/icons";
import { Section } from "@/components/espace/lists";
import { InstallAppCard } from "@/components/espace/InstallAppCard";
import { RewardBadge } from "@/components/espace/RewardBadge";
import { IconTile, StatusPill, type Tone } from "@/components/espace/tones";
import { withReturnTo } from "@/lib/espace/return-to";
import { getDashboard, type HandledRequest, type NewRequest } from "@/lib/espace/dashboard";
import { formatPhone, formatTimeAgo } from "@/lib/format";
import { formatVisitShort } from "@/lib/requests/visit";
import { RequestLinkPanel } from "./RequestLinkPanel";

const HOME = "/espace";

export default function ArtisanSpacePage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

const todayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Paris",
});

async function Dashboard() {
  const { companyName, missingQuoteDetails, setup, autoReply, newRequests, handledRequests, quoteCounts, newRequestSmsBlocker } =
    await getDashboard();
  const setupPending = setup !== null && setup.doneCount < setup.total;
  const now = new Date();

  return (
    <div className="space-y-8">
      <Welcome
        companyName={companyName}
        today={todayFormatter.format(now)}
        counts={{ toHandle: newRequests.length, ...quoteCounts }}
      />

      {setupPending ? (
        <SetupCard doneCount={setup.doneCount} total={setup.total} />
      ) : (
        // Only once there is a quote to make: no paperwork before the first client.
        missingQuoteDetails.length > 0 && newRequests.length > 0 && <MissingDetailsBanner missing={missingQuoteDetails} />
      )}
      {!setupPending && newRequestSmsBlocker && <SmsBlockerBanner blocker={newRequestSmsBlocker} />}

      <Section
        id="a-traiter"
        tourId="requests"
        title="À traiter"
        count={newRequests.length}
        icon={<BellIcon />}
        tone="orange"
        highlight
        empty={{
          icon: <InboxIcon className="size-7" />,
          title: "Rien à traiter pour l'instant",
          detail: "Quand un client décrit son besoin, après un appel manqué ou par lien, sa demande arrive ici.",
        }}
      >
        {newRequests.map((request, index) => (
          <RequestCard key={request.id} request={request} now={now} isFirst={index === 0} />
        ))}
      </Section>

      {/* After the requests: on a phone, what the artisan came for is visible without scrolling. */}
      <div className="grid gap-3 sm:grid-cols-2">
        {autoReply && <AutoReplyTile phoneNumber={autoReply.phoneNumber} enabled={autoReply.enabled} />}
        <RequestLinkPanel />
      </div>
      <InstallAppCard dismissible />

      {handledRequests.length > 0 && (
        <Section
          id="traitees"
          title="Traitées récemment"
          count={handledRequests.length}
          icon={<CheckIcon />}
          tone="emerald"
          empty={{ icon: <CheckIcon className="size-7" />, title: "", detail: "" }}
        >
          {handledRequests.map((request) => (
            <HandledRequestRow key={request.id} request={request} now={now} />
          ))}
        </Section>
      )}
    </div>
  );
}

const HANDLED_STATUS: Record<HandledRequest["status"], { label: string; tone: Tone; Icon: typeof CheckIcon }> = {
  new: { label: "À traiter", tone: "orange", Icon: BellIcon },
  quoted: { label: "Devis envoyé", tone: "sky", Icon: DocumentIcon },
  visit_proposed: { label: "Visite proposée", tone: "emerald", Icon: CalendarIcon },
  shared: { label: "Mission partagée", tone: "violet", Icon: ForwardIcon },
  closed: { label: "Clôturée", tone: "stone", Icon: CheckIcon },
};

function HandledRequestRow({ request, now }: { request: HandledRequest; now: Date }) {
  const status = HANDLED_STATUS[request.status];

  return (
    <li>
      <Link
        href={`/espace/demandes/${request.id}`}
        className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-200 transition hover:ring-stone-300 sm:p-5"
      >
        <IconTile tone={status.tone}>
          <status.Icon />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-stone-900">
            {request.customer_name ?? formatPhone(request.customer_phone)}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-stone-500">
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            {request.visit_at && request.status !== "shared"
              ? `Visite ${formatVisitShort(request.visit_at)}`
              : formatTimeAgo(request.created_at, now)}
          </p>
        </div>
        <ArrowRightIcon className="size-5 shrink-0 text-stone-400" />
      </Link>
    </li>
  );
}

type Counts = { toHandle: number; pending: number; signed: number };

function summarize(toHandle: number): string {
  if (toHandle === 0) return "Rien à traiter pour l'instant. Bon chantier !";
  return toHandle === 1 ? "1 client attend votre réponse." : `${toHandle} clients attendent votre réponse.`;
}

function Welcome({ companyName, today, counts }: { companyName: string | null; today: string; counts: Counts }) {
  const stats = [
    { href: "#a-traiter", label: "À traiter", value: counts.toHandle, accent: counts.toHandle > 0, Icon: BellIcon, iconColor: "text-orange-300" },
    { href: "/espace/devis#en-attente", label: "En attente", value: counts.pending, accent: false, Icon: ClockIcon, iconColor: "text-sky-300" },
    { href: "/espace/devis#signes", label: "Signés", value: counts.signed, accent: false, Icon: CheckIcon, iconColor: "text-emerald-300" },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-stone-900 p-6 text-white sm:p-8">
      <div aria-hidden="true" className="absolute -right-16 -top-20 size-56 rounded-full bg-orange-500/25 blur-3xl" />
      <p className="relative text-sm font-medium capitalize text-stone-400">{today}</p>
      <h1 className="relative mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Bonjour{companyName ? `, ${companyName}` : ""}
      </h1>
      <p className="relative mt-2 text-lg text-stone-300">{summarize(counts.toHandle)}</p>

      <div className="relative mt-6 grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className={`rounded-2xl px-3 py-3 transition-colors ${stat.accent ? "bg-orange-600 hover:bg-orange-500" : "bg-white/10 hover:bg-white/15"}`}
          >
            <span className="flex items-center justify-between gap-1">
              <span className="text-2xl font-extrabold tabular-nums">{stat.value}</span>
              <stat.Icon className={`size-5 ${stat.accent ? "text-white" : stat.iconColor}`} />
            </span>
            <span className={`block text-sm ${stat.accent ? "text-orange-50" : "text-stone-300"}`}>{stat.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// "votre assurance et votre médiateur", "votre SIRET, votre TVA et votre assurance".
function joinWithEt(items: string[]): string {
  return items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`;
}

// Shown until the setup guide is complete: the one thing a new artisan has to finish.
function SetupCard({ doneCount, total }: { doneCount: number; total: number }) {
  const progress = Math.round((doneCount / total) * 100);

  return (
    <Link
      href="/espace/demarrage"
      data-tour="setup"
      className="block rounded-3xl bg-white p-5 shadow-sm ring-2 ring-orange-500 transition hover:ring-orange-600 sm:p-6"
    >
      <span className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-3 text-lg font-bold text-stone-900">
          <IconTile tone="amber" size="sm">
            <FlagIcon />
          </IconTile>
          Terminez la mise en place
        </span>
        <span className="text-sm font-semibold text-stone-600">
          {doneCount} sur {total}
        </span>
      </span>
      <span className="mt-3 block h-3 overflow-hidden rounded-full bg-stone-200">
        <span className="block h-full rounded-full bg-orange-600" style={{ width: `${progress}%` }} />
      </span>
      <span className="mt-3 flex items-center justify-between gap-4 text-base text-stone-600">
        Encore quelques minutes et vos appels manqués recevront un SMS.
        <ArrowRightIcon className="size-5 shrink-0 text-orange-700" />
      </span>
    </Link>
  );
}

function MissingDetailsBanner({ missing }: { missing: string[] }) {
  return (
    <Link
      href={withReturnTo("/espace/entreprise", HOME)}
      className="flex items-center gap-4 rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 transition-colors hover:border-amber-300"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800">
        <DocumentIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold text-amber-950">Avant votre premier devis</span>
        <span className="block text-base text-amber-900">Il manque {joinWithEt(missing)} : ils doivent figurer sur vos devis.</span>
      </span>
      <ArrowRightIcon className="size-5 shrink-0 text-amber-800" />
    </Link>
  );
}

// Without a mobile number in Mon entreprise, the artisan is not told about new requests.
function SmsBlockerBanner({ blocker }: { blocker: "skipped_no_phone" | "skipped_not_mobile" }) {
  return (
    <Link
      href={withReturnTo("/espace/entreprise", HOME)}
      className="flex items-center gap-4 rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 transition-colors hover:border-amber-300"
    >
      <IconTile tone="amber">
        <BellIcon />
      </IconTile>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold text-amber-950">Soyez prévenu par SMS</span>
        <span className="block text-base text-amber-900">
          {blocker === "skipped_no_phone"
            ? "Ajoutez votre numéro de portable : vous recevrez un SMS à chaque nouvelle demande."
            : "Votre numéro n'est pas un portable : indiquez un 06 ou un 07 pour recevoir un SMS à chaque nouvelle demande."}
        </span>
      </span>
      <ArrowRightIcon className="size-5 shrink-0 text-amber-800" />
    </Link>
  );
}

function AutoReplyTile({ phoneNumber, enabled }: { phoneNumber: string | null; enabled: boolean }) {
  const activeNumber = enabled ? phoneNumber : null;
  const status = activeNumber ? "Activée" : phoneNumber ? "En pause" : "Pas encore activée";
  const detail = activeNumber
    ? `Vos appels manqués reçoivent un SMS · ${formatPhone(activeNumber)}`
    : "Quand vous ne décrochez pas, votre client reçoit un SMS pour décrire son besoin.";

  return (
    <Link
      href={withReturnTo("/espace/reponse-automatique", HOME)}
      className="flex items-start gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200 transition hover:ring-stone-300"
    >
      <span
        className={`grid size-12 shrink-0 place-items-center rounded-2xl ${activeNumber ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}
      >
        <PhoneMissedIcon />
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-bold text-stone-900">Réponse automatique</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
          <span className={`size-2 rounded-full ${activeNumber ? "bg-emerald-500" : "bg-orange-500"}`} />
          <span className={activeNumber ? "text-emerald-700" : "text-orange-700"}>{status}</span>
        </span>
        <span className="mt-1 block text-sm text-stone-600">{detail}</span>
      </span>
    </Link>
  );
}

// "Mme Le Goff" -> "LG", "Paul Roux" -> "PR". Null when there is no name to show.
function initialsOf(name: string | null): string | null {
  const words = (name ?? "").replace(/^(M\.|Mme|Mlle)\s+/i, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function SourceBadge({ source }: { source: NewRequest["source"] }) {
  const isLink = source === "link";
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
      {isLink ? <LinkIcon className="size-3.5" /> : <PhoneMissedIcon className="size-3.5" />}
      {isLink ? "Lien" : "Appel manqué"}
    </span>
  );
}

function RequestCard({ request, now, isFirst }: { request: NewRequest; now: Date; isFirst: boolean }) {
  const initials = initialsOf(request.customer_name);
  const hiddenPhotos = request.photoCount - request.photoPreviews.length;

  return (
    <li className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200">
      <Link href={`/espace/demandes/${request.id}`} className="block p-5 transition-colors hover:bg-stone-50">
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-orange-100 text-base font-bold text-orange-800">
            {initials ?? <PhoneIcon className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-lg font-bold text-stone-900">
                {request.customer_name ?? formatPhone(request.customer_phone)}
              </p>
              <p className="shrink-0 text-sm text-stone-500">{formatTimeAgo(request.submitted_at ?? "", now)}</p>
            </div>
            <div className="mt-1">
              <SourceBadge source={request.source} />
            </div>
          </div>
        </div>

        {request.description && <p className="mt-3 line-clamp-3 text-base leading-relaxed text-stone-700">{request.description}</p>}

        {request.photoPreviews.length > 0 && (
          <div className="mt-3 flex gap-2">
            {request.photoPreviews.map((url, index) => (
              <span key={url} className="relative size-20 overflow-hidden rounded-2xl bg-stone-100">
                {/* Private photos behind short-lived signed URLs: they must not go through the shared image cache. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${index + 1}`} className="size-full object-cover" />
                {index === request.photoPreviews.length - 1 && hiddenPhotos > 0 && (
                  <span className="absolute inset-0 grid place-items-center bg-stone-900/60 text-lg font-bold text-white">
                    +{hiddenPhotos}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        {request.address && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-stone-500">
            <MapPinIcon className="size-4 shrink-0" />
            <span className="truncate">{request.address}</span>
          </p>
        )}
      </Link>

      <div className="grid grid-cols-2 gap-2 border-t border-stone-100 p-3">
        <a
          href={`tel:${request.customer_phone}`}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 text-base font-semibold text-white hover:bg-orange-700"
        >
          <PhoneIcon className="size-5" />
          Appeler
        </a>
        {/* Opens the request with the sharing form ready: one more tap to confirm. */}
        <Link
          href={`/espace/demandes/${request.id}?partager=1#partager`}
          data-tour={isFirst ? "share" : undefined}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-violet-50 px-3 text-base font-semibold text-violet-800 ring-2 ring-violet-200 hover:bg-violet-100"
        >
          <ForwardIcon className="size-5 shrink-0" />
          Partager
          <RewardBadge />
        </Link>
      </div>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement de votre tableau de bord" className="animate-pulse space-y-8">
      <div className="h-52 rounded-3xl bg-stone-200" />
      <div className="space-y-3">
        <div className="h-7 w-40 rounded-full bg-stone-200" />
        <div className="h-44 rounded-3xl bg-stone-200" />
        <div className="h-44 rounded-3xl bg-stone-200" />
      </div>
    </div>
  );
}
