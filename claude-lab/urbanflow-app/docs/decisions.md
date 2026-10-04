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
- Reste à faire : régénérer la clé TomTom (fuite dans un chat), ajouter une CSP.

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
