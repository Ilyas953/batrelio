const STEPS = [
  {
    time: "10:42",
    title: "Un client appelle, vous ne pouvez pas répondre",
    detail: "L'appel est renvoyé vers votre numéro Batrelio. Le client entend un message d'accueil à votre nom.",
  },
  {
    time: "10:42",
    title: "Il reçoit un SMS de votre entreprise",
    detail: "Envoyé automatiquement, avec le nom de votre entreprise comme expéditeur et un lien vers un formulaire simple.",
  },
  {
    time: "10:51",
    title: "Il décrit son besoin, avec photos et adresse",
    detail: "La demande arrive dans votre espace, complète. Plus besoin de rappeler pour poser les questions de base.",
  },
  {
    time: "12:15",
    title: "Pendant la pause, vous envoyez le devis",
    detail: "Le devis est déjà pré-rempli, vous mettez vos prix. Ou vous proposez une visite en un clic.",
  },
  {
    time: "18:30",
    title: "Il signe en ligne et paie l'acompte",
    detail: "Par carte ou par virement. S'il ne signe pas, Batrelio le relance pour vous, et s'arrête dès qu'il répond.",
  },
];

export function HowItWorks() {
  return (
    <section id="fonctionnement" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="max-w-2xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-600">
            Comment ça marche
          </p>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-5xl">
            De l&apos;appel manqué au devis signé, sans lâcher vos outils.
          </h2>
        </div>

        <ol className="mt-14 space-y-0">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative grid grid-cols-[4.5rem_1fr] gap-4 pb-10 last:pb-0 sm:grid-cols-[6rem_1fr] sm:gap-8">
              {index < STEPS.length - 1 && (
                <span className="absolute bottom-0 left-[2.25rem] top-12 w-0.5 bg-stone-200 sm:left-[3rem]" />
              )}
              <span className="relative z-10 grid h-12 place-items-center rounded-full bg-stone-900 font-mono text-sm font-bold text-white">
                {step.time}
              </span>
              <div className="pt-2.5">
                <h3 className="text-xl font-bold text-stone-900 sm:text-2xl">{step.title}</h3>
                <p className="mt-2 max-w-2xl text-lg leading-relaxed text-stone-600">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
