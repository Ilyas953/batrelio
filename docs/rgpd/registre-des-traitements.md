# Registre des activités de traitement (article 30 du RGPD)

Document interne, à tenir à jour et à présenter à la CNIL sur demande. Il n'est pas publié.
Dernière mise à jour : 29 octobre 2026.

## Responsable du traitement

- Société : [À compléter : raison sociale, forme juridique]
- Adresse : [À compléter : siège social]
- Contact données personnelles : [À compléter : e-mail]
- Délégué à la protection des données : non désigné (pas obligatoire, article 37 du RGPD)

Les valeurs publiques correspondantes sont dans `lib/legal/publisher.ts`.

---

## Partie 1 : traitements dont Batrelio est responsable (article 30.1)

### 1. Gestion des comptes et fourniture du service

| Rubrique | Contenu |
|---|---|
| Finalité | Créer et gérer le compte de l'artisan, fournir le service |
| Base légale | Exécution du contrat (art. 6.1.b) |
| Personnes concernées | Artisans abonnés et leurs utilisateurs |
| Données | E-mail, mot de passe (haché par Supabase Auth), informations de l'entreprise (nom, raison sociale, forme juridique, SIRET, code NAF, adresse, TVA, capital), métier, région, assurance, médiateur, téléphone et e-mail de contact, version et date d'acceptation des CGV |
| Destinataires | Équipe Batrelio habilitée ; sous-traitants : Supabase, Vercel |
| Transferts hors UE | Vercel (États-Unis) : Data Privacy Framework ou clauses contractuelles types. Supabase : données en Irlande, accès techniques encadrés par clauses contractuelles types |
| Durée | Durée de l'abonnement, suppression sous 30 jours après la clôture ; preuve du contrat archivée 5 ans (art. L. 110-4 C. com.) |
| Sécurité | HTTPS ; RLS sur toutes les tables ; droits d'écriture limités par colonne ; clé secrète uniquement côté serveur |

### 2. Facturation et comptabilité

| Rubrique | Contenu |
|---|---|
| Finalité | Facturer l'abonnement, tenir la comptabilité |
| Base légale | Obligation légale (art. 6.1.c) |
| Données | Identité de l'entreprise, factures, historique des paiements (aucune donnée de carte : Stripe) |
| Destinataires | Équipe Batrelio, expert-comptable ; Stripe (quand le paiement sera en service) |
| Durée | 10 ans (art. L. 123-22 C. com.) |

### 3. Remplissage par SIRET

| Rubrique | Contenu |
|---|---|
| Finalité | Pré-remplir la fiche entreprise à partir du registre public |
| Base légale | Exécution du contrat (art. 6.1.b) |
| Données | SIRET envoyé à l'API Recherche d'entreprises (État) ; données publiques reçues |
| Durée | Conservées avec le compte |

### 4. Information commerciale des artisans (B2B)

| Rubrique | Contenu |
|---|---|
| Finalité | Informer les artisans des nouveautés et offres liées à leur activité |
| Base légale | Intérêt légitime (art. 6.1.f) ; e-mail professionnel lié à l'activité, opposition possible à chaque envoi (règle CNIL de la prospection B2B) |
| Données | E-mail professionnel, nom de l'entreprise |
| Durée | 3 ans après le dernier contact |
| Statut | Pas encore en service (aucun envoi d'e-mail marketing) |

### 5. Support

| Rubrique | Contenu |
|---|---|
| Finalité | Répondre aux demandes |
| Base légale | Intérêt légitime (art. 6.1.f) |
| Durée | 3 ans après la dernière demande |

### 6. Sécurité et journaux

| Rubrique | Contenu |
|---|---|
| Finalité | Sécuriser le service, détecter les abus |
| Base légale | Intérêt légitime (art. 6.1.f) |
| Données | Journaux de connexion (date, IP, appareil) tenus par Supabase et Vercel |
| Durée | 12 mois maximum (recommandation CNIL : 6 mois à 1 an) |

### Cookies

Un seul cookie, d'authentification (`sb-…-auth-token`), exempté de consentement (article 82 de la loi Informatique et Libertés, lignes directrices CNIL). Durée : 13 mois maximum (`lib/supabase/cookie-options.ts`). Aucun traceur publicitaire ni de mesure d'audience.

---

## Partie 2 : traitements faits pour le compte des artisans (article 30.2, sous-traitant)

| Rubrique | Contenu |
|---|---|
| Responsables du traitement | Chaque artisan abonné (liste : table `companies`) |
| Catégories de traitement | Réception des appels manqués, SMS de réponse, formulaire de demande, devis, signature, relances, suivi des acomptes |
| Données | Numéro de téléphone, nom, adresse du chantier, besoin, photos, devis, preuve de signature, état de l'acompte |
| Sous-traitants ultérieurs | Supabase (en service) ; Twilio, Stripe, Brevo (à leur mise en service, voir `lib/legal/subprocessors.ts`) |
| Transferts hors UE | Twilio, Stripe : Data Privacy Framework ou clauses contractuelles types |
| Sécurité | Isolement par entreprise (RLS), HTTPS, aucune donnée de carte stockée |
| Contrat | Accord de traitement publié sur `/sous-traitance`, accepté avec les CGV |

---

## Historique

- 29 octobre 2026 : création du registre.
