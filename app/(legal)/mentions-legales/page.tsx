import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LegalDocument, LegalFacts, LegalSection } from "@/components/legal/LegalDocument";
import { PUBLISHER, WEBSITE_HOST } from "@/lib/legal/publisher";

export const metadata: Metadata = {
  title: "Mentions légales · Batrelio",
  description: "Éditeur, hébergeur et informations légales du site Batrelio.",
};

export default function LegalNoticePage() {
  return (
    <LegalDocument
      title="Mentions légales"
      intro="Informations sur l'éditeur et l'hébergeur du site, conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN)."
    >
      <LegalSection title="Éditeur du site">
        <LegalFacts
          facts={[
            ["Nom commercial", PUBLISHER.brand],
            ["Raison sociale", PUBLISHER.legalName],
            ["Forme juridique", PUBLISHER.legalForm],
            ...(PUBLISHER.shareCapital ? [["Capital social", PUBLISHER.shareCapital] as [string, string]] : []),
            ["Siège social", PUBLISHER.address],
            ["SIREN", PUBLISHER.siren],
            ["Immatriculation", PUBLISHER.registration],
            ["TVA intracommunautaire", PUBLISHER.vatNumber],
            ["E-mail", PUBLISHER.email],
            ["Téléphone", PUBLISHER.phone],
            ["Directeur de la publication", PUBLISHER.publicationDirector],
          ]}
        />
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>Le site et l&apos;application sont hébergés par :</p>
        <LegalFacts
          facts={[
            ["Hébergeur", WEBSITE_HOST.name],
            ["Adresse", WEBSITE_HOST.address],
            ["Téléphone", WEBSITE_HOST.phone],
            ["Site", <ExternalLink key="host" href={WEBSITE_HOST.website}>{WEBSITE_HOST.website}</ExternalLink>],
          ]}
        />
        <p>
          Les données des comptes sont stockées par Supabase Inc. dans l&apos;Union européenne (Irlande). La liste
          complète des prestataires figure dans la{" "}
          <Link href="/confidentialite" className="font-medium text-orange-700 underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          Le site, son contenu (textes, logo, interface) et le logiciel Batrelio sont protégés par le Code de la
          propriété intellectuelle. Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite
          de l&apos;éditeur est interdite (articles L. 122-4 et L. 335-2 du Code de la propriété intellectuelle).
        </p>
        <p>
          Les polices de caractères Geist et Bricolage Grotesque sont utilisées sous licence SIL Open Font License et
          servies directement par le site.
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles et cookies">
        <p>
          La façon dont nous traitons les données personnelles est expliquée dans la{" "}
          <Link href="/confidentialite" className="font-medium text-orange-700 underline">
            politique de confidentialité
          </Link>
          . Le site n&apos;utilise que des cookies nécessaires à son fonctionnement : voir la{" "}
          <Link href="/cookies" className="font-medium text-orange-700 underline">
            page cookies
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Signaler un contenu">
        <p>
          Pour signaler un contenu illicite ou nous contacter au sujet du site, écrivez à {PUBLISHER.email}. Indiquez
          l&apos;adresse de la page concernée et la raison de votre signalement.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
