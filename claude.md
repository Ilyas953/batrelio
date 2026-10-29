Batrelio
But du projet

SaaS pour artisans (couvreurs, élagueurs, paysagistes, plombiers…). Promesse : ne plus perdre de clients parce qu'on est sur un chantier. Utilisateurs peu à l'aise avec la technique, sur téléphone entre deux chantiers : chaque écran doit être simple, mobile d'abord, sans jargon, avec de gros boutons. Règle produit : tout marche par défaut, la personnalisation est en option.

Périmètre V1 (ne rien coder en dehors sans validation)
Appel manqué un
Hors V1 : dashboard de résultats, devis vocal, partage de mission, app mobile native.

Stack
Next.js (App Router) + TypeScript strict, déployé sur Vercel 
Supabase : Postgres, Auth, Storage, Row Level Security
Twilio : numéros virtuels (voix), SMS avec nom d'expéditeur
Stripe Connect : acomptes ; Stripe Billing : abonnements
Brevo : e-mails
Structure des dossiers
app/ : routes (App Router)
components/ : composants React (components/landing/ pour la page d'accueil)
lib/ : logique métier ; lib/supabase/ : clients Supabase (client.ts navigateur, server.ts serveur, proxy.ts rafraîchissement de session) et database.types.ts (généré, ne pas modifier à la main)
proxy.ts : rafraîchit la session Supabase à chaque requête
supabase/migrations/ : migrations SQL, une par changement de schéma
Commandes
npm run dev / build / lint
npm run db:new <nom> : créer une migration
npm run db:push : appliquer les migrations sur le projet Supabase lié
npm run db:types : régénérer lib/supabase/database.types.ts (après chaque migration)
npm run db:link -- --project-ref <ref> : lier le projet (après npx supabase login)
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