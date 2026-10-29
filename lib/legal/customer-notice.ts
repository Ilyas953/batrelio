// Information owed to the artisan's customers when their data is collected (art. 13 RGPD).
// To display, short, on the request form linked in the SMS, with a link to /confidentialite.
export function customerPrivacyNotice(companyName: string): string {
  return (
    `${companyName} utilise vos informations (numéro, nom, adresse, besoin, photos) uniquement pour ` +
    "répondre à votre demande et vous établir un devis. Elles sont hébergées par Batrelio, son prestataire, " +
    `dans l'Union européenne. Vous pouvez y accéder, les corriger ou les faire supprimer en contactant ${companyName}.`
  );
}
