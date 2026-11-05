Batrelio
But du projet

SaaS pour artisans (couvreurs, élagueurs, paysagistes, plombiers…). Promesse : ne plus perdre de clients parce qu'on est sur un chantier. Utilisateurs peu à l'aise avec la technique, sur téléphone entre deux chantiers : chaque écran doit être simple, mobile d'abord, sans jargon, avec de gros boutons. Règle produit : tout marche par défaut, la personnalisation est en option.

Périmètre V1 (ne rien coder en dehors sans validation)
Appel manqué un
Ajouté à la V1 (validé le 5 novembre 2026) : proposer une visite, partager une mission (placée à la main depuis l'admin).
Hors V1 : dashboard de résultats, devis vocal, app mobile native.

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
npm run typecheck : vérifier les types (sans build)
npm test : tests rapides de la logique métier (tests/unit, sans serveur ni base, quelques secondes)
npm run test:e2e : après npm run build, parcours réels sur un serveur local et la base Supabase de .env.local (données jetables supprimées à la fin, aucun numéro acheté ni SMS envoyé)
npm run db:new <nom> : créer une migration
npm run db:push : appliquer les migrations sur le projet Supabase lié
npm run db:types : régénérer lib/supabase/database.types.ts (après chaque migration)
npm run db:link -- --project-ref <ref> : lier le projet (après npx supabase login)
Règles de code
Petites fonctions, noms explicites en anglais, textes de l'interface en français
Après chaque modification : lancer lint, typecheck, npm test et build, et corriger les erreurs ; npm run test:e2e avant chaque mise en ligne. Toute nouvelle règle métier ou correction de bug vient avec son test
Une fonctionnalité = une branche, commits fréquents
Fournisseurs externes (SMS, appels, paiements) derrière une fonction unique, pour pouvoir en changer
Sécurité (non négociable)
RLS activée sur toutes les tables : un artisan ne voit jamais les données d'un autre
Vérifier la signature de tous les webhooks (Twilio, Stripe)
Aucune clé secrète côté client ; variables d'environnement uniquement
Ne jamais stocker de carte bancaire ni d'IBAN complet : tout passe par Stripe
Utiliser uniquement les clés de test en développement