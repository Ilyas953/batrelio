import type { Metadata } from "next";
import {
  LegalDocument,
  LegalList,
  LegalSection,
  LegalTable,
} from "@/components/legal/LegalDocument";
import { customerPrivacyNotice } from "@/lib/legal/customer-notice";
import { PUBLISHER } from "@/lib/legal/publisher";
import { SUBPROCESSORS_IN_SERVICE } from "@/lib/legal/subprocessors";

export const metadata: Metadata = {
  title: "Accord de traitement des données · Batrelio",
  description:
    "Les engagements de Batrelio, sous-traitant au sens de l'article 28 du RGPD, pour les données des clients des artisans.",
};

export default function DataProcessingAgreementPage() {
  return (
    <LegalDocument
      title="Accord de traitement des données personnelles"
      intro="Cet accord fait partie des conditions générales de vente. Il fixe, conformément à l'article 28 du RGPD, la façon dont Batrelio traite les données des clients de l'Abonné pour son compte."
    >
      <LegalSection title="1. Rôles">
        <LegalList
          items={[
            "L'Abonné (l'artisan) est responsable du traitement : il décide pourquoi et comment les données de ses clients sont utilisées.",
            `Batrelio (${PUBLISHER.legalName}) est sous-traitant : il traite ces données uniquement pour fournir le service à l'Abonné, sur ses instructions.`,
          ]}
        />
      </LegalSection>

      <LegalSection title="2. Description du traitement">
        <LegalTable
          columns={["Élément", "Détail"]}
          rows={[
            [
              "Finalités",
              "Recevoir les appels manqués, envoyer le SMS de réponse, recueillir la demande du client, préparer, envoyer et faire signer les devis, relancer les devis non signés, suivre le paiement des acomptes.",
            ],
            [
              "Personnes concernées",
              "Les clients et prospects de l'Abonné qui l'appellent ou remplissent son formulaire.",
            ],
            [
              "Données",
              "Numéro de téléphone, nom, adresse du chantier, description du besoin, photos, contenu des devis, preuve de signature (nom, date, adresse IP), état du paiement de l'acompte. Jamais de numéro de carte bancaire, traité par Stripe.",
            ],
            ["Durée", "La durée de l'abonnement, puis au plus 30 jours (article 9 ci-dessous)."],
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Engagements de Batrelio">
        <LegalList
          items={[
            "Traiter les données uniquement sur instruction documentée de l'Abonné : ces CGV, cet accord et les réglages qu'il choisit dans le service. Batrelio n'utilise jamais ces données pour son propre compte.",
            "Informer immédiatement l'Abonné si une instruction lui paraît contraire au RGPD.",
            "Garantir la confidentialité : seules les personnes qui en ont besoin y accèdent, et elles sont tenues au secret.",
            "Assurer la sécurité des données (article 32 du RGPD) : chiffrement des échanges, isolement des données de chaque Abonné imposé par la base de données, mots de passe chiffrés de façon irréversible, clés sensibles conservées uniquement sur nos serveurs, accès réservés aux personnes qui en ont besoin.",
            "Aider l'Abonné à répondre aux demandes de ses clients qui exercent leurs droits (accès, rectification, effacement, opposition…) et lui transmettre sans délai toute demande reçue directement.",
            "Aider l'Abonné à respecter ses obligations de sécurité, de notification des violations et, le cas échéant, d'analyse d'impact (articles 32 à 36 du RGPD).",
            "Mettre à la disposition de l'Abonné les informations nécessaires pour démontrer le respect de ces obligations, et permettre un audit une fois par an, sur demande écrite avec un préavis de 30 jours, à la charge de l'Abonné.",
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Violation de données">
        <p>
          En cas de violation de données personnelles (perte, accès non autorisé, fuite…), Batrelio prévient
          l&apos;Abonné dans les 48 heures après en avoir pris connaissance, avec les informations utiles pour que
          celui-ci puisse, si nécessaire, la notifier à la CNIL dans les 72 heures et informer les personnes
          concernées (articles 33 et 34 du RGPD).
        </p>
      </LegalSection>

      <LegalSection title="5. Sous-traitants ultérieurs">
        <p>
          L&apos;Abonné autorise Batrelio à faire appel aux prestataires ci-dessous. Batrelio leur impose par contrat
          des obligations de protection des données équivalentes et reste responsable de leurs manquements.
        </p>
        <LegalTable
          columns={["Prestataire", "Rôle", "Où sont les données", "Garantie de transfert"]}
          rows={SUBPROCESSORS_IN_SERVICE.map((subprocessor) => [
            subprocessor.name,
            subprocessor.purpose,
            subprocessor.dataLocation,
            subprocessor.transferSafeguard ?? "Aucun transfert hors UE",
          ])}
        />
        <p>
          Batrelio prévient l&apos;Abonné par e-mail au moins 30 jours avant d&apos;ajouter ou de remplacer un
          prestataire. L&apos;Abonné peut s&apos;y opposer pour un motif légitime lié à la protection des données ;
          s&apos;il n&apos;est pas possible d&apos;y donner suite, il peut résilier sans frais.
        </p>
      </LegalSection>

      <LegalSection title="6. Engagements de l'Abonné">
        <LegalList
          items={[
            "Traiter les données de ses clients de façon licite, pour répondre à leur demande et établir leurs devis.",
            "Informer ses clients de l'utilisation de leurs données. Batrelio affiche pour lui, sur le formulaire de demande, le texte proposé à l'article 8.",
            "Ne pas demander, dans les champs libres, de données sensibles (santé, opinions, etc.) inutiles à un devis.",
            "Décider de la durée de conservation des données de ses clients et supprimer celles qui ne sont plus utiles.",
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Durées de conservation recommandées">
        <LegalList
          items={[
            "Demande restée sans suite : 3 ans après le dernier contact avec le client, comme le recommande la CNIL pour les prospects.",
            "Devis signé et documents liés : selon les obligations de l'Abonné (en particulier 10 ans pour les pièces comptables, article L. 123-22 du Code de commerce).",
          ]}
        />
      </LegalSection>

      <LegalSection title="8. Texte d'information des clients">
        <p>Texte affiché aux clients de l&apos;Abonné sur le formulaire de demande, avec un lien vers la politique de confidentialité :</p>
        <blockquote className="rounded-2xl border-l-4 border-orange-500 bg-white p-4 italic text-stone-700">
          {customerPrivacyNotice("[Nom de l'entreprise]")}
        </blockquote>
      </LegalSection>

      <LegalSection title="9. Fin du contrat">
        <p>
          À la fin de l&apos;abonnement, Batrelio remet à l&apos;Abonné qui le demande une copie des données de ses
          clients dans un format courant, puis les supprime au plus tard 30 jours après la fin du contrat, sauf
          obligation légale de conservation.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
