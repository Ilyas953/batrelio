# Conformité : ce qui reste à faire hors du code

Le code couvre les pages légales, l'acceptation des CGV et la limitation des cookies.
Ces points-là dépendent de toi, d'un professionnel ou des prestataires.

## Avant la mise en ligne

1. **Identité de l'éditeur** : fait (Ilyas BENAMARA EI, `lib/legal/publisher.ts`). À tenir à jour en
   cas de déménagement ou de changement de numéro.
2. **Vérifier le téléphone de l'hébergeur Vercel** dans `lib/legal/publisher.ts`
   (obligatoire dans les mentions légales ; pris d'une source tierce, à confirmer sur vercel.com).
3. **Faire relire par un avocat** : CGV, politique de confidentialité, accord de traitement.
   Points sensibles : limitation de responsabilité, clause de juridiction (un artisan n'est pas
   toujours commerçant), et le parcours devis + signature + acompte côté droit de la consommation.
4. **Signer les accords de traitement (DPA) des prestataires** :
   - Supabase : dashboard → Organization settings → Legal documents (DPA à signer) ;
   - Vercel : DPA inclus dans ses conditions, à télécharger et archiver ;
   - Twilio, Stripe, Brevo : à leur mise en service.
   Archiver les PDF : ils prouvent que les transferts hors UE sont encadrés.
5. **Registre** `docs/rgpd/registre-des-traitements.md` : identité remplie, à tenir à jour.

## À chaque nouveau prestataire (Twilio, Stripe, Brevo…)

1. Passer `inService: true` dans `lib/legal/subprocessors.ts` : la politique de confidentialité
   et l'accord de traitement se mettent à jour automatiquement.
2. Prévenir les artisans par e-mail **30 jours avant** (engagement de l'accord de traitement).
3. Mettre à jour le registre.

## À chaque modification des CGV

1. Changer `LEGAL_VERSION` et `LEGAL_LAST_UPDATED` dans `lib/legal/publisher.ts`.
2. Prévenir les artisans par e-mail **30 jours avant** l'entrée en vigueur.

## Fonctionnalités à venir : obligations à ne pas oublier

- **Formulaire client** : fait. Le texte `customerPrivacyNotice()` est affiché sous le formulaire
  `/demande/[jeton]`, avec un lien vers `/confidentialite`.
- **Photos des demandes** : supprimer une demande efface ses lignes `request_photos`, mais pas les
  fichiers du bucket `request-photos`. Toute suppression (bouton, purge à 3 ans, fin de contrat) doit
  aussi appeler `storage.from("request-photos").remove(...)`.
- **SMS après appel manqué** : aucun contenu publicitaire (sinon c'est de la prospection, soumise au
  consentement préalable, article L. 34-5 du Code des postes et des communications électroniques).
- **Devis et signature en ligne** : faire valider les mentions obligatoires et le droit de
  rétractation de 14 jours pour les clients particuliers (contrat à distance).
- **Suppression automatique** des demandes sans suite après 3 ans (recommandation CNIL, prévue dans
  l'accord de traitement) : à programmer, par exemple avec `pg_cron` dans Supabase.
- **Suppression de compte** : aujourd'hui sur demande par e-mail ; un bouton dans l'espace serait un plus.
- **Comptes créés depuis l'admin** : l'artisan n'a pas coché les CGV. Lui faire accepter à sa première
  connexion, ou garder une trace écrite de son accord.
