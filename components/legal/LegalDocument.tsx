import { LEGAL_LAST_UPDATED } from "@/lib/legal/publisher";

// Building blocks for the legal pages: plain, readable, mobile first.

export function LegalDocument({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <article className="space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-stone-500">Dernière mise à jour : {LEGAL_LAST_UPDATED}</p>
        {intro && <p className="mt-6 text-lg leading-relaxed text-stone-700">{intro}</p>}
      </header>
      {children}
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold text-stone-900 sm:text-2xl">{title}</h2>
      <div className="space-y-4 text-base leading-relaxed text-stone-700">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

// Key/value lines, e.g. the publisher's identity.
export function LegalFacts({ facts }: { facts: [label: string, value: React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
      {facts.map(([label, value]) => (
        <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[14rem_1fr] sm:gap-4">
          <dt className="font-semibold text-stone-900">{label}</dt>
          <dd className="break-words text-stone-700">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// Wide tables stack into cards on small screens.
export function LegalTable({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="space-y-3">
      {rows.map((row, rowIndex) => (
        <dl key={rowIndex} className="rounded-2xl border border-stone-200 bg-white p-4">
          {row.map((cell, cellIndex) => (
            <div key={columns[cellIndex]} className="grid gap-1 py-1.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
              <dt className="text-sm font-semibold text-stone-500">{columns[cellIndex]}</dt>
              <dd className={cellIndex === 0 ? "font-semibold text-stone-900" : "text-stone-700"}>{cell}</dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  );
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-orange-700 underline">
      {children}
    </a>
  );
}
