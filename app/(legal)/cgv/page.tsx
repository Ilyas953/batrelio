import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalList, LegalSection } from "@/components/legal/LegalDocument";
import { PUBLISHER } from "@/lib/legal/publisher";
import { OFFER } from "@/lib/offer";

export const metadata: Metadata = {
  title: "Conditions générales de vente et d'utilisation · Batrelio",
  description: "Les règles de l'abonnement Batrelio : service, prix, essai gratuit, résiliation, responsabilités.",
};

const PRIVACY_LINK = (
  <Link href="/confidentialite" className="font-medium text-orange-700 underline">
    politique de confidentialité
  </Link>
);

const DPA_LINK = (
  <Link href="/sous-traitance" className="font-medium text-orange-700 underline">
    accord de traitement des données
  </Link>
);

export default function TermsPage() {
  return (
    <LegalDocument
      title="Conditions générales de vente et d'utilisation"
      intro={`Ces conditions générales (les « CGV ») encadrent l'abonnement au service Batrelio, proposé par ${PUBLISHER.legalName} (« Batrelio », « nous ») aux professionnels qui s'y inscrivent (l'« Abonné », « vous »).`}
    >
      <LegalSection title="1. Un service réservé aux professionnels">
        <p>
          Batrelio s&apos;adresse aux artisans et entreprises qui l&apos;utilisent pour leur activité professionnelle.
          En vous inscrivant, vous déclarez agir à ce titre, avec un numéro SIRET en cours de validité. Le service
          n&apos;est pas destiné aux consommateurs.
        </p>
      </LegalSection>

      <LegalSection title="2. Documents contractuels et acceptation">
        <p>Le contrat entre vous et Batrelio est formé par, dans cet ordre de priorité :</p>
        <LegalList
          items={[
            "les présentes CGV ;",
            <>l&apos;{DPA_LINK}, qui en fait partie intégrante ;</>,
            "l'offre affichée au moment de votre inscription (prix et durée de l'essai).",
          ]}
        />
        <p>
          Vous acceptez les CGV en cochant la case prévue lors de l&apos;inscription. Avant de valider, vous pouvez
          vérifier et corriger les informations saisies. La version acceptée et sa date sont enregistrées avec votre
          compte, et les CGV restent consultables à tout moment sur cette page.
        </p>
      </LegalSection>

      <LegalSection title="3. Le service">
        <p>Batrelio aide l&apos;Abonné à ne pas perdre les clients qu&apos;il ne peut pas prendre au téléphone :</p>
        <LegalList
          items={[
            "un numéro virtuel vers lequel l'Abonné renvoie ses appels manqués, avec un message d'accueil à son nom ;",
            "l'envoi automatique d'un SMS au client, avec un lien vers un formulaire où il décrit son besoin (texte, photos, adresse) ;",
            "un espace où l'Abonné retrouve ses demandes et prépare ses devis (devis pré-rempli, ou proposition de visite) ;",
            "l'envoi du devis par lien, sa signature en ligne et le paiement d'un acompte (par carte si l'Abonné a activé le paiement en ligne, sinon par virement) ;",
            "des relances automatiques des devis non signés, qui s'arrêtent dès que le client signe ou répond.",
          ]}
        />
        <p>
          Les fonctionnalités évoluent : celles qui sont disponibles sont celles présentes dans l&apos;espace de
          l&apos;Abonné. Batrelio fournit un outil : l&apos;Abonné reste seul responsable de ses prix, de ses devis,
          de leurs mentions obligatoires et des travaux qu&apos;il réalise.
        </p>
      </LegalSection>

      <LegalSection title="4. Votre compte">
        <LegalList
          items={[
            "Les informations que vous fournissez (identité de l'entreprise, SIRET, assurance, coordonnées) doivent être exactes et tenues à jour : elles figurent sur vos devis.",
            "Vos identifiants sont personnels et confidentiels. Toute action faite depuis votre compte est réputée faite par vous. Prévenez-nous sans délai en cas d'utilisation non autorisée.",
            "Un compte correspond à une entreprise.",
          ]}
        />
      </LegalSection>

      <LegalSection title={`5. Essai gratuit de ${OFFER.trialDays} jours`}>
        <p>
          Toute nouvelle inscription bénéficie d&apos;un essai gratuit de {OFFER.trialDays} jours, sans engagement.
          Aucun paiement n&apos;est prélevé pendant l&apos;essai, et l&apos;essai ne se transforme pas en abonnement
          payant sans votre action. À son terme, le service continue seulement si vous souscrivez l&apos;abonnement ;
          sinon, l&apos;accès aux fonctionnalités est suspendu et vos données sont traitées comme prévu à
          l&apos;article 14.
        </p>
      </LegalSection>

      <LegalSection title="6. Prix et paiement">
        <LegalList
          items={[
            `L'abonnement coûte ${OFFER.pricePerMonth} € hors taxes par mois. La TVA est ajoutée au taux en vigueur.`,
            "Il est payable mensuellement et d'avance, par carte bancaire, via notre prestataire de paiement Stripe. Une facture est émise pour chaque paiement.",
            "Si des frais liés à l'usage (par exemple un volume de SMS) devaient s'ajouter, ils seraient indiqués clairement avant toute souscription.",
            "Les frais éventuellement facturés par votre propre opérateur téléphonique pour le renvoi d'appel restent à votre charge : renseignez-vous auprès de lui.",
          ]}
        />
        <p>
          En cas de retard de paiement, et conformément aux articles L. 441-10 et D. 441-5 du Code de commerce, des
          pénalités de retard sont dues de plein droit, au taux de la dernière opération de refinancement de la
          Banque centrale européenne majoré de 10 points, ainsi qu&apos;une indemnité forfaitaire de 40 € pour frais
          de recouvrement. Après une mise en demeure restée sans effet pendant 8 jours, Batrelio peut suspendre
          l&apos;accès au service.
        </p>
        <p>
          Toute évolution du prix vous est annoncée par e-mail au moins 30 jours à l&apos;avance. Si vous ne
          l&apos;acceptez pas, vous pouvez résilier avant son entrée en vigueur.
        </p>
      </LegalSection>

      <LegalSection title="7. Durée et résiliation">
        <LegalList
          items={[
            "L'abonnement est conclu pour un mois, renouvelé automatiquement chaque mois.",
            `Il est sans engagement : vous pouvez le résilier à tout moment en écrivant à ${PUBLISHER.email}. La résiliation prend effet à la fin du mois en cours, déjà payé ; il n'y a pas de remboursement au prorata.`,
            "Batrelio peut résilier l'abonnement en cas de manquement grave de l'Abonné (impayé, usage illicite, atteinte à la sécurité du service), après une mise en demeure restée sans effet pendant 15 jours, ou immédiatement en cas de fraude.",
            "Batrelio peut cesser de fournir le service en prévenant l'Abonné au moins 3 mois à l'avance.",
          ]}
        />
      </LegalSection>

      <LegalSection title="8. Vos engagements">
        <LegalList
          items={[
            "Utiliser Batrelio conformément à la loi et pour votre seule activité professionnelle.",
            "Respecter vos propres obligations envers vos clients : information sur leurs données personnelles, mentions obligatoires des devis, droit de rétractation lorsqu'il s'applique, assurance professionnelle.",
            "Ne pas utiliser le service pour de la prospection commerciale : les SMS envoyés répondent à un appel du client et ne doivent contenir aucune publicité.",
            "Choisir un nom d'expéditeur SMS qui correspond réellement à votre entreprise et ne trompe pas le destinataire.",
            "Ne pas tenter d'accéder aux données d'autres Abonnés ni de perturber le fonctionnement du service.",
          ]}
        />
      </LegalSection>

      <LegalSection title="9. Nos engagements">
        <LegalList
          items={[
            "Fournir le service avec soin et le maintenir disponible au mieux, sous une obligation de moyens. Des interruptions peuvent avoir lieu pour maintenance ; nous les limitons et prévenons quand c'est possible.",
            "Protéger les données hébergées selon les mesures décrites dans la politique de confidentialité.",
            `Répondre à vos questions par e-mail à ${PUBLISHER.email}.`,
          ]}
        />
      </LegalSection>

      <LegalSection title="10. Numéros, appels et SMS">
        <p>
          Le numéro virtuel est mis à disposition de l&apos;Abonné pendant la durée de l&apos;abonnement. Vous gardez
          votre propre numéro : c&apos;est vous qui activez, auprès de votre opérateur, le renvoi des appels non
          décrochés vers le numéro Batrelio, et vous pouvez le désactiver à tout moment.
        </p>
        <p>
          L&apos;acheminement des appels et des SMS dépend des opérateurs téléphoniques. Batrelio ne peut pas garantir
          qu&apos;un SMS soit reçu par son destinataire, ni être tenu responsable d&apos;une panne d&apos;opérateur.
        </p>
      </LegalSection>

      <LegalSection title="11. Acomptes payés par vos clients">
        <p>
          Lorsque vous activez le paiement en ligne, vous ouvrez un compte auprès de Stripe et acceptez ses propres
          conditions. Les acomptes sont versés directement sur votre compte Stripe : Batrelio n&apos;encaisse pas ces
          sommes et n&apos;est pas partie à la vente entre vous et votre client. Sans paiement en ligne, le devis
          indique vos coordonnées de virement.
        </p>
      </LegalSection>

      <LegalSection title="12. Responsabilité">
        <LegalList
          items={[
            "Batrelio n'est responsable que des dommages directs et prévisibles causés par un manquement à ses obligations.",
            "Batrelio ne répond pas des dommages indirects, tels qu'une perte de chiffre d'affaires, de clientèle ou d'opportunité, ni du contenu des devis, des prix et des travaux de l'Abonné.",
            "La responsabilité totale de Batrelio est limitée au montant payé par l'Abonné au cours des 12 mois précédant le fait générateur.",
            "Ces limites ne s'appliquent pas en cas de faute lourde ou dolosive, ni lorsque la loi les interdit.",
          ]}
        />
      </LegalSection>

      <LegalSection title="13. Données personnelles">
        <p>
          Pour les données de votre compte, Batrelio est responsable du traitement : voir la {PRIVACY_LINK}. Pour les
          données de vos clients (appels, SMS, demandes, devis), vous êtes responsable du traitement et Batrelio agit
          comme votre sous-traitant, dans les conditions de l&apos;{DPA_LINK}, conformément à l&apos;article 28 du
          RGPD.
        </p>
      </LegalSection>

      <LegalSection title="14. Fin du contrat et récupération des données">
        <p>
          Avant la fin de votre abonnement, vous pouvez nous demander une copie de vos données (demandes, devis,
          informations de l&apos;entreprise) dans un format courant. Elles sont supprimées au plus tard 30 jours après
          la fin du contrat, sauf celles que la loi nous oblige à conserver (par exemple les factures).
        </p>
      </LegalSection>

      <LegalSection title="15. Propriété intellectuelle">
        <p>
          Batrelio reste propriétaire du logiciel, de son interface et de ses contenus. L&apos;abonnement vous donne un
          droit d&apos;utilisation personnel et non transférable pendant sa durée. Vous restez propriétaire de vos
          données et de vos contenus (textes, photos, devis).
        </p>
      </LegalSection>

      <LegalSection title="16. Force majeure">
        <p>
          Aucune des parties n&apos;est responsable d&apos;un manquement causé par un cas de force majeure au sens de
          l&apos;article 1218 du Code civil.
        </p>
      </LegalSection>

      <LegalSection title="17. Modification des CGV">
        <p>
          Nous pouvons faire évoluer ces CGV. Toute modification vous est annoncée par e-mail au moins 30 jours avant
          son entrée en vigueur. Si vous la refusez, vous pouvez résilier avant cette date ; sinon, elle
          s&apos;applique à la date annoncée.
        </p>
      </LegalSection>

      <LegalSection title="18. Droit applicable et litiges">
        <p>
          Les CGV sont soumises au droit français. En cas de désaccord, écrivez-nous d&apos;abord à {PUBLISHER.email} :
          nous chercherons une solution amiable. À défaut, le litige sera porté devant les tribunaux compétents du
          ressort du siège social de Batrelio, sous réserve des règles de compétence impératives.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
