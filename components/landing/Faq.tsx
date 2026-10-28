const QUESTIONS = [
  {
    question: "Est-ce que je garde mon numéro ?",
    answer:
      "Oui. Vos clients continuent d'appeler votre numéro habituel. Quand vous ne décrochez pas, l'appel est renvoyé vers votre numéro Batrelio.",
  },
  {
    question: "Faut-il installer une application ?",
    answer:
      "Non. Tout se passe dans le navigateur de votre téléphone. Vous ouvrez le lien, et c'est prêt.",
  },
  {
    question: "C'est compliqué à mettre en place ?",
    answer:
      "Non. Vous indiquez le nom de votre entreprise et vous activez le renvoi d'appel. Le message d'accueil, le SMS et le formulaire sont prêts par défaut. Vous pourrez les modifier plus tard si vous le souhaitez.",
  },
  {
    question: "Le SMS, qui l'envoie ?",
    answer:
      "Votre client voit le nom de votre entreprise comme expéditeur, pas un numéro inconnu. Il sait tout de suite que c'est vous.",
  },
  {
    question: "Comment je reçois l'acompte ?",
    answer:
      "Par carte bancaire si vous activez le paiement en ligne, sinon par virement. Les coordonnées bancaires ne sont jamais stockées chez Batrelio : tout passe par Stripe, un service de paiement sécurisé.",
  },
  {
    question: "Et si le client ne signe pas le devis ?",
    answer:
      "Batrelio le relance automatiquement. Les relances s'arrêtent dès qu'il signe ou qu'il vous répond.",
  },
  {
    question: "Je peux arrêter quand je veux ?",
    answer: "Oui, c'est sans engagement. Vous arrêtez en un clic, sans frais.",
  },
];

export function Faq() {
  return (
    <section id="questions" className="scroll-mt-20 bg-stone-50">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-5xl">
          Vos questions
        </h2>
        <div className="mt-10 divide-y divide-stone-200 rounded-3xl border border-stone-200 bg-white">
          {QUESTIONS.map(({ question, answer }) => (
            <details key={question} className="group px-6 sm:px-8">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-semibold text-stone-900 [&::-webkit-details-marker]:hidden">
                {question}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-stone-100 text-xl leading-none text-stone-600 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-6 text-lg leading-relaxed text-stone-600">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
