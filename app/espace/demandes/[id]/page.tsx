import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getRequestDetail } from "@/lib/espace/request-detail";
import { formatPhone, formatTimeAgo } from "@/lib/format";

export default function RequestDetailPage({ params }: PageProps<"/espace/demandes/[id]">) {
  return (
    <>
      <Link href="/espace" className="text-base font-semibold text-stone-500 hover:text-stone-900">
        ← Retour
      </Link>
      <Suspense fallback={<p className="mt-8 text-lg text-stone-500">Chargement…</p>}>
        {params.then(({ id }) => (
          <RequestDetail requestId={id} />
        ))}
      </Suspense>
    </>
  );
}

function toMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

async function RequestDetail({ requestId }: { requestId: string }) {
  const request = await getRequestDetail(requestId);
  if (!request) notFound();

  return (
    <article className="mt-4 space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">{request.customer_name ?? "Client"}</h1>
        <p className="mt-1 text-base text-stone-500">
          {request.source === "link" ? "Demande envoyée par lien" : "Après un appel manqué"} ·{" "}
          {formatTimeAgo(request.created_at, new Date())}
        </p>
      </header>

      <a
        href={`tel:${request.customer_phone}`}
        className="flex min-h-14 items-center justify-center rounded-2xl bg-orange-600 px-5 text-lg font-semibold text-white hover:bg-orange-700"
      >
        Appeler le {formatPhone(request.customer_phone)}
      </a>

      {request.description && (
        <section className="rounded-3xl bg-white p-5 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Son besoin</h2>
          <p className="mt-2 whitespace-pre-line text-lg leading-relaxed text-stone-900">{request.description}</p>
        </section>
      )}

      {request.address && (
        <section className="rounded-3xl bg-white p-5 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Adresse du chantier</h2>
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">
            Photos ({request.photoUrls.length})
          </h2>
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
