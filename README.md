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
