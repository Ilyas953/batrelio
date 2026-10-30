import { PRODUCTION_DOMAIN } from "@/lib/site";
import { BellIcon, CheckIcon, PhoneMissedIcon } from "./icons";

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-orange-200 via-amber-100 to-transparent blur-2xl" />
      <div className="rounded-[2.75rem] border-[10px] border-stone-900 bg-stone-900 shadow-2xl">
        <div className="overflow-hidden rounded-[2rem] bg-stone-100">
          <div className="flex items-center justify-between px-6 pt-3 text-xs font-semibold text-stone-900">
            <span>10:42</span>
            <span className="h-5 w-20 rounded-full bg-stone-900" />
            <span>5G</span>
          </div>

          <div className="space-y-3 px-3 pb-6 pt-5">
            <MissedCallCard />
            <SmsBubble />
            <NewRequestCard />
            <SignedQuoteCard />
          </div>
        </div>
      </div>
    </div>
  );
}

function MissedCallCard() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
        <PhoneMissedIcon className="size-4" />
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-semibold text-stone-900">Appel manqué</p>
        <p className="text-stone-500">06 12 •• •• 78 · vous étiez sur le toit</p>
      </div>
    </div>
  );
}

function SmsBubble() {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-stone-400">
        SMS envoyé par DUPONTTOIT
      </p>
      <p className="rounded-2xl rounded-tl-sm bg-stone-100 p-3 text-[13px] leading-snug text-stone-800">
        Bonjour, ici Dupont Toiture. Nous n&apos;avons pas pu décrocher. Décrivez votre besoin (photos
        possibles) ici, nous vous recontactons vite&nbsp;:{" "}
        <span className="font-medium text-orange-700 underline">{PRODUCTION_DOMAIN}/demande/7f3a…</span>
      </p>
    </div>
  );
}

function NewRequestCard() {
  return (
    <div className="rounded-2xl border-2 border-orange-500 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-700">
        <BellIcon className="size-4" />
        Nouvelle demande · 10:51
      </div>
      <p className="text-sm font-semibold text-stone-900">Fuite sous les tuiles, chambre du haut</p>
      <p className="mb-3 text-xs text-stone-500">12 rue des Lilas · 3 photos</p>
      <div className="grid grid-cols-2 gap-2">
        <span className="rounded-xl bg-orange-600 py-2 text-center text-xs font-semibold text-white">
          Faire le devis
        </span>
        <span className="rounded-xl bg-stone-100 py-2 text-center text-xs font-semibold text-stone-800">
          Proposer une visite
        </span>
      </div>
    </div>
  );
}

function SignedQuoteCard() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-emerald-600 p-3 text-white shadow-sm">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20">
        <CheckIcon className="size-4" />
      </span>
      <div className="text-sm">
        <p className="font-semibold">Devis signé · 2&nbsp;340&nbsp;€</p>
        <p className="text-emerald-50">Acompte de 700&nbsp;€ reçu</p>
      </div>
    </div>
  );
}
