import Link from "next/link";
import { Suspense } from "react";
import { returnLink, type ReturnLink } from "@/lib/espace/return-to";

// Always in the same place, at the top left: the artisan always knows how to go back.
export function BackLink({ href, label }: ReturnLink) {
  return (
    <Link
      href={href}
      className="-ml-2 inline-flex min-h-11 items-center rounded-xl px-2 text-base font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900"
    >
      ← {label}
    </Link>
  );
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function BackLinkFromParams({ searchParams, fallback }: { searchParams: SearchParams; fallback: string }) {
  const { retour } = await searchParams;
  return <BackLink {...returnLink(retour, fallback)} />;
}

// Back to the page the artisan came from (?retour=…), or to the fallback page.
export function ReturnBackLink({ searchParams, fallback }: { searchParams: SearchParams; fallback: string }) {
  return (
    <Suspense fallback={<BackLink {...returnLink(null, fallback)} />}>
      <BackLinkFromParams searchParams={searchParams} fallback={fallback} />
    </Suspense>
  );
}
