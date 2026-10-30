// Providers that process personal data for Batrelio (art. 28 RGPD).
// Set `inService` to true when a provider starts receiving data: the privacy policy
// and the data processing agreement only list providers actually in use.

export type Subprocessor = {
  name: string;
  purpose: string;
  dataLocation: string;
  // Legal ground for transfers outside the European Union (art. 44 to 49 RGPD), if any.
  transferSafeguard: string | null;
  inService: boolean;
};

const DPF_OR_SCC =
  "Data Privacy Framework UE–États-Unis (décision d'adéquation du 10 juillet 2023) ou clauses contractuelles types de la Commission européenne";

export const SUBPROCESSORS: Subprocessor[] = [
  {
    name: "Supabase Inc.",
    purpose: "Base de données, comptes et connexion",
    dataLocation: "Union européenne (Irlande)",
    transferSafeguard: "Clauses contractuelles types de la Commission européenne, pour les accès techniques depuis l'extérieur de l'UE",
    inService: true,
  },
  {
    name: "Vercel Inc.",
    purpose: "Hébergement du site et de l'application",
    dataLocation: "États-Unis et Union européenne",
    transferSafeguard: DPF_OR_SCC,
    inService: true,
  },
  {
    name: "Twilio Inc.",
    purpose: "Numéros virtuels, renvoi d'appel et envoi des SMS",
    dataLocation: "États-Unis",
    transferSafeguard: DPF_OR_SCC,
    inService: true,
  },
  {
    name: "Stripe Payments Europe Ltd",
    purpose: "Paiement de l'abonnement et des acomptes",
    dataLocation: "Union européenne et États-Unis",
    transferSafeguard: DPF_OR_SCC,
    inService: false,
  },
  {
    name: "Sendinblue SAS (Brevo)",
    purpose: "Envoi des e-mails",
    dataLocation: "Union européenne (France)",
    transferSafeguard: null,
    inService: false,
  },
];

export const SUBPROCESSORS_IN_SERVICE = SUBPROCESSORS.filter((subprocessor) => subprocessor.inService);
