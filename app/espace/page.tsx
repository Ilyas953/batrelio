import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  DocumentIcon,
  InboxIcon,
  LinkIcon,
  MapPinIcon,
  PhoneIcon,
  PhoneMissedIcon,
} from "@/components/landing/icons";
import { getDashboard, type DashboardQuote, type NewRequest } from "@/lib/espace/dashboard";
import { formatCents, formatPhone, formatTimeAgo } from "@/lib/format";
import { RequestLinkPanel } from "./RequestLinkPanel";

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
  const { companyName, missingQuoteDetails, autoReply, newRequests, pendingQuotes, signedQuotes } = await getDashboard();
  const now = new Date();

  return (
    <div className="space-y-8">
      <Welcome
        companyName={companyName}
        today={todayFormatter.format(now)}
        counts={{ toHandle: newRequests.length, pending: pendingQuotes.length, signed: signedQuotes.length }}
      />

      {missingQuoteDetails.length > 0 && <MissingDetailsBanner missing={missingQuoteDetails} />}

      <div className="grid gap-3 sm:grid-cols-2">
        {autoReply && <AutoReplyTile phoneNumber={autoReply.phoneNumber} enabled={autoReply.enabled} />}
        <RequestLinkPanel />
      </div>

      <Section
        id="a-traiter"
        title="À traiter"
        count={newRequests.length}
        highlight
        empty={{
          icon: <InboxIcon className="size-7" />,
          title: "Rien à traiter pour l'instant",
          detail: "Les appels manqués et les demandes envoyées par lien arrivent ici.",
        }}
      >
        {newRequests.map((request) => (
          <RequestCard key={request.id} request={request} now={now} />
        ))}
      </Section>

      <Section
        id="en-attente"
        title="En attente de signature"
        count={pendingQuotes.length}
        empty={{
          icon: <DocumentIcon className="size-7" />,
          title: "Aucun devis en attente",
          detail: "Les devis envoyés à vos clients apparaîtront ici jusqu'à leur signature.",
        }}
      >
        {pendingQuotes.map((quote) => (
          <QuoteRow key={quote.id} quote={quote} detail={`Envoyé ${formatSentAt(quote, now)}`} />
        ))}
      </Section>

      <Section
        id="signes"
        title="Signés"
        count={signedQuotes.length}
        empty={{
          icon: <CheckIcon className="size-7" />,
          title: "Aucun devis signé pour l'instant",
          detail: "Vos devis signés et leurs acomptes s'afficheront ici.",
        }}
      >
        {signedQuotes.map((quote) => (
          <QuoteRow key={quote.id} quote={quote} detail={formatDeposit(quote)} signed />
        ))}
      </Section>
    </div>
  );
}

type Counts = { toHandle: number; pending: number; signed: number };

function summarize(toHandle: number): string {
  if (toHandle === 0) return "Rien à traiter pour l'instant. Bon chantier !";
  return toHandle === 1 ? "1 client attend votre réponse." : `${toHandle} clients attendent votre réponse.`;
}

function Welcome({ companyName, today, counts }: { companyName: string | null; today: string; counts: Counts }) {
  const stats = [
    { href: "#a-traiter", label: "À traiter", value: counts.toHandle, accent: counts.toHandle > 0 },
    { href: "#en-attente", label: "En attente", value: counts.pending, accent: false },
    { href: "#signes", label: "Signés", value: counts.signed, accent: false },
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
            <span className="block text-2xl font-extrabold tabular-nums">{stat.value}</span>
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

function MissingDetailsBanner({ missing }: { missing: string[] }) {
  return (
    <Link
      href="/espace/entreprise"
      className="flex items-center gap-4 rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 transition-colors hover:border-amber-300"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800">
        <DocumentIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold text-amber-950">Complétez votre entreprise</span>
        <span className="block text-base text-amber-900">Pour faire vos devis, il manque {joinWithEt(missing)}.</span>
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
      href="/espace/reponse-automatique"
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

// What happened to a caller who has not described their need yet.
function describeWaitingCall(request: NewRequest): string {
  const latestCall = request.calls.toSorted((a, b) => b.created_at.localeCompare(a.created_at))[0];
  switch (latestCall?.sms_status) {
    case "sent":
    case "delivered":
      return "Il a reçu un SMS pour décrire son besoin.";
    case "failed":
      return "Le SMS n'a pas pu lui être envoyé : rappelez-le.";
    case "skipped_not_mobile":
      return "Appel depuis une ligne fixe : rappelez-le.";
    case "skipped_disabled":
      return "Appel pendant la pause : rappelez-le.";
    default:
      return "Rappelez-le pour connaître son besoin.";
  }
}

function formatSentAt(quote: DashboardQuote, now: Date): string {
  return quote.sent_at ? formatTimeAgo(quote.sent_at, now) : "";
}

function formatDeposit(quote: DashboardQuote): string {
  if (!quote.deposit_cents) return "Sans acompte";
  const deposit = formatCents(quote.deposit_cents);
  return quote.deposit_paid_at ? `Acompte de ${deposit} reçu` : `Acompte de ${deposit} en attente`;
}

type EmptyState = { icon: React.ReactNode; title: string; detail: string };

type SectionProps = {
  id: string;
  title: string;
  count: number;
  empty: EmptyState;
  highlight?: boolean;
  children: React.ReactNode;
};

function Section({ id, title, count, empty, highlight = false, children }: SectionProps) {
  const badgeClasses = highlight && count > 0 ? "bg-orange-600 text-white" : "bg-stone-200 text-stone-700";

  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="mb-3 flex items-center gap-3 text-xl font-bold text-stone-900">
        {title}
        <span className={`grid min-w-8 place-items-center rounded-full px-2.5 py-0.5 text-base ${badgeClasses}`}>
          {count}
        </span>
      </h2>
      {count === 0 ? (
        <div className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-stone-200 p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-stone-100 text-stone-400">
            {empty.icon}
          </span>
          <span>
            <span className="block font-semibold text-stone-700">{empty.title}</span>
            <span className="block text-sm text-stone-500">{empty.detail}</span>
          </span>
        </div>
      ) : (
        <ul className="space-y-3">{children}</ul>
      )}
    </section>
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

function RequestCard({ request, now }: { request: NewRequest; now: Date }) {
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
              <p className="shrink-0 text-sm text-stone-500">{formatTimeAgo(request.created_at, now)}</p>
            </div>
            <div className="mt-1">
              <SourceBadge source={request.source} />
            </div>
          </div>
        </div>

        {request.description ? (
          <p className="mt-3 line-clamp-3 text-base leading-relaxed text-stone-700">{request.description}</p>
        ) : (
          <p className="mt-3 rounded-2xl bg-stone-50 px-4 py-3 text-base text-stone-600">{describeWaitingCall(request)}</p>
        )}

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

      <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-stone-100 p-3">
        <a
          href={`tel:${request.customer_phone}`}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-4 text-base font-semibold text-white hover:bg-orange-700"
        >
          <PhoneIcon className="size-5" />
          Appeler
        </a>
        <Link
          href={`/espace/demandes/${request.id}`}
          className="flex min-h-12 items-center justify-center rounded-2xl px-5 text-base font-semibold text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
        >
          Voir
        </Link>
      </div>
    </li>
  );
}

type QuoteRowProps = { quote: DashboardQuote; detail: string; signed?: boolean };

function QuoteRow({ quote, detail, signed = false }: QuoteRowProps) {
  const depositReceived = signed && quote.deposit_paid_at !== null;

  return (
    <li className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-200 sm:p-5">
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-2xl ${signed ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}`}
      >
        {signed ? <CheckIcon className="size-5" /> : <DocumentIcon className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold text-stone-900">{quote.request.customer_name ?? "Client"}</p>
        <p className={`text-sm ${depositReceived ? "font-semibold text-emerald-700" : "text-stone-500"}`}>{detail}</p>
      </div>
      <p className="shrink-0 text-xl font-extrabold tabular-nums text-stone-900">{formatCents(quote.total_cents)}</p>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement de votre tableau de bord" className="animate-pulse space-y-8">
      <div className="h-52 rounded-3xl bg-stone-200" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-3xl bg-stone-200" />
        <div className="h-28 rounded-3xl bg-stone-200" />
      </div>
      <div className="space-y-3">
        <div className="h-7 w-40 rounded-full bg-stone-200" />
        <div className="h-44 rounded-3xl bg-stone-200" />
        <div className="h-44 rounded-3xl bg-stone-200" />
      </div>
    </div>
  );
}
