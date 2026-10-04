# BAG Facture — SaaS

Devis, factures et proformas générés depuis Telegram. **Un bot par client**, PDF générés sans Chromium
(`@react-pdf/renderer`), 3 modèles personnalisables (couleurs, logo, signature), données dans Supabase,
sauvegardes de la base sur un Drive central.

```
Client ──(Telegram)──► son bot ──► /api/webhook/<bot_id> ──► Supabase (documents, compteurs, sessions)
                                         │                └─► PDF (react-pdf) + aperçu PNG ──► chat + canal privé du client
Dashboard (Next.js) ──► /api/org, /api/preview, /api/bot/connect, /api/documents…
Cron nuit ──► /api/cron/archive ──► Drive (.jsonl.gz + registre .csv) ──► allègement de la base
```

## Mise en route

1. **Supabase** : créez un projet, exécutez `supabase/migrations/001_init.sql` (SQL Editor).
   *Authentication → URL Configuration* : Site URL = votre `APP_URL`, et ajoutez `APP_URL/dashboard` aux Redirect URLs.
   Copiez l'URL et les clés (anon + service_role).
   **Pour tester en local sans configurer d'envoi d'e-mail** : *Authentication → Providers → Email* → désactivez
   « Confirm email ». La connexion se fait par e-mail + mot de passe (pas de lien magique) : un compte créé est donc
   utilisable immédiatement, sans qu'aucun e-mail ait besoin de partir.
2. **Variables** : copiez `.env.example` vers `.env.local` et remplissez-le. `ENCRYPTION_KEY` : `openssl rand -base64 32`.
   `CRON_SECRET` : `openssl rand -hex 24`.
3. **Local** : `npm install && npm run dev`. Telegram exige une URL https publique pour le webhook :
   déployez sur Vercel (mêmes variables dans *Settings → Environment Variables*) ou utilisez un tunnel.
4. **Drive d'archives** (facultatif au début, à faire avant que la base grossisse) :
   Google Cloud → activer l'API Drive → identifiant OAuth « Application Web » avec l'URI de redirection
   `http://localhost:53682/callback` → écran de consentement **publié « En production »** (en mode Test, le refresh token
   expire au bout de 7 jours). Puis `npm run google-token` : le script affiche `GOOGLE_REFRESH_TOKEN` et
   `DRIVE_ROOT_FOLDER_ID` (il crée le dossier « Archives BD » lui-même, obligatoire avec le scope `drive.file`).

## Pages

- `/` — page d'accueil publique (présentation, tarifs, liens vers `/login`).
- `/login` — connexion / inscription par e-mail + mot de passe (`?mode=signup` ouvre directement l'inscription).
- `/reset-password` — arrivée depuis le lien « mot de passe oublié ».
- `/dashboard` — protégé : redirige vers `/login` si aucune session.

## Parcours d'un client

1. Compte créé sur `/login` → onglet **Entreprise** (nom, logo, signature, modes de paiement, TVA/termes par défaut).
2. Onglet **Modèle** : 3 modèles × couleurs, aperçu en direct généré par le vrai moteur PDF.
3. Onglet **Bot Telegram** : il crée son bot avec @BotFather, colle le token (chiffré AES-256-GCM en base), le webhook est branché
   avec un secret propre. Il ouvre le lien d'association (usage unique) : seuls les chats liés peuvent utiliser le bot.
4. Facultatif : canal privé + bot administrateur ⇒ le bot détecte le canal (`my_chat_member`) et y range chaque PDF.
5. Dans Telegram : `/devis`, `/facture`, `/proforma`, ou un message libre (« Devis pour M. Sawadogo, … Diagnostic 25000 »).
6. Onglet **Aperçu** : documents et chiffre d'affaires du mois, activité des 8 dernières semaines, derniers documents.

## Cache des aperçus de modèles

`/api/preview` évite de regénérer le PDF + PNG à chaque appel pour les 6 palettes prédéfinies (× 3 modèles = 18
combinaisons par organisation) : le résultat est mis en cache dans le bucket Storage `previews` (migration
`003_preview_cache.sql`), sous une clé qui inclut une empreinte des champs qui influencent le rendu (logo, nom,
adresse, paiements...) — modifiez votre profil et le cache se renouvelle tout seul, sans purge à gérer. Les couleurs
personnalisées (sélecteur libre) ne sont jamais mises en cache : ce cas est plus rare et moins prévisible, elles
continuent d'être générées à la volée.

## Corrections UX/UI (landing)

- **Ancres sous la barre collante** : `scroll-padding-top` sur `html` — les liens "Comment ça marche" etc. ne
  cachent plus le début de la section derrière la barre de navigation.
- **Illustration héros sur mobile** : le téléphone et la carte de devis, positionnés en absolu avec des largeurs
  fixes, se chevauchaient et pouvaient déborder sous ~640px de large. La carte de devis est masquée et le téléphone
  recentré sur mobile.
- **Contenu invisible sans JavaScript** : les sections à apparition au défilement (`data-reveal`) partent à
  `opacity: 0` en attendant l'animation. Un repli `<noscript>` dans `app/layout.jsx` force leur visibilité si le
  JavaScript ne s'exécute pas (réseau qui coupe le chargement, script bloqué).
- **Lien d'évitement** (`Aller au contenu`) pour la navigation clavier, visible seulement au focus.

## Six améliorations complémentaires

- **Limite de débit sur `/api/preview`** : 20 générations réelles (hors cache) par minute et par organisation
  (`preview_rate_limits`, fonction SQL `bump_preview_rate`). Au-delà, erreur 429 claire plutôt qu'une facture
  serveur qui grimpe silencieusement.
- **Avertissement avant la coupure** : le bot prévient dans Telegram au document où il ne reste plus qu'un
  document gratuit, puis au document qui atteint la limite — au lieu de laisser le client le découvrir en
  bloquant sur le document suivant.
- **Image de partage (Open Graph)** : `app/opengraph-image.jsx`, générée à la volée (next/og), sans dépendance
  à une police externe ou à un emoji (rendu garanti). `metadataBase` (variable `APP_URL`) doit être correct en
  production pour qu'elle s'affiche dans les aperçus de lien.
- **Point de contrôle de santé public** : `GET /api/health`, sans authentification, pensé pour un service de
  supervision externe (UptimeRobot ou équivalent) — renvoie 503 si la base est injoignable.
- **Documents : filtre par période + pagination** (20 par page) en plus de la recherche par nom/numéro.
- **Export CSV à la demande** (`/api/documents/export?from=&to=`), bouton dans l'onglet Documents — indépendant
  de l'archivage automatique mensuel, pour une période choisie librement.

## Fiabilité (webhooks, tests, cron)

- **Déduplication des webhooks Telegram** : chaque `update_id` reçu est enregistré (table `processed_updates`,
  migration `004_ops.sql`) ; un même update rejoué par Telegram (réseau coupé juste après notre réponse) est
  ignoré au lieu de générer le document une seconde fois. Purgé automatiquement après 2 jours par le cron.
- **Tests automatisés** (`npm test`, Node natif — `node --test`, aucune dépendance ajoutée) : 23 tests sur la
  logique la plus sensible aux régressions silencieuses — calcul des totaux/TVA, couleurs des PDF (contraste,
  repli), extraction du texte libre du bot, cohérence des modèles/palettes déclarés, clés du cache d'aperçu.
  Portée assumée : logique pure uniquement — le flux complet du bot Telegram et les intégrations (Supabase,
  Drive) ne sont pas couverts par des tests automatisés, seulement vérifiés manuellement pendant le développement.
- **Historique du cron d'archivage** (table `cron_runs`) : chaque exécution nocturne enregistre son résultat
  (succès/échec, détail), visible dans `/admin`. Si `ALERT_TELEGRAM_BOT_TOKEN` et `ALERT_TELEGRAM_CHAT_ID` sont
  renseignés (un bot Telegram distinct des bots clients, pour vous seul), un échec envoie aussi un message —
  sinon rien ne se passe, c'est facultatif.

## Panneau admin (/admin)

Réservé à l'équipe : accès limité aux e-mails listés dans `ADMIN_EMAILS` (séparés par des virgules), vérifié à
la fois côté serveur (chaque route `/api/admin/*`) et côté client. Deux onglets :
- **Organisations** : toutes les organisations, forfait, bot connecté, activité et chiffre d'affaires du mois —
  avec un bouton pour **passer une organisation en forfait payant ou revenir au gratuit**, le seul geste manquant
  pour que le paiement manuel (en attendant une intégration Mobile Money) soit vraiment utilisable au quotidien.
- **Santé du cron** : les 20 dernières exécutions de l'archivage, succès ou échec en un coup d'œil.

## Landing page (réécriture)

Même contenu, réécrit proprement avec des animations pensées par section plutôt qu'un simple fondu générique :
le bloc héros apparaît en cascade (badge → titre → texte → boutons → repères de confiance), l'illustration
téléphone + carte de devis arrive avec un léger décalage, les grilles (étapes, fonctionnalités, tarifs) font
apparaître leurs cartes une à une, et les cartes de fonctionnalités/tarifs réagissent légèrement au survol.
Le repli `<noscript>` et `scroll-padding-top` du tour précédent sont conservés.

## Animations (motion.dev)

La bibliothèque `motion` (ex-Framer Motion) est utilisée avec parcimonie : notifications qui glissent/s'estompent,
tiroir de navigation mobile qui coulisse, transition légère entre les onglets du tableau de bord, apparition au
défilement des sections de la page d'accueil. Tout passe par `<MotionConfig reducedMotion="user">` dans
`app/layout.jsx`, qui respecte automatiquement le réglage "mouvement réduit" du système — rien à gérer au cas par cas.

## Identité visuelle

L'application (landing, connexion, tableau de bord) suit une palette bleue moderne (fond gris-bleu clair, cartes
blanches arrondies, ombres douces, bandeaux marine, badges d'icônes colorés), sur Inter. **Les documents PDF générés
(devis/factures/proformas) gardent leur propre identité** (3 modèles Moderne/Classique/Sobre, indépendante de l'appli
web) — ce n'est pas ce qui a changé ici ; si vous voulez aussi retravailler les modèles de documents, dites-le.

## Interface

- **Navigation** : barre latérale fixe sur grand écran, tiroir coulissant (menu ☰) sur mobile — plus de barre d'onglets qui déborde.
- **Chargement** : squelettes (silhouettes grises animées) à la place de "Chargement…", pour chaque liste et bloc de statistiques.
- **Retours d'action** : notifications (coin bas-droit sur desktop, bas de l'écran sur mobile) au lieu de texte qui reste collé sous les boutons ; les boutons eux-mêmes passent au participe présent pendant l'action ("Enregistrer" → "Enregistrement…").

## Archivage et allègement de la base

Chaque nuit, pour les documents plus vieux que `ARCHIVE_AFTER_MONTHS` (3 mois si la base dépasse 70 % de `DB_LIMIT_BYTES`) :
un fichier `AAAA-MM_documents.jsonl.gz` et un `AAAA-MM_registre.csv` par organisation et par mois
(`Archives BD/<slug>/<année>/`). Drive doit confirmer taille et MD5 avant que la base marque quoi que ce soit.
Sept jours plus tard, le détail (`payload`) est retiré ; **la fiche reste** (numéro, date, client, total, référence Telegram).
Les compteurs de numérotation ne sont jamais purgés. Les archives ne contiennent aucun secret.

## Ce qui a changé par rapport à BAG-FACTURE

- Plus de Chromium ni de Redis ; sessions du bot dans Postgres. Format **A4** (au lieu de 1080×1350), pagination automatique
  (plus de limite « 9/12/18 lignes »), en-tête de colonnes répété sur chaque page.
- Plus aucune donnée d'entreprise en dur (RCCM, IFU, compte bancaire…) : tout vient du profil de chaque client.
  Pour B.A.G, créez simplement son compte comme premier client.
- Numérotation identique (`0000007-09/26`), par organisation, type et année, via une fonction SQL atomique.

## À vérifier au premier déploiement

- **Aperçu PNG** (pdfjs + `@napi-rs/canvas`) : testé en local dans le runtime Next ; contrôlez-le une fois sur Vercel.
  En cas d'échec, le bot envoie le PDF seul.
- **Vercel Hobby** : réservé à un usage non commercial et les crons y sont au plus quotidiens ; prévoyez Pro pour un SaaS payant.
- **E-mails de connexion** : le SMTP intégré de Supabase est très limité en volume ; configurez un SMTP dédié avant d'ouvrir au public.
- **Projet Supabase gratuit** : mis en pause après une période d'inactivité ; le cron quotidien génère de l'activité.
- **Protection des données** : vous hébergez des données de vos clients et de leurs clients ; vérifiez vos obligations locales.

## Forfait gratuit et restauration d'archive

- **Quota** : `FREE_MONTHLY_LIMIT` (5 par défaut, dans `lib/meta.js`) documents/mois pour les organisations en `plan = 'free'`.
  Vérifié dans le bot juste avant génération (le brouillon n'est pas perdu si la limite est atteinte). Passage en `plan = 'pro'`
  (illimité) : à faire manuellement en base pour l'instant, aucune intégration Mobile Money automatisée n'est branchée —
  l'onglet **Forfait** affiche un lien de contact optionnel (`NEXT_PUBLIC_UPGRADE_CONTACT_URL`).
- **Restauration** : l'onglet Documents liste les mois archivés et permet de restaurer leur détail (bouton "Restaurer") :
  télécharge le `.jsonl.gz` du mois, le décompresse, et redonne son `payload` à chaque document déjà archivé.

## Pas encore fait

Paiement Mobile Money automatisé (CinetPay/PayDunya), équipe multi-utilisateurs sur le dashboard, WhatsApp.
