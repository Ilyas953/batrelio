import Link from "next/link";
import { CheckIcon, DocumentIcon } from "@/components/landing/icons";
import { formatCents } from "@/lib/format";

// Blocks shared by the tabs of the artisan space.

export type EmptyState = { icon: React.ReactNode; title: string; detail: string };

type SectionProps = {
  id: string;
  title: string;
  count: number;
  empty: EmptyState;
  highlight?: boolean;
  children: React.ReactNode;
};

export function Section({ id, title, count, empty, highlight = false, children }: SectionProps) {
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

export type QuoteSummary = {
  id: string;
  total_cents: number;
  deposit_paid_at: string | null;
  request: { customer_name: string | null };
};

type QuoteRowProps = { quote: QuoteSummary; detail: string; signed?: boolean };

export function QuoteRow({ quote, detail, signed = false }: QuoteRowProps) {
  const depositReceived = signed && quote.deposit_paid_at !== null;

  return (
    <li>
      <Link
        href={`/espace/devis/${quote.id}`}
        className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-200 transition hover:ring-stone-300 sm:p-5"
      >
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
      </Link>
    </li>
  );
}

