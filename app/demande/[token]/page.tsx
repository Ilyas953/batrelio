import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { customerPrivacyNotice } from "@/lib/legal/customer-notice";
import { getCustomerLink } from "@/lib/requests/public-link";
import { RequestForm } from "./RequestForm";

export const metadata: Metadata = {
  title: "Votre demande · Batrelio",
  // Private links: never indexed, never sent as referrer to other sites.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const CLOSED_LINK_MESSAGES = {
  used: {
    title: "Cette demande a déjà été envoyée",
    detail: "L'artisan l'a bien reçue. S'il vous faut ajouter quelque chose, demandez-lui un nouveau lien.",
  },
  expired: {
    title: "Ce lien a expiré",
    detail: "Demandez un nouveau lien à l'artisan pour lui envoyer votre demande.",
  },
  not_found: {
    title: "Ce lien n'existe pas",
    detail: "Vérifiez qu'il a été copié en entier, ou demandez un nouveau lien à l'artisan.",
  },
} as const;

export default function CustomerRequestPage({ params }: PageProps<"/demande/[token]">) {
  return (
    <>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:py-12">
        <Suspense fallback={<p className="text-lg text-stone-500">Chargement…</p>}>
          {params.then(({ token }) => (
            <CustomerRequest token={token} />
          ))}
        </Suspense>
      </main>
      <footer className="mx-auto w-full max-w-xl px-4 pb-8 text-sm text-stone-500">
        Service fourni par Batrelio ·{" "}
        <Link href="/confidentialite" className="underline hover:text-stone-900">
          Confidentialité
        </Link>
      </footer>
    </>
  );
}

async function CustomerRequest({ token }: { token: string }) {
  const link = await getCustomerLink(token);

  if (link.status !== "open") {
    const message = CLOSED_LINK_MESSAGES[link.status];
    return (
      <div className="rounded-3xl bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-extrabold text-stone-900">{message.title}</h1>
        <p className="mt-3 text-lg text-stone-600">{message.detail}</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-base font-semibold text-orange-700">{link.companyName}</p>
      <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight text-stone-900">
        Décrivez votre besoin
      </h1>
      <p className="mb-8 mt-3 text-lg text-stone-600">
        Quelques mots et des photos suffisent : {link.companyName} prépare votre devis et vous recontacte.
      </p>
      <RequestForm
        token={token}
        companyName={link.companyName}
        defaultName={link.customerName ?? ""}
        defaultPhone={link.customerPhone ?? ""}
        privacyNotice={customerPrivacyNotice(link.companyName)}
      />
    </>
  );
}
