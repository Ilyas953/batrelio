import type { Metadata } from "next";
import { LegalDocument, LegalList, LegalSection, LegalTable } from "@/components/legal/LegalDocument";
import { AUTH_COOKIE_LIFETIME_LABEL } from "@/lib/supabase/cookie-options";

export const metadata: Metadata = {
  title: "Cookies · Batrelio",
  description: "Le seul cookie utilisé par Batrelio : celui qui vous garde connecté.",
};

export default function CookiesPage() {
  return (
    <LegalDocument
      title="Cookies"
      intro="Batrelio n'utilise que des cookies indispensables au fonctionnement du service. C'est pourquoi aucun bandeau ne vous demande votre accord."
    >
      <LegalSection title="Les cookies utilisés">
        <LegalTable
          columns={["Cookie", "À quoi il sert", "Durée"]}
          rows={[
            [
              "sb-…-auth-token",
              "Vous garder connecté à votre compte. Il peut être découpé en plusieurs morceaux (…-auth-token.0, .1) si la session est longue.",
              `${AUTH_COOKIE_LIFETIME_LABEL} maximum, supprimé à la déconnexion`,
            ],
            [
              "sb-…-auth-token-code-verifier",
              "Sécuriser l'ouverture de votre compte depuis un lien reçu par e-mail.",
              "Le temps de la connexion",
            ],
          ]}
        />
        <p>
          Ces cookies ne sont déposés que si vous vous connectez ou créez un compte. Ils ne servent à rien
          d&apos;autre qu&apos;à vous authentifier et ne sont lus que par Batrelio.
        </p>
      </LegalSection>

      <LegalSection title="Pourquoi aucun consentement n'est demandé">
        <p>
          L&apos;article 82 de la loi Informatique et Libertés exige votre accord avant de déposer un cookie, sauf
          s&apos;il est strictement nécessaire au service que vous demandez. Les lignes directrices de la CNIL sur les
          cookies et autres traceurs citent expressément les cookies d&apos;authentification parmi ces exceptions.
        </p>
      </LegalSection>

      <LegalSection title="Ce que nous n'utilisons pas">
        <LegalList
          items={[
            "aucun cookie publicitaire ;",
            "aucun outil de mesure d'audience (Google Analytics ou autre) ;",
            "aucun bouton de réseau social qui vous suivrait ;",
            "aucune police ou ressource chargée depuis Google : les polices sont servies par notre propre site.",
          ]}
        />
        <p>
          Si nous ajoutons un jour un cookie non indispensable, nous vous demanderons votre accord au préalable, avec
          la possibilité de refuser aussi simplement que d&apos;accepter.
        </p>
      </LegalSection>

      <LegalSection title="Supprimer les cookies">
        <p>
          Vous pouvez supprimer les cookies à tout moment dans les réglages de votre navigateur. Vous serez alors
          déconnecté de votre compte Batrelio.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
