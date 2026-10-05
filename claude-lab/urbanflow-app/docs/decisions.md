# Decisions — UrbanFlow (app locale, claude-lab)

## Contexte
Version locale et autonome, complémentaire à l'app Lovable (production). Sert de bac à sable pour tester des idées avant de les porter sur Lovable.

## Choix techniques
- Un seul fichier `index.html` (HTML + CSS + JS inline), pas de build Vite/React : plus simple à exécuter et vérifier depuis cet environnement, aucune dépendance à installer.
- Persistance : `localStorage` du navigateur, aucune donnée envoyée à un serveur, aucun compte requis.
- Données des 11 lignes urbaines DDD : codées en dur dans `LIGNES_DDD` (zone, temps de trajet estimé), reprises de `DakarFlow_Donnees_UrbanFlow.xlsx` et confirmées sur demdikk.sn/info-voyageurs.

## Fonctionnalités Phase 1
1. Bibliothèque des 11 lignes urbaines confirmées, avec zone et temps de trajet estimé.
2. Journal : l'usager ajoute une entrée (ligne, heure, temps observé, affluence ressentie) ; les entrées sont listées, les plus récentes en premier, persistantes après rechargement.

## Non fait (hors scope Phase 1)
- Pas de connexion au workflow Dify (nécessiterait une clé API et un backend, voir `.env.example`).
- Pas de compte ni de synchronisation entre appareils.
- Pas d'affluence en temps réel (donnée manuelle uniquement pour l'instant).

## Phase 2 (2026-10-02)
- Ajout d'un serveur Express (clés Dify et TomTom côté serveur) et d'une version Cloudflare Worker partageant `lib/core.mjs`.
- `index.html` déplacé dans `public/` : seul ce dossier est servi (avant, `.env` était accessible par le navigateur).
- Trajet A vers B : géolocalisation du navigateur, carte Leaflet/OpenStreetMap, TomTom (gratuit) pour le temps voiture avec trafic. Pas de données bus en temps réel (DDD n'en publie pas).
- Agent Dify : champ optionnel `donnees_trafic`, délai 30 s, `DEMO_MODE` pour les lignes 8 et 18 (retiré ensuite : aucune donnée d'exemple dans l'application).

## Phase 3 (2026-10-02 et 2026-10-03)
- Interface en 5 pages au lieu d'une seule : Trajet, Agent IA, Lignes, Relevés terrain, À propos (sans framework ni build : fichiers HTML dans `public/`, `app.js` et `style.css` partagés, menu injecté par `app.js`). Raison : le parcours principal (trajet) reste direct sur `/`, les autres usages ont leur URL partageable.
- Les lignes viennent de `public/lignes.json` (42 lignes, données du projet). La liste codée en dur de la Phase 1 est supprimée : elle contredisait la base maître (par exemple ligne 7 = Ouakam vers Palais 2, pas Pikine).
- Aucun temps en bus n'est affiché par l'application : seulement des temps voiture calculés en direct par TomTom, et la réponse de l'agent. Les temps par ligne (`t8`, `t18`) ont été retirés de `lignes.json` et de l'interface. Quand une donnée manque, l'interface le dit.
- Heure de départ : TomTom `departAt` (de 5 minutes à 7 jours). Les incidents routiers ne sont affichés que pour « maintenant », car ils décrivent le moment présent.
- Le journal de trajets local est supprimé. La page Relevés terrain (relevé chronométré envoyé à l'agent, non enregistré) est retirée de l'interface pour l'instant et conservée dans `archive/releves.html`.
- Page d'accueil : introduction courte avec la limite (pas de données bus en direct) et trois points d'entrée, sans chiffre ni témoignage.
- Quota Dify : une erreur « rate limit » de l'abonnement donne un message clair (HTTP 429). Limitation de débit propre à l'app et cache des réponses de l'agent : à faire.

## Phase 4 (2026-10-03) : plus d'affluence, plus de temps dans la base
- La notion d'affluence (remplissage des bus) est retirée de l'app, de la base Dify et du workflow : aucune source ne la publie. Le badge de couleur montre seulement la circulation TomTom (fluide, dense, très dense, bloqué).
- Les temps de trajet sont retirés de la base de connaissance : ils sont calculés en direct par TomTom (`reponseTemps()` pour « temps ligne 8 », `tempsTrajet()` pour A vers B).
- Réponses sans IA (`lib/guide.mjs`) pour « quelle ligne prendre », « lignes qui desservent un lieu », « arrêts de la ligne N ».
- Note : les phases 1 et 2 ci-dessus décrivent l'état de l'époque (journal local, affluence ressentie, temps codés en dur). Tout cela est retiré.

## 2026-10-04 : E08, protections et bouton « Copier le trajet »
- Quoi : `.gitignore` couvre `.env`, `.env.*` (sauf `.env.example`) et `.dev.vars` (secrets locaux de Wrangler). Règles deny de `.claude/settings.json` étendues à `.dev.vars` et aux lectures de `.env` par le terminal (`cat`, `type`, `Get-Content`, `more`), car `Read(./.env)` seul ne bloque pas une commande Bash.
- Quoi : bouton « Copier le trajet » sur la carte « En voiture » de `/trajet`. Le résumé copié reprend départ, arrivée, temps voiture TomTom (avec et sans trafic), circulation, heure du calcul, lignes DDD possibles et la mention « temps en bus non publié ». Aucune donnée inventée.
- Pourquoi : partager un trajet par WhatsApp ou SMS sans capture d'écran.
- Compromis : l'API presse-papiers exige HTTPS ou localhost ; sinon repli par `execCommand('copy')`, puis message demandant de copier à la main.
- Corrections trouvées pendant l'analyse : un numéro qui fait partie d'un nom de lieu (« Liberté 5 », « Palais 2 », « Rue 11 ») n'est plus pris pour une ligne (`numeroDeLieu()` dans `guide.mjs`, utilisé aussi par `enrichirRequete()`). « , Dakar » n'est plus ajouté deux fois au géocodage des terminus. La suggestion « y a-t-il du monde ? » de la page Agent (question d'affluence) est remplacée.

## 2026-10-04 : E09, Gemini en secours côté serveur
- Quoi : `secoursGemini()` dans `lib/core.mjs`. Quand Dify échoue (clé absente, erreur HTTP, run échoué, quota, délai de 30 s dépassé), l'app appelle Gemini (`generateContent`, modèle `gemini-3.5-flash-lite` par défaut, réglable par `GEMINI_MODEL`). Sans `GEMINI_API_KEY`, le comportement reste celui d'avant (message d'erreur).
- Clé : lue uniquement côté serveur (`.env` en local, secret Cloudflare poussé par `deployer.ps1`). Jamais dans `public/`. Envoyée dans l'en-tête `x-goog-api-key`, pas dans l'URL.
- Règles : le modèle ne reçoit que des extraits de `lib/reseau.mjs` (`contexteReseau()` : ligne citée avec ses arrêts, ou lignes qui desservent les lieux nommés) et les consignes du Rédacteur (5 titres, INSUFFISANT, ni affluence, ni temps, ni donnée inventée). Si aucun lieu ni ligne n'est reconnu, aucun appel : réponse INSUFFISANT directe. Garde-fou `filtrerTemps()` : toute ligne contenant un temps en minutes est retirée.
- Interface : une note signale une réponse de secours.
- Modèle vérifié sur la documentation Google (04/10/2026) : la famille 2.5 est restreinte aux anciens utilisateurs, d'où 3.5 Flash-Lite.
- Test : fausse clé Dify (HTTP 401) et faux serveur Gemini, la réponse arrive avec `source: secours`, le contexte de la ligne 7 est bien transmis, le temps inventé est retiré.

## 2026-10-04 : E14, relecteur sécurité et correctifs
- Quoi : sous-agent `.claude/agents/securite-urbanflow.md` (outils Read, Grep, Glob : il ne modifie rien). Rapport : `docs/audit-securite-2026-10-04.md`.
- Correctifs appliqués (priorité ÉLEVÉ et MOYEN) : limite de requêtes par IP (bindings Cloudflare `[[ratelimits]]`, 10 questions et 20 trajets par minute, et la même chose en mémoire dans `server.js`), corps limité à 10 ko, POST seulement, en-têtes `nosniff` et `no-store` sur l'API.
- Compromis : la limite Cloudflare est comptée par emplacement et n'est pas exacte à la requête près ; elle sert à éviter l'épuisement des quotas, pas à facturer. La limite en mémoire de `server.js` ne vaut que pour le serveur local.
- Clé TomTom collée dans un chat : régénération jugée inutile par Moustapha (04/10), risque accepté. CSP : faite (entrée suivante).

## 2026-10-04 : E10, boucle d'amélioration de l'interface
- Brief : `.claude/ralph-brief.md` ; commande de lancement : `.claude/ralph-commande.txt` (plugin ralph-loop, 2 tours maximum, mot de fin POLISHED).
- Les deux tours ci-dessous ont été faits à la main en suivant le brief (critique sur mobile 375 px en clair et sombre avec captures Playwright, 3 corrections, vérification sans erreur console). Le plugin lui-même se lance dans Claude Code sur le PC. Captures avant/après : `docs/captures/e10/`.

### Ralph round 1
- La page Trajet ne marchait plus du tout si Leaflet (unpkg) ne se chargeait pas : la carte est maintenant facultative, avec un message, et le calcul du trajet reste disponible.
- Lignes proposées sur mobile : le bouton « Durée et circulation » écrasait le nom de la ligne ; la carte de ligne s'empile et le bouton prend toute la largeur.
- Textes d'aide des champs coupés à 375 px : remplacés par des exemples courts (« Ex : Ouakam », « Ex : Plateau »).

### Ralph round 2
- Réponses sans IA (guide réseau, temps TomTom) affichées en un seul bloc de texte : titre en en-tête, un bloc par paragraphe, « Limites » en note discrète.
- Badge de circulation : une phrase l'explique avec le vrai rapport TomTom (« le trafic multiplie le temps sans trafic par 1,62 »).
- Carte indisponible : hauteur réduite pour ne pas laisser un grand vide.
- Non fait : CSP (voir l'audit E14). POLISHED non écrit : la CSP et un test sur un vrai téléphone restent à faire.

## 2026-10-04 : Content-Security-Policy (suite de l'audit E14)
- Quoi : `public/_headers` définit la CSP et les en-têtes de sécurité des pages. Cloudflare l'applique aux fichiers statiques (le fichier lui-même n'est pas servi) ; `server.js` relit le même bloc pour appliquer les mêmes règles en local et renvoie 404 sur `/_headers`.
- Scripts : les 4 scripts inline (accueil, trajet, agent, lignes) sont sortis dans `public/page-*.js`, ce qui permet `script-src 'self' https://unpkg.com` sans `'unsafe-inline'`.
- Compromis : `style-src` garde `'unsafe-inline'` (attributs `style` dans le HTML et styles posés par Leaflet sur la carte) ; le risque est faible, les styles ne pouvant pas exécuter de code.
- Test : les 5 pages sous CSP dans Chromium (375 px), aucune violation ni erreur JavaScript ; calcul de trajet, bouton « Copier le trajet », thème et liste des lignes fonctionnent. Les tuiles OpenStreetMap n'ont pas pu être chargées ici (réseau bloqué) : à confirmer après déploiement.

## 2026-10-04 : tests automatiques et mise en ligne par GitHub Actions
- Quoi : `npm test` (8 tests, `node:test`, aucun appel réseau) et le workflow `.github/workflows/urbanflow.yml` : tests et `wrangler deploy --dry-run` à chaque push ou pull request, puis mise en ligne sur `main` et vérification du site (accueil et « arrêts ligne 7 »).
- Pourquoi : déployer sans dépendre du PC ni de `deployer.bat`, et ne jamais mettre en ligne une version qui casse les règles (clé, affluence, script inline).
- Clés : secrets GitHub uniquement (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, puis les clés de l'app). Seuls les secrets remplis sont envoyés au Worker ; les autres gardent leur valeur actuelle.
- Compromis : le jeton Cloudflare est stocké chez GitHub ; il doit être limité au droit « Edit Cloudflare Workers » sur ce compte.

## 2026-10-04 : lignes « A vérifier » confrontées aux sources officielles
- Sources : page « Réseau urbain » de demdikk.sn (listes d'arrêts officielles, consultée le 04/10/2026) et communiqué DDD sur la ligne 06 relayé par Senego (08/07/2026).
- Résolues (6) : lignes 4, 10 et 13 (le terminus « Liberté 5 » est la Gare Dieuppeul, écrit « Terminus Liberté 5 (Dieuppeul) » par DDD : trajet noté « Liberté 5 (Dieuppeul) ») ; ligne 23 (arrivée Palais 2 selon la liste d'arrêts officielle et les captures, même si le titre officiel dit Palais 1) ; ligne 6 (Guédiawaye - Palais 1 depuis juillet 2026, comme les arrêts capturés) ; ligne 319 (présente sur la liste officielle du réseau urbain).
- Toujours à vérifier (10) : 121 (Scat Urbam ou HLM Grand Yoff au départ), 5, 18, 20, 213, 218, 220, T05, T07, T08. Ces cas demandent un relevé sur le terrain ou une source qui n'est pas publiée en ligne.
- Fichiers mis à jour : `dify/urbanflow_lignes_complet.csv`, `dify/urbanflow_kb_lignes.md` (lignes « Vérifié : » avec la source), `lib/reseau.mjs`, `public/lignes.json`.
- Dify : `urbanflow_kb_lignes.md` doit être réimporté dans la base des lignes (mêmes réglages : séparateur `\n\n`, 1024 caractères, mode Économique). Pas fait : demande un navigateur connecté au compte Dify.

## 2026-10-05 : bouton « Copier le trajet » retiré
- Retiré à la demande de Moustapha : bouton, fonctions `resumeTrajet()` et `copierTrajet()` de `public/page-trajet.js`, et styles `.copie` / `.copie-etat`. Le reste de E08 (protections, correction de la détection de ligne) est conservé.

## 2026-10-05 : E08, test de protection échoué puis corrigé
- Constat : lancé depuis `urbanflow-mvp` (dossier parent), Claude a lu deux fichiers `.env` et en a décrit le contenu (longueur et forme des clés). Cause : une règle `Read(./.env)` ne vise que le `.env` du dossier où Claude est lancé, et les réglages de `urbanflow-app/.claude/` ne sont pas chargés quand Claude démarre ailleurs.
- Correctif : règles `Read(**/.env)`, `Read(**/.env.*)`, `Edit(...)` et `.dev.vars` à toute profondeur, dans `urbanflow-app`, `11-agent`, `personal-os` et à la racine du dépôt (`.claude/settings.json`). Ces règles couvrent aussi `cat`, `head`, `tail` dans le terminal. Protection globale recommandée sur le PC : `Read(//**/.env)` et `Read(//**/.env.*)` dans `%USERPROFILE%\.claude\settings.json`, valable dans tous les dossiers.
- Limite connue : un script Python ou Node qui ouvre lui-même un fichier n'est pas bloqué par ces règles (seul le sandbox de Claude Code le bloque).

## 2026-10-05 : correctifs de l'audit sécurité (relecture par le sous-agent securite-urbanflow)
- Déploiement (`.github/workflows/urbanflow.yml`) : le déploiement n'est plus annulé par un nouveau push (groupe `urbanflow-deploiement`, `cancel-in-progress: false`) ; le jeton Cloudflare n'est donné qu'aux étapes `wrangler` (pas à `npm ci`) ; délais d'étape ajoutés. L'étape de vérification échoue maintenant si le site en ligne n'est pas la nouvelle version : `/page-trajet.js` en 200, en-tête CSP présent, guide réseau, un 429 après au plus 25 questions vides (400, sans appel externe), et un POST `text/plain` refusé. Rejouée contre l'ancienne production, elle échoue sur 3 contrôles : l'ancienne version ne passait plus pour verte.
- Worker : corps lu en flux avec plafond de 10 ko même sans `Content-Length` ; `Content-Type: application/json` exigé (415 sinon) ; avertissement dans les journaux si les bindings de limite sont absents. Les messages « Clé Dify absente » et « clé TomTom manquante » ne sont plus renvoyés au navigateur (message générique, 503 pour Dify).
- Données : `dify/urbanflow_kb_affluence.md` déplacé dans `dify/archive/` (plus au niveau des fichiers importables). Le test `npm test` contrôle maintenant les fichiers importables de `dify/` (ni affluence ni clé) et l'absence de message de configuration dans les réponses. 11 tests.
- Non fait, à décider : règles deny de `.claude/settings.json` (`cat`, `.dev.vars` côté terminal, `Select-String`, etc.), régénération de la clé TomTom (risque accepté le 04/10), nuance « non disponible dans UrbanFlow » dans `dify/urbanflow_kb_infos_ddd.md` (puis réimport Dify), actions GitHub figées par SHA, `?q=` qui lance un appel sans clic.
- Cause de la production périmée : non établie depuis le dépôt. À lire dans l'onglet Actions du dépôt (étape en échec, approbation de l'environnement `production`, compte de `CLOUDFLARE_ACCOUNT_ID`).

## 2026-10-05 : Ralph round 1 : ce qui a changé
- Constat (375/360 px, thèmes clair et sombre) : aucun débordement horizontal ; les 5 pages répondent 200 sans erreur de console. Problèmes trouvés : liens de texte et de pied de page de 18 à 28 px de haut (cible tactile sous 44 px), anneau de focus jaune invisible sur fond clair, texte indicatif des champs trop pâle en thème clair (`#9AAA9C` sur blanc).
- Corrigé dans `public/style.css` uniquement : cibles de 44 px minimum (logo, bouton du menu, liens du pied de page, liens des notes et des rangées de la landing) ; focus vert foncé `#00753A` en thème clair ; `::placeholder` en `var(--muted)`.
- Reste (faible impact) : texte de 13 px des `.note` ; hiérarchie des cartes de résultats de `/trajet` non revue avec de vraies données TomTom.
