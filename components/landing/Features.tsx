import {
  BellIcon,
  CameraIcon,
  DocumentIcon,
  MessageIcon,
  SignatureIcon,
  VoicemailIcon,
} from "./icons";

const FEATURES = [
  {
    icon: VoicemailIcon,
    title: "Un accueil à votre nom",
    detail: "Le client n'entend plus une messagerie anonyme, mais un message de votre entreprise.",
  },
  {
    icon: MessageIcon,
    title: "Un SMS dans la minute",
    detail: "Le client sait que vous avez vu son appel. Il ne va pas chercher ailleurs.",
  },
  {
    icon: CameraIcon,
    title: "Des demandes complètes",
    detail: "Besoin, photos, adresse : vous savez de quoi il s'agit avant même de rappeler.",
  },
  {
    icon: DocumentIcon,
    title: "Le devis déjà pré-rempli",
    detail: "Vous mettez vos prix et vous envoyez. Depuis le téléphone, sans ordinateur.",
  },
  {
    icon: SignatureIcon,
    title: "Signature et acompte en ligne",
    detail: "Le client signe par lien et paie l'acompte par carte ou par virement.",
  },
  {
    icon: BellIcon,
    title: "Des relances automatiques",
    detail: "Les devis non signés sont relancés pour vous. Ça s'arrête dès que le client signe ou répond.",
  },
];

export function Features() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-600">
            Ce que vous obtenez
          </p>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-5xl">
            Tout fonctionne dès le premier jour.
          </h2>
          <p className="mt-5 text-lg text-stone-600">
            Pas de réglages compliqués. Vous pouvez personnaliser plus tard, si vous voulez.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="rounded-3xl border border-stone-200 bg-stone-50 p-7">
              <span className="grid size-12 place-items-center rounded-2xl bg-orange-600 text-white">
                <Icon />
              </span>
              <h3 className="mt-5 text-xl font-bold text-stone-900">{title}</h3>
              <p className="mt-2 text-lg leading-relaxed text-stone-600">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
