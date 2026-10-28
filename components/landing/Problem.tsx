const SITUATIONS = [
  { moment: "Sur le toit", detail: "Le téléphone vibre dans la poche. Impossible de répondre." },
  { moment: "Au volant", detail: "Entre deux chantiers, vous verrez ça plus tard." },
  { moment: "Le soir", detail: "Six numéros à rappeler. La moitié ont déjà trouvé quelqu'un." },
];

export function Problem() {
  return (
    <section className="bg-stone-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-orange-400">
            Le vrai problème
          </p>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Un appel manqué, c&apos;est souvent un chantier perdu.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-stone-300 sm:text-xl">
            Quand un client tombe sur votre messagerie, il ne laisse pas toujours de message. Il
            appelle l&apos;artisan suivant. Et c&apos;est souvent le premier qui répond qui décroche
            le chantier.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {SITUATIONS.map((situation) => (
            <div key={situation.moment} className="rounded-2xl border border-stone-700 bg-stone-800/60 p-6">
              <p className="text-xl font-bold text-white">{situation.moment}</p>
              <p className="mt-2 text-stone-300">{situation.detail}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-2xl font-bold leading-snug sm:text-3xl">
          5 appels manqués par semaine, c&apos;est{" "}
          <span className="text-orange-400">260 clients potentiels par an</span> qui repartent sans
          réponse.
        </p>
      </div>
    </section>
  );
}
