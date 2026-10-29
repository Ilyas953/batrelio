import type { Metadata } from "next";
import Link from "next/link";
import {
  ExternalLink,
  LegalDocument,
  LegalFacts,
  LegalList,
  LegalSection,
  LegalTable,
} from "@/components/legal/LegalDocument";
import { CNIL, PUBLISHER } from "@/lib/legal/publisher";
import { SUBPROCESSORS_IN_SERVICE } from "@/lib/legal/subprocessors";

export const metadata: Metadata = {
  title: "Politique de confidentialité · Batrelio",
  description: "Quelles données Batrelio traite, pourquoi, combien de temps, et comment exercer vos droits.",
};

const PROCESSING_COLUMNS = ["Pourquoi", "Quelles données", "Base légale (art. 6 RGPD)", "Combien de temps"];

// Purposes for which Batrelio decides on its own (controller, art. 4.7 RGPD).
const PROCESSING_ROWS = [
  [
    "Créer et gérer votre compte, fournir le service",
    "E-mail, mot de passe (stocké chiffré, jamais lisible), nom et informations légales de l'entreprise, SIRET, métier, région, coordonnées, assurance, médiateur",
    "Exécution du contrat (6.1.b)",
    "Pendant l'abonnement, puis suppression sous 30 jours après la clôture du compte. Les éléments qui prouvent le contrat sont archivés 5 ans (art. L. 110-4 du Code de commerce).",
  ],
  [
    "Facturer l'abonnement et tenir la comptabilité",
    "Identité de l'entreprise, factures, historique des paiements (jamais les numéros de carte, gérés par Stripe)",
    "Obligation légale (6.1.c)",
    "10 ans pour les pièces comptables (art. L. 123-22 du Code de commerce)",
  ],
  [
    "Remplir votre fiche entreprise à partir du SIRET",
    "Le SIRET que vous saisissez, envoyé à l'API Recherche d'entreprises de l'État",
    "Exécution du contrat (6.1.b)",
    "Les informations retenues sont gardées avec votre compte ; l'API ne reçoit que le SIRET",
  ],
  [
    "Vous informer sur Batrelio (nouveautés, offres liées à votre activité)",
    "E-mail professionnel, nom de l'entreprise",
    "Intérêt légitime (6.1.f), avec possibilité de vous y opposer à tout moment",
    "3 ans après votre dernier contact avec nous",
  ],
  [
    "Répondre à vos demandes et au support",
    "Vos messages et les informations utiles pour vous répondre",
    "Intérêt légitime (6.1.f)",
    "3 ans après la dernière demande",
  ],
  [
    "Sécuriser le service et prévenir la fraude",
    "Journaux de connexion (date, heure, adresse IP, appareil)",
    "Intérêt légitime (6.1.f)",
    "12 mois maximum, conformément aux recommandations de la CNIL",
  ],
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Politique de confidentialité"
      intro="Cette page explique simplement quelles données personnelles nous traitons, pourquoi, combien de temps, et comment exercer vos droits, conformément au Règlement général sur la protection des données (RGPD, règlement UE 2016/679) et à la loi Informatique et Libertés du 6 janvier 1978."
    >
      <LegalSection title="En bref">
        <LegalList
          items={[
            "Nous ne vendons aucune donnée et ne faisons aucune publicité ciblée.",
            "Le site n'utilise aucun traceur publicitaire ni outil de mesure d'audience : seulement le cookie qui vous garde connecté.",
            "Les données des comptes sont stockées dans l'Union européenne.",
            "Le calculateur de la page d'accueil fonctionne dans votre navigateur : les chiffres que vous saisissez ne nous sont pas envoyés.",
            "Vous pouvez à tout moment accéder à vos données, les corriger ou les faire supprimer.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Qui est responsable de vos données ?">
        <p>Le responsable du traitement est l&apos;éditeur de Batrelio :</p>
        <LegalFacts
          facts={[
            ["Société", `${PUBLISHER.legalName}, ${PUBLISHER.legalForm}`],
            ["Adresse", PUBLISHER.address],
            ["Contact données personnelles", PUBLISHER.privacyEmail],
          ]}
        />
        <p>
          Batrelio n&apos;est pas tenu de désigner un délégué à la protection des données (article 37 du RGPD). Pour
          toute question, écrivez à l&apos;adresse ci-dessus.
        </p>
      </LegalSection>

      <LegalSection title="Les données des artisans et des visiteurs">
        <p>
          Quand vous visitez le site ou utilisez votre compte Batrelio, nous traitons les données suivantes, pour les
          raisons et durées indiquées :
        </p>
        <LegalTable columns={PROCESSING_COLUMNS} rows={PROCESSING_ROWS} />
        <p>
          Les informations demandées à l&apos;inscription sont nécessaires pour créer le compte : sans elles, nous ne
          pouvons pas fournir le service. Aucune décision automatisée produisant des effets juridiques à votre égard
          n&apos;est prise (article 22 du RGPD).
        </p>
      </LegalSection>

      <LegalSection title="Vous êtes client d'un artisan qui utilise Batrelio">
        <p>
          Si vous avez appelé un artisan et reçu un SMS de sa part, ou rempli son formulaire de demande, vos données
          (numéro de téléphone, nom, adresse du chantier, description de votre besoin, photos, devis) sont traitées
          pour le compte de cet artisan.
        </p>
        <LegalList
          items={[
            <>
              <strong>L&apos;artisan est responsable du traitement</strong> : c&apos;est lui qui décide de l&apos;usage
              de vos données, pour répondre à votre demande et vous établir un devis.
            </>,
            <>
              <strong>Batrelio est son sous-traitant</strong> (article 28 du RGPD) : nous ne traitons vos données que
              sur ses instructions, sans jamais les utiliser pour notre propre compte. Nos engagements sont décrits
              dans l&apos;
              <Link href="/sous-traitance" className="font-medium text-orange-700 underline">
                accord de traitement des données
              </Link>
              .
            </>,
            "Votre numéro nous est transmis automatiquement par l'opérateur téléphonique, parce que vous avez appelé l'artisan.",
            "Pour exercer vos droits, adressez-vous à l'artisan. Vous pouvez aussi nous écrire : nous transmettrons votre demande à l'artisan concerné et l'aiderons à y répondre.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Qui reçoit vos données ?">
        <p>
          Vos données sont accessibles à l&apos;équipe Batrelio uniquement quand c&apos;est nécessaire (support,
          sécurité), et aux prestataires techniques suivants, liés par contrat et tenus à la confidentialité :
        </p>
        <LegalTable
          columns={["Prestataire", "Rôle", "Où sont les données"]}
          rows={SUBPROCESSORS_IN_SERVICE.map((subprocessor) => [
            subprocessor.name,
            subprocessor.purpose,
            subprocessor.dataLocation,
          ])}
        />
        <p>
          Quand vous utilisez « Remplir avec mon SIRET », seul le SIRET est envoyé à l&apos;API Recherche
          d&apos;entreprises de l&apos;État, qui renvoie des informations publiques du registre des entreprises.
        </p>
        <p>
          Nous pouvons enfin communiquer des données aux autorités lorsque la loi nous y oblige.
        </p>
      </LegalSection>

      <LegalSection title="Transferts hors de l'Union européenne">
        <p>
          Certains prestataires sont établis aux États-Unis. Ces transferts sont encadrés par les garanties prévues
          aux articles 44 à 49 du RGPD :
        </p>
        <LegalList
          items={SUBPROCESSORS_IN_SERVICE.filter((subprocessor) => subprocessor.transferSafeguard).map(
            (subprocessor) => `${subprocessor.name} : ${subprocessor.transferSafeguard}.`,
          )}
        />
        <p>Vous pouvez obtenir une copie de ces garanties en nous écrivant.</p>
      </LegalSection>

      <LegalSection title="Comment vos données sont protégées">
        <LegalList
          items={[
            "Toutes les connexions au site sont chiffrées (HTTPS).",
            "Les mots de passe sont stockés sous forme chiffrée irréversible : personne, pas même Batrelio, ne peut les lire.",
            "Chaque artisan ne peut accéder qu'aux données de sa propre entreprise : la base de données l'impose à chaque requête.",
            "Les clés d'accès sensibles ne quittent jamais nos serveurs.",
            "Les paiements par carte sont traités par Stripe : Batrelio ne voit ni ne stocke jamais les numéros de carte.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>Vous disposez des droits suivants sur vos données (articles 15 à 22 du RGPD) :</p>
        <LegalList
          items={[
            "accès : savoir quelles données nous avons sur vous et en obtenir une copie ;",
            "rectification : corriger des données inexactes ;",
            "effacement : faire supprimer vos données, sauf si la loi nous oblige à les garder ;",
            "limitation : faire geler temporairement l'utilisation de vos données ;",
            "portabilité : récupérer les données que vous nous avez fournies dans un format lisible ;",
            "opposition : refuser un traitement fondé sur notre intérêt légitime, et à tout moment les messages d'information sur Batrelio ;",
            "directives post-mortem : décider du sort de vos données après votre décès (article 85 de la loi Informatique et Libertés).",
          ]}
        />
        <p>
          Pour les exercer, écrivez à {PUBLISHER.privacyEmail}. Nous répondons dans un délai d&apos;un mois, qui
          peut être prolongé de deux mois pour une demande complexe (article 12 du RGPD). Nous pouvons vous demander
          de justifier de votre identité en cas de doute raisonnable.
        </p>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la
          CNIL, {CNIL.address} (<ExternalLink href={CNIL.complaintUrl}>cnil.fr/fr/plaintes</ExternalLink>).
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Le site n&apos;utilise qu&apos;un cookie de connexion, nécessaire au service et donc exempté de
          consentement. Le détail est sur la{" "}
          <Link href="/cookies" className="font-medium text-orange-700 underline">
            page cookies
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Modifications">
        <p>
          Nous mettrons cette politique à jour si nos traitements évoluent, par exemple à la mise en service d&apos;un
          nouveau prestataire. La date de dernière mise à jour figure en haut de la page. En cas de changement
          important, les artisans sont prévenus par e-mail.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
