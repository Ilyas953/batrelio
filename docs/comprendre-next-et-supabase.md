# Comprendre Next.js et Supabase dans Batrelio

Toutes les fonctions de Next.js et de Supabase utilisées dans le projet, expliquées une fois, avec un exemple réel de ton code.
Les liens s'ouvrent dans VS Code (Cmd + clic, ou aperçu Markdown : Cmd + Maj + V).

**La seule question à se poser devant chaque ligne : est-ce que ce code tourne sur le serveur ou dans le téléphone de l'utilisateur ?**
Presque toutes les confusions viennent de là.

---

# Partie 1 — Next.js

## 1.1 Les fichiers spéciaux : le nom du fichier décide de son rôle

| Fichier | Rôle | Dans ton projet |
|---|---|---|
| `page.tsx` | Une page visible à une adresse. Le chemin des dossiers = l'URL | 29 pages, ex. [app/espace/devis/page.tsx](../app/espace/devis/page.tsx) → `/espace/devis` |
| `layout.tsx` | Le cadre autour de toutes les pages d'un dossier (en-tête, menu, pied de page) | [app/espace/layout.tsx](../app/espace/layout.tsx) : en-tête + onglets de tout l'espace artisan |
| `route.ts` | Une adresse qui répond avec des données, pas une page. Exporte `GET` ou `POST` | [app/api/twilio/voice/route.ts](../app/api/twilio/voice/route.ts) : Twilio y envoie chaque appel |
| `[token]`, `[id]` | Dossier « joker » : n'importe quelle valeur dans l'URL | [app/demande/[token]/page.tsx](../app/demande/[token]/page.tsx) : `/demande/8f3a…` |
| `(legal)` | Dossier entre parenthèses : regroupe sans apparaître dans l'URL | [app/(legal)/cgv/page.tsx](../app/%28legal%29/cgv/page.tsx) → `/cgv`, pas `/legal/cgv` |
| `icon.tsx`, `apple-icon.tsx` | Fabriquent l'icône du site (onglet, écran d'accueil iPhone) | [app/icon.tsx](../app/icon.tsx) |
| `manifest.ts` | Rend le site installable comme une appli | [app/manifest.ts](../app/manifest.ts) |
| `robots.ts`, `sitemap.ts` | Disent à Google quoi indexer | [app/robots.ts](../app/robots.ts), [app/sitemap.ts](../app/sitemap.ts) |
| `proxy.ts` (racine) | S'exécute **avant** chaque page demandée (anciennement « middleware ») | [proxy.ts](../proxy.ts) : rafraîchit la session pour `/espace`, `/admin`, `/auth` |
| `next.config.ts` (racine) | Réglages du site entier | [next.config.ts](../next.config.ts) : en-têtes de sécurité, taille max des envois |

Le fichier `export default function …` d'un `page.tsx` ou `layout.tsx` est ce que Next.js affiche.

## 1.2 Les trois étiquettes en haut des fichiers

| Étiquette | Signifie | Exemple |
|---|---|---|
| `"use client"` | Ce composant tourne **dans le navigateur** : il peut réagir aux clics, avoir un état, des animations. Il ne doit contenir aucun secret | [app/connexion/LoginForm.tsx](../app/connexion/LoginForm.tsx) |
| `"use server"` | Ces fonctions tournent **sur le serveur**, mais peuvent être appelées depuis un formulaire du navigateur, comme une fonction normale. Next.js fait le trajet aller-retour pour toi. On les appelle « Server Functions » ou « Server Actions » | [app/inscription/actions.ts](../app/inscription/actions.ts) → `signUp` |
| `import "server-only"` | Sécurité : si par erreur ce fichier est importé dans du code navigateur, **le build échoue**. Protège les clés secrètes | [lib/supabase/admin.ts](../lib/supabase/admin.ts) |

Sans étiquette, un composant dans `app/` est un **composant serveur** : il est calculé sur le serveur et le navigateur ne reçoit que le HTML final.

> Attention : tout ce qui est exporté d'un fichier `"use server"` peut être appelé par **n'importe qui** sur Internet, pas seulement par ton formulaire.
> C'est pour ça que chaque action recommence par vérifier qui appelle (`requireUser()`, token valide, limiteur…).

## 1.3 Fonctions côté serveur

| Fonction | D'où | Ce qu'elle fait | Exemple |
|---|---|---|---|
| `redirect("/adresse")` | `next/navigation` | Arrête tout et envoie l'utilisateur ailleurs. Rien après cette ligne n'est exécuté | [app/admin/comptes/actions.ts:65](../app/admin/comptes/actions.ts#L65) |
| `notFound()` | `next/navigation` | Arrête tout et affiche la page « introuvable » (404) | [app/devis/[token]/page.tsx:38](../app/devis/[token]/page.tsx#L38) : devis inexistant |
| `headers()` | `next/headers` | Lit les en-têtes de la requête (adresse IP, site d'origine…). Toujours avec `await` | [app/inscription/actions.ts:79](../app/inscription/actions.ts#L79) |
| `cookies()` | `next/headers` | Lit et écrit les cookies (c'est là que vit la session Supabase) | [lib/supabase/server.ts:11](../lib/supabase/server.ts#L11) |
| `connection()` | `next/server` | « Attends une vraie visite » : empêche Next.js de pré-calculer ce code à l'avance (une session se vérifie à l'instant T, pas au moment du build) | [lib/auth/session.ts:29](../lib/auth/session.ts#L29) |
| `after(() => …)` | `next/server` | Lance du travail **après** avoir répondu. Le client n'attend pas | [app/api/twilio/voice/route.ts](../app/api/twilio/voice/route.ts) : le message d'accueil part tout de suite, le SMS juste après |
| `NextResponse.redirect()` / `NextResponse.next()` | `next/server` | Construire une réponse dans `route.ts` ou `proxy.ts` | [app/auth/callback/route.ts:11](../app/auth/callback/route.ts#L11) |
| `NextRequest` | `next/server` | La requête reçue, avec l'URL déjà découpée (`request.nextUrl.searchParams`) | [app/auth/confirm/route.ts](../app/auth/confirm/route.ts) |
| `new Response(…)` | standard du web | Réponse brute : ici du XML pour Twilio | [app/api/twilio/voice/route.ts](../app/api/twilio/voice/route.ts) → `twimlResponse` |
| `ImageResponse` | `next/og` | Dessine une image PNG à partir de JSX | [app/apple-icon.tsx:9](../app/apple-icon.tsx#L9) |
| `Geist`, `Bricolage_Grotesque` | `next/font/google` | Charge une police Google, mais l'héberge sur ton site (plus rapide, rien n'est envoyé à Google) | [app/layout.tsx](../app/layout.tsx), [components/landing/Logo.tsx](../components/landing/Logo.tsx) |

### Les types fournis par Next.js

| Type | Sert à | Exemple |
|---|---|---|
| `Metadata` | Titre de l'onglet, description pour Google, `robots: { index: false }` pour cacher une page | [app/espace/layout.tsx](../app/espace/layout.tsx) |
| `MetadataRoute.Manifest` / `.Sitemap` / `.Robots` | Le format attendu par `manifest.ts`, `sitemap.ts`, `robots.ts` | [app/manifest.ts:4](../app/manifest.ts#L4) |
| `PageProps<"/admin/comptes/[id]">` | Ce que reçoit une page : `params` (les jokers de l'URL) et `searchParams` (après le `?`) | [app/admin/comptes/[id]/page.tsx:7](../app/admin/comptes/[id]/page.tsx#L7) |
| `LayoutProps<"/espace">` | Ce que reçoit un layout : `children` = la page à l'intérieur | [app/espace/layout.tsx:18](../app/espace/layout.tsx#L18) |
| `NextConfig` | Le format de `next.config.ts` | [next.config.ts](../next.config.ts) |

### `params.then(…)` et `<Suspense>` : le motif qu'on voit partout

```tsx
<Suspense fallback={<p>Chargement…</p>}>
  {params.then(({ token }) => <CustomerRequest token={token} />)}
</Suspense>
```

- `params` est une **promesse** : la valeur de l'URL n'est connue qu'au moment de la visite.
- `<Suspense>` dit : « envoie déjà tout le reste de la page (cadre, pied de page) et affiche *Chargement…* ici ; remplace-le quand c'est prêt ».
- Résultat : la page apparaît instantanément, seule la partie qui lit la base arrive une fraction de seconde après.
- C'est le « ◐ Partial Prerender » que tu vois à la fin de `npm run build`.

Exemple : [app/demande/[token]/page.tsx:35](../app/demande/[token]/page.tsx#L35).

## 1.4 Fonctions côté navigateur (dans les fichiers `"use client"`)

| Fonction | D'où | Ce qu'elle fait | Exemple |
|---|---|---|---|
| `<Link href="…">` | `next/link` | Un lien qui change de page **sans tout recharger** (et précharge la page suivante) | 34 fichiers, ex. [app/espace/layout.tsx](../app/espace/layout.tsx) |
| `useRouter()` | `next/navigation` | Piloter la navigation depuis le code : `router.push("/…")` pour aller ailleurs, `router.refresh()` pour recharger les données de la page sans perdre l'état | [app/espace/demandes/[id]/RequestActions.tsx:42](../app/espace/demandes/[id]/RequestActions.tsx#L42) |
| `usePathname()` | `next/navigation` | L'adresse actuelle, pour savoir quel onglet allumer | [app/espace/TabBar.tsx:25](../app/espace/TabBar.tsx#L25) |
| `useSearchParams()` | `next/navigation` | Lire ce qu'il y a après `?` dans l'URL | [app/connexion/LoginForm.tsx:54](../app/connexion/LoginForm.tsx#L54) : `?next=` pour revenir où on était |

## 1.5 Les outils React pour les formulaires (React, pas Next.js, mais utilisés partout)

| Hook | Ce qu'il fait | Exemple |
|---|---|---|
| `useActionState(action, étatInitial)` | Relie un `<form>` à une Server Function et garde sa réponse (`{ error }`, `{ checkEmail }`…) pour l'afficher | [app/admin/comptes/nouveau/CreateAccountForm.tsx:18](../app/admin/comptes/nouveau/CreateAccountForm.tsx#L18) |
| `useFormStatus()` | Dans un bouton : « le formulaire est-il en train d'envoyer ? » → bouton grisé + « Envoi… » | [components/ui/form.tsx:88](../components/ui/form.tsx#L88) |
| `useTransition()` | Lancer une action sans bloquer l'écran, avec un indicateur `isPending` | [app/demande/[token]/RequestForm.tsx:25](../app/demande/[token]/RequestForm.tsx#L25) : compression des photos, envoi |
| `useState()` | Une valeur qui, quand elle change, redessine le composant | 24 fois, ex. l'éditeur de devis |
| `useEffect()` | Faire quelque chose **après** l'affichage (écouter un événement, lancer un minuteur) | [components/espace/OnboardingTour.tsx](../components/espace/OnboardingTour.tsx) |
| `useRef()`, `useCallback()` | Garder une référence (ex. un lecteur audio) / ne pas recréer une fonction à chaque affichage | [app/espace/messages/useGreetingPlayer.ts](../app/espace/messages/useGreetingPlayer.ts) |

`.bind(null, companyId)` (ex. `updateCompany.bind(null, companyId)`) : fabrique une version de l'action avec le premier argument déjà rempli. Le formulaire n'a plus qu'à fournir ses champs.

## 1.6 Les réglages de [next.config.ts](../next.config.ts)

- `headers()` : ajoute des en-têtes de sécurité à toutes les pages (interdit d'afficher Batrelio dans un autre site, force le HTTPS…).
- `serverActions.bodySizeLimit: "15mb"` : par défaut une Server Function refuse plus de 1 Mo ; ici 15 Mo pour les 6 photos.
- `cacheComponents: true` : active le mode « tout est pré-calculé sauf ce qui est dans un `<Suspense>` ». C'est la raison des `<Suspense>` partout et de `connection()`.
- `partialPrefetching: true` : précharge la partie fixe des pages vers lesquelles pointent les liens.

---

# Partie 2 — Supabase

Supabase, c'est 3 services dans un : **Auth** (les comptes), **Database** (Postgres, tes tables), **Storage** (les fichiers : photos, logos, messages audio).

## 2.1 Les « clients » : la porte d'entrée vers Supabase

Avant toute chose, on crée un client. **Le choix du client décide de ce qu'on a le droit de voir.**

| Fichier | Fonction Supabase | Agit au nom de… | Utilisé quand |
|---|---|---|---|
| [lib/supabase/server.ts](../lib/supabase/server.ts) | `createServerClient` | **L'artisan connecté** (lit son cookie). La RLS s'applique : il ne voit que ses données | Pages et actions de `/espace` |
| [lib/supabase/proxy.ts](../lib/supabase/proxy.ts) | `createServerClient` | Pareil, mais dans `proxy.ts` : renouvelle le jeton de connexion avant qu'il expire, et renvoie vers `/connexion` si personne n'est connecté | Avant chaque page `/espace`, `/admin` |
| [lib/supabase/admin.ts](../lib/supabase/admin.ts) | `createClient` + **clé secrète** | **Personne : passe-partout**. La RLS ne s'applique pas | Quand il n'y a pas d'artisan connecté (appel Twilio, formulaire du client), ou après avoir vérifié soi-même le propriétaire |
| [lib/supabase/client.ts](../lib/supabase/client.ts) | `createBrowserClient` | L'artisan, depuis le navigateur | **Utilisé nulle part aujourd'hui** : tout passe par le serveur |

Les clés :
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` : publique, sans danger, la RLS protège.
- `SUPABASE_SECRET_KEY` : ouvre **tout**. Uniquement côté serveur, jamais avec `NEXT_PUBLIC_`.

## 2.2 Auth : les comptes

### Ce que fait l'artisan

| Fonction | Ce qu'elle fait | Exemple |
|---|---|---|
| `auth.signUp({ email, password, options })` | Crée le compte et envoie l'e-mail de confirmation (via Brevo). `options.data` = infos rangées dans `user_metadata`, lues par le trigger SQL qui crée l'entreprise | [app/inscription/actions.ts](../app/inscription/actions.ts) |
| `auth.signInWithPassword({ email, password })` | Connexion. Si c'est bon, pose le cookie de session | [lib/auth/actions.ts:22](../lib/auth/actions.ts#L22) |
| `auth.signOut()` | Déconnexion : efface le cookie | [lib/auth/actions.ts:32](../lib/auth/actions.ts#L32) |
| `auth.getClaims()` | « Qui est connecté ? » Vérifie le jeton du cookie et renvoie son contenu (`sub` = id, `email`, `app_metadata`, `user_metadata`). `null` si personne | [lib/auth/session.ts:32](../lib/auth/session.ts#L32) |
| `auth.exchangeCodeForSession(code)` | Le lien de confirmation d'inscription contient un code ; on l'échange contre une session | [app/auth/callback/route.ts:10](../app/auth/callback/route.ts#L10) |
| `auth.verifyOtp({ type, token_hash })` | Vérifie un lien à usage unique reçu par e-mail (mot de passe oublié…). Marche même sur un autre appareil | [app/auth/confirm/route.ts:13](../app/auth/confirm/route.ts#L13) |
| `auth.resetPasswordForEmail(email)` | Envoie l'e-mail « choisir un nouveau mot de passe » | [lib/auth/password-actions.ts:21](../lib/auth/password-actions.ts#L21) |
| `auth.updateUser({ password })` / `({ data })` | Change le mot de passe, ou écrit dans `user_metadata` | [lib/auth/password-actions.ts:39](../lib/auth/password-actions.ts#L39), [app/espace/tour-actions.ts:9](../app/espace/tour-actions.ts#L9) |
| `auth.refreshSession()` | Renouvelle le jeton tout de suite (pour que le changement qu'on vient de faire y apparaisse) | [app/espace/tour-actions.ts:11](../app/espace/tour-actions.ts#L11) |

### Ce que fait l'admin (clé secrète uniquement)

| Fonction | Ce qu'elle fait | Exemple |
|---|---|---|
| `auth.admin.createUser(…)` | Crée un compte sans e-mail de confirmation | [app/admin/comptes/actions.ts:43](../app/admin/comptes/actions.ts#L43) |
| `auth.admin.deleteUser(id)` | Supprime un compte | [lib/simulation/test-accounts.ts:66](../lib/simulation/test-accounts.ts#L66) |
| `auth.admin.listUsers(…)` | Liste tous les comptes | [lib/admin/accounts.ts:27](../lib/admin/accounts.ts#L27) |
| `auth.admin.getUserById(id)` | Lit un compte précis | [lib/requests/notify-artisan.ts:24](../lib/requests/notify-artisan.ts#L24) |

### `user_metadata` ou `app_metadata` : différence importante

- `user_metadata` : **l'utilisateur peut l'écrire lui-même**. Bon pour « a fini la visite guidée ».
- `app_metadata` : **seule la clé secrète peut l'écrire**. C'est là que vivent `role: "admin"` et `test_account: true`, sinon n'importe qui pourrait se nommer admin. Voir [lib/auth/session.ts](../lib/auth/session.ts).

## 2.3 Database : lire et écrire dans les tables

### La phrase type

```ts
const { data, error } = await supabase
  .from("requests")                       // dans la table requests
  .select("id, status, customer_phone")   // je veux ces colonnes
  .eq("id", requestId)                    // où id = requestId
  .maybeSingle();                         // une seule ligne, ou null
```

On enchaîne les morceaux comme une phrase. **Rien n'est envoyé avant le `await`.**
Toutes les fonctions renvoient `{ data, error }` : Supabase ne plante jamais, il faut **toujours regarder `error`**.

### Les verbes (quoi faire)

| Fonction | SQL équivalent | Exemple |
|---|---|---|
| `.from("table")` | `… FROM table` | partout (141 fois) |
| `.select("a, b")` | `SELECT a, b` | partout |
| `.insert({ … })` | `INSERT INTO` | [lib/telephony/missed-call.ts](../lib/telephony/missed-call.ts) → `createRequestWithLink` |
| `.update({ … })` | `UPDATE … SET` | [app/demande/[token]/actions.ts](../app/demande/[token]/actions.ts) |
| `.delete()` | `DELETE` | [app/espace/devis/actions.ts:291](../app/espace/devis/actions.ts#L291) |
| `.rpc("nom", { … })` | Appelle une **fonction SQL** écrite dans une migration (plusieurs opérations d'un seul coup, sans risque de moitié faite) | [app/espace/devis/actions.ts:149](../app/espace/devis/actions.ts#L149) → `replace_quote_lines` |

Après `insert` ou `update`, ajouter `.select("id")` pour récupérer la ligne créée ou modifiée.

### Les filtres (lesquelles)

| Fonction | Signifie | Exemple |
|---|---|---|
| `.eq("col", v)` | col = v | partout (85 fois) |
| `.neq("col", v)` | col ≠ v | [lib/quotes/queries.ts:62](../lib/quotes/queries.ts#L62) : tout sauf les brouillons |
| `.gt` / `.gte` / `.lt` / `.lte` | > / ≥ / < / ≤ | `missed-call.ts` → `findRecentRequestId` : appels des dernières 24 h |
| `.is("col", null)` | col est vide | [app/demande/[token]/actions.ts](../app/demande/[token]/actions.ts) : lien jamais utilisé |
| `.not("col", "is", null)` | col n'est pas vide | [lib/espace/dashboard.ts:33](../lib/espace/dashboard.ts#L33) |
| `.in("col", [a, b])` | col vaut a ou b | [lib/invoices/queries.ts:58](../lib/invoices/queries.ts#L58) |
| `.order("col", { ascending })` | trier | [app/espace/devis/actions.ts:44](../app/espace/devis/actions.ts#L44) |
| `.limit(n)` | au plus n lignes | [app/espace/devis/actions.ts:46](../app/espace/devis/actions.ts#L46) |

### Combien de résultats

| Fonction | Renvoie | Si 0 ligne |
|---|---|---|
| (rien) | une liste | liste vide |
| `.maybeSingle()` | un objet | `null`, **sans erreur** → « peut ne pas exister » |
| `.single()` | un objet | **une erreur** → « doit exister » |

### Deux astuces de `select`

- **Lire une table liée en même temps** : `.select("id, company:companies(name, owner_id)")` donne `data.company.name`, sans deuxième requête.
  Exemple : [lib/requests/notify-artisan.ts](../lib/requests/notify-artisan.ts).
- **Compter sans rien télécharger** : `.select("id", { count: "exact", head: true })` puis lire `count`.
  Exemple : [app/espace/devis/actions.ts:79](../app/espace/devis/actions.ts#L79).

### Un exemple réel décortiqué : réserver un lien en une seule opération

Tiré de [app/demande/[token]/actions.ts](../app/demande/[token]/actions.ts) :

```ts
const { data: link } = await supabase
  .from("request_links")
  .update({ used_at: now })     // marque le lien « utilisé »…
  .eq("token", token)           // …celui-ci…
  .is("used_at", null)          // …seulement s'il ne l'était pas encore…
  .gt("expires_at", now)        // …et s'il n'a pas expiré
  .select("id, company_id, request_id")
  .maybeSingle();               // null = déjà utilisé ou expiré
```

Vérifier puis modifier **dans la même instruction** évite qu'un double appui sur « Envoyer » crée deux demandes.

## 2.4 Storage : les fichiers

Les fichiers sont rangés dans des « buckets » (dossiers racine) : `request-photos`, logos, `greeting-audio`. Ils sont **privés** : on ne les montre qu'à travers des liens temporaires.

| Fonction | Ce qu'elle fait | Exemple |
|---|---|---|
| `storage.from("bucket")` | Choisir le bucket | partout |
| `.upload(chemin, octets, { contentType })` | Déposer un fichier | [app/demande/[token]/actions.ts](../app/demande/[token]/actions.ts) → `storePhotos` |
| `.createSignedUrl(chemin, secondes)` | Lien d'accès temporaire à un fichier privé | [lib/telephony/greeting-audio.ts](../lib/telephony/greeting-audio.ts) : Twilio lit le message audio |
| `.createSignedUrls([chemins], secondes)` | Pareil pour plusieurs fichiers d'un coup | [app/espace/devis/actions.ts:67](../app/espace/devis/actions.ts#L67) : photos envoyées à l'IA |
| `.list(dossier)` | Lister les fichiers d'un dossier | [lib/company/logo.ts:32](../lib/company/logo.ts#L32) |
| `.remove([chemins])` | Supprimer des fichiers | [lib/company/logo.ts:33](../lib/company/logo.ts#L33) |

Les chemins commencent toujours par l'id de l'entreprise (`companyId/requestId/photo.jpg`) : les règles RLS du Storage s'en servent pour savoir à qui est le fichier.

## 2.5 Les types : TypeScript connaît ta base

- [lib/supabase/database.types.ts](../lib/supabase/database.types.ts) est **généré** par `npm run db:types` à partir de ta vraie base. Ne jamais le modifier à la main.
- `createServerClient<Database>(…)` : grâce à lui, TypeScript sait que `.from("requests")` a une colonne `customer_phone` et te signale une faute de frappe.
- `Tables<"companies">` = le type d'une ligne de la table `companies`. Ex. [app/espace/devis/actions.ts:91](../app/espace/devis/actions.ts#L91).

## 2.6 Ce qui n'est pas dans le code TypeScript

- **Les tables, triggers, fonctions SQL et règles RLS** sont dans [supabase/migrations/](../supabase/migrations/), un fichier par changement, dans l'ordre des dates.
  - `create policy "Owners can read their requests"` = une règle RLS : « un artisan ne lit que les demandes de son entreprise ».
  - `create function public.create_company_on_signup` = le trigger qui crée l'entreprise dès l'inscription.
- **Les réglages du tableau de bord Supabase** (SMTP Brevo, modèles d'e-mail, limites d'envoi) ne sont pas dans le projet. [supabase/config.toml](../supabase/config.toml) ne concerne que la base locale.

---

# Aide-mémoire : où tourne ce code ?

| Je vois… | Ça tourne… | Secrets autorisés ? |
|---|---|---|
| `"use client"` en haut | dans le navigateur | ❌ jamais |
| `"use server"` en haut | sur le serveur, appelable depuis un formulaire | ✅ mais vérifier qui appelle |
| `import "server-only"` | sur le serveur uniquement | ✅ |
| `page.tsx` / `layout.tsx` sans étiquette | sur le serveur (le navigateur reçoit le HTML) | ✅ |
| `route.ts`, `proxy.ts` | sur le serveur | ✅ |
| `createAdminClient()` | sur le serveur, **sans protection RLS** | ✅ mais vérifier le propriétaire soi-même |
