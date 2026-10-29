import type { Metadata } from "next";
import { Suspense } from "react";
import { signOut } from "@/lib/auth/actions";
import { getDashboard, type DashboardQuote, type NewRequest } from "@/lib/espace/dashboard";
import { formatCents, formatPhone, formatTimeAgo } from "@/lib/format";

export const metadata: Metadata = {
  title: "Mon espace · Batrelio",
  robots: { index: false },
};

export default function ArtisanSpacePage() {
  return (
    <>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4 sm:px-6">
          <span className="text-lg font-bold text-stone-900">Batrelio</span>
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 rounded-xl px-3 text-[15px] font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-8 sm:px-6">
        <Suspense fallback={<p className="text-lg text-stone-500">Chargement…</p>}>
          <Dashboard />
        </Suspense>
      </main>
    </>
  );
}

async function Dashboard() {
  const { companyName, newRequests, pendingQuotes, signedQuotes } = await getDashboard();
  const now = new Date();

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
        Bonjour{companyName ? `, ${companyName}` : ""}
      </h1>

      <Section
        title="À traiter"
        count={newRequests.length}
        highlight
        emptyMessage="Aucune nouvelle demande. Quand vous manquez un appel, la demande du client arrive ici."
      >
        {newRequests.map((request) => (
          <RequestCard key={request.id} request={request} now={now} />
        ))}
      </Section>

      <Section
        title="En attente de signature"
        count={pendingQuotes.length}
        emptyMessage="Aucun devis en attente."
      >
        {pendingQuotes.map((quote) => (
          <QuoteRow key={quote.id} quote={quote} detail={`Envoyé ${formatSentAt(quote, now)}`} />
        ))}
      </Section>

      <Section title="Signés" count={signedQuotes.length} emptyMessage="Aucun devis signé pour l'instant.">
        {signedQuotes.map((quote) => (
          <QuoteRow key={quote.id} quote={quote} detail={formatDeposit(quote)} signed />
        ))}
      </Section>
    </div>
  );
}

function formatSentAt(quote: DashboardQuote, now: Date): string {
  return quote.sent_at ? formatTimeAgo(quote.sent_at, now) : "";
}

function formatDeposit(quote: DashboardQuote): string {
  if (!quote.deposit_cents) return "Sans acompte";
  const deposit = formatCents(quote.deposit_cents);
  return quote.deposit_paid_at ? `Acompte de ${deposit} reçu` : `Acompte de ${deposit} en attente`;
}

type SectionProps = {
  title: string;
  count: number;
  emptyMessage: string;
  highlight?: boolean;
  children: React.ReactNode;
};

function Section({ title, count, emptyMessage, highlight = false, children }: SectionProps) {
  const badgeClasses = highlight && count > 0 ? "bg-orange-600 text-white" : "bg-stone-200 text-stone-700";

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-stone-900">
        {title}
        <span className={`grid min-w-8 place-items-center rounded-full px-2.5 py-0.5 text-base ${badgeClasses}`}>
          {count}
        </span>
      </h2>
      {count === 0 ? (
        <p className="rounded-3xl border-2 border-dashed border-stone-200 p-6 text-base text-stone-500">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-3">{children}</ul>
      )}
    </section>
  );
}

function RequestCard({ request, now }: { request: NewRequest; now: Date }) {
  return (
    <li className="rounded-3xl border-2 border-orange-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-lg font-bold text-stone-900">{request.customer_name ?? "Client"}</p>
        <p className="shrink-0 text-sm text-stone-500">{formatTimeAgo(request.created_at, now)}</p>
      </div>
      {request.description && (
        <p className="mt-2 line-clamp-3 text-base leading-relaxed text-stone-700">{request.description}</p>
      )}
      {request.address && <p className="mt-2 text-sm text-stone-500">{request.address}</p>}
      <a
        href={`tel:${request.customer_phone}`}
        className="mt-4 flex min-h-14 items-center justify-center rounded-2xl bg-orange-600 px-5 text-lg font-semibold text-white hover:bg-orange-700"
      >
        Appeler le {formatPhone(request.customer_phone)}
      </a>
    </li>
  );
}

type QuoteRowProps = { quote: DashboardQuote; detail: string; signed?: boolean };

function QuoteRow({ quote, detail, signed = false }: QuoteRowProps) {
  const depositReceived = signed && quote.deposit_paid_at !== null;

  return (
    <li className="flex items-center justify-between gap-4 rounded-3xl bg-white p-5">
      <div className="min-w-0">
        <p className="truncate text-lg font-bold text-stone-900">{quote.request.customer_name ?? "Client"}</p>
        <p className={`text-sm ${depositReceived ? "font-semibold text-emerald-700" : "text-stone-500"}`}>
          {detail}
        </p>
      </div>
      <p className="shrink-0 text-xl font-extrabold tabular-nums text-stone-900">
        {formatCents(quote.total_cents)}
      </p>
    </li>
  );
}
