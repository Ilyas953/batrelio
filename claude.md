Batrelio
But du projet

SaaS pour artisans (couvreurs, élagueurs, paysagistes, plombiers…). Promesse : ne plus perdre de clients parce qu'on est sur un chantier. Utilisateurs peu à l'aise avec la technique, sur téléphone entre deux chantiers : chaque écran doit être simple, mobile d'abord, sans jargon, avec de gros boutons. Règle produit : tout marche par défaut, la personnalisation est en option.

Périmètre V1 (ne rien coder en dehors sans validation)
Appel manqué → renvoi vers un numéro virtuel de l'artisan → message vocal d'accueil
SMS automatique au client (expéditeur = nom court de l'entreprise, 11 caractères max) avec lien vers un formulaire
Formulaire client : besoin, photos, adresse → demande dans l'espace artisan
Artisan : « Faire le devis » (devis pré-rempli, il met ses prix) ou « Proposer une visite »
Devis par lien : signature en ligne + acompte (carte via Stripe Connect si activé, sinon virement)
Relances automatiques des devis non signés (arrêt dès signature ou réponse)

Hors V1 : dashboard de résultats, devis vocal, partage de mission, app mobile native.

Stack
Next.js (App Router) + TypeScript strict, déployé sur Vercel (multi-tenant : un domaine par artisan)
Supabase : Postgres, Auth, Storage, Row Level Security
Twilio : numéros virtuels (voix), SMS avec nom d'expéditeur
Stripe Connect : acomptes ; Stripe Billing : abonnements
Brevo : e-mails
Structure des dossiers
<!-- À compléter : app/, components/, lib/, supabase/migrations/ … -->
Commandes
<!-- À compléter : dev, build, lint, test, migrations -->
Règles de code
Petites fonctions, noms explicites en anglais, textes de l'interface en français
Après chaque modification : lancer lint, build et tests, et corriger les erreurs
Une fonctionnalité = une branche, commits fréquents
Fournisseurs externes (SMS, appels, paiements) derrière une fonction unique, pour pouvoir en changer
Sécurité (non négociable)
RLS activée sur toutes les tables : un artisan ne voit jamais les données d'un autre
Vérifier la signature de tous les webhooks (Twilio, Stripe)
Aucune clé secrète côté client ; variables d'environnement uniquement
Ne jamais stocker de carte bancaire ni d'IBAN complet : tout passe par Stripe
Utiliser uniquement les clés de test en développement