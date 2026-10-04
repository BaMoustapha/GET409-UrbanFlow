# CLAUDE.md : UrbanFlow

## Présentation
UrbanFlow aide les usagers de Dakar Dem Dikk à anticiper la durée réelle de leur trajet malgré les embouteillages quotidiens. Projet GET409 (Atelier IA), UMEF Swiss University, Dakar. Équipe : Moustapha & Astou.

## Architecture de l'app (ce dossier)
- `public/` : interface en 5 pages avec menu commun (`app.js`, `style.css`, `lignes.json`) :
  - `/` (`index.html`) : landing page classique (barre de navigation, hero avec formulaire départ et arrivée qui ouvre `/trajet?depart=...&arrivee=...` et calcule aussitôt, décor discret baobab et corniche, trois rangées « Comment ça marche » avec aperçus sans donnée réelle, nombre de lignes par catégorie calculé depuis `lignes.json`, engagements de transparence, appel à l'action, pied de page). Un seul bouton principal par écran.
  - `/trajet` (`trajet.html`) : trajet A vers B (carte Leaflet/OpenStreetMap, géolocalisation sur clic, heure de départ, temps voiture TomTom, lignes dont un terminus correspond aux lieux saisis).
  - `/agent` : questions à l'agent Dify, fiche en sections, suggestions. Accepte `?q=` pour une question préremplie.
  - `/lignes` : les lignes de `lignes.json` par catégorie (la catégorie « Rabattement TER » est masquée de tout le site par `chargerLignes()` dans `public/app.js`), sans aucun temps de trajet par ligne.
  - `/a-propos` : sources, limites, confidentialité.
- `lib/core.mjs` : logique serveur partagée (appel Dify, TomTom avec `departAt` pour une heure future, cache mémoire 5 min). Aucune clé dedans, tout vient de `env`.
- `lib/guide.mjs` + `lib/reseau.mjs` : réponses directes sans IA (quelle ligne prendre entre A et B, arrêts d'une ligne) depuis les données du réseau. `reseau.mjs` est généré depuis les CSV de `dify/`, ne pas l'éditer à la main.
- `server.js` : serveur Express local (`npm start`, http://localhost:3000). Sert uniquement `public/`, avec URL propres (`/lignes`).
- Production : https://urbanflow.urbanflow-moustapha.workers.dev/
- `worker.js` + `wrangler.toml` : même API sur Cloudflare Workers (`deployer.bat` pousse aussi les secrets). Worker nommé `urbanflow`.
- Temps de trajet : géré par TomTom, jamais par Dify. Une question de temps citant une ligne (« temps ligne 8 ») est traitée par `reponseTemps()` dans `core.mjs` : temps voiture avec le trafic actuel entre les deux terminus de la ligne, avec message de repli si TomTom est indisponible. La base de connaissance Dify ne contient aucun temps de trajet.
- Routes : `POST /api/analyser-trafic` (temps de ligne par TomTom, guide réseau, sinon Dify, puis Gemini en secours) et `POST /api/trajet` (TomTom : temps voiture, niveau de circulation, incidents routiers).
- Protections des routes : POST seulement, corps de 10 ko maximum, limite par IP (10 questions et 20 trajets par minute : bindings `[[ratelimits]]` de `wrangler.toml` en production, compteur en mémoire dans `server.js`).

## Services externes
- **Dify** : workflow UrbanFlow (RAG sur la base des lignes, Chercheur, SI/SINON, Rédacteur). Entrées : `query` et `donnees_trafic` (optionnelle, 256 caractères max). Sortie à 5 titres : FICHE TRAJET, TEMPS DE TRAJET, ANALYSE, ALERTES, RECOMMANDATIONS. Répond INSUFFISANT quand la donnée manque (anti-hallucination). Modèle actuel : gpt-oss-120b via Groq (comptes Groq parfois suspendus).
- **Gemini (secours)** : `secoursGemini()` dans `core.mjs`, appelé seulement si Dify échoue et si `GEMINI_API_KEY` existe. Ne reçoit que des extraits de `reseau.mjs` (`contexteReseau()`) et les règles du Rédacteur ; pas d'appel si aucun lieu ni ligne n'est reconnu ; `filtrerTemps()` retire tout temps chiffré. Modèle par défaut `gemini-3.5-flash-lite` (`GEMINI_MODEL` pour changer).
- **TomTom** : géocodage (Sénégal) et itinéraire avec trafic, offre gratuite sans carte bancaire. Clé côté serveur uniquement.
- Variables : `DIFY_API_KEY`, `DIFY_API_URL`, `TOMTOM_API_KEY`, `GEMINI_API_KEY` (optionnelle), `GEMINI_MODEL` (optionnelle). Voir `.env.example`. Le mode démo (`DEMO_MODE`) a été retiré : aucune réponse d'exemple ni temps fictif.

## Limites connues
- Aucune donnée en temps réel n'existe pour les bus DDD (rien n'est publié). Le temps affiché dans l'app est celui d'une voiture avec le trafic actuel, et l'interface le dit.
- Aucun temps de trajet par ligne n'est stocké ni affiché (`public/lignes.json` ne contient plus `t8` ni `t18`). Le temps en bus n'est pas publié : le temps affiché est celui d'une voiture, calculé en direct par TomTom.
- Quota Dify : l'abonnement limite les requêtes à la base de connaissance (erreur « rate limit »). `core.mjs` renvoie alors un 429 avec un message clair. Éviter de multiplier les tests de l'agent.
- Le journal de trajets local et la page `/releves` (relevé chronométré envoyé à l'agent via `donnees_trafic`) sont retirés de l'interface pour l'instant. La page est conservée dans `archive/releves.html` : la remettre dans `public/` et dans le menu de `public/app.js` pour la réactiver.

## Dossiers
- `dify/` : base de connaissance Dify (lignes, arrêts, lieux, infos réseau DDD) et archive de l'ancienne base d'affluence (plus utilisée).
- `docs/decisions.md` : décisions techniques par phase et par épisode de l'atelier.
- `docs/audit-securite-*.md` : rapports d'audit sécurité.
- `.claude/agents/securite-urbanflow.md` : sous-agent de relecture sécurité, lecture seule. À lancer avant chaque déploiement.
- `.claude/ralph-brief.md` : règles de la boucle d'amélioration de l'interface (E10).
- Hors de ce dossier : `docs/s3/`, `docs/s4/`, `docs/s5/` (journaux de prompts par séance) à la racine du dépôt.

## Conventions
- Texte en français partout (interface, contenus, documentation).
- Réponses concises, pas de tirets cadratins, pas de récapitulatif non demandé.
- Toute donnée de trafic doit être sourcée : base xlsx ou fichiers `sources-*.md`. Jamais de chiffre inventé.
- Identité visuelle : vert #00A651 (principal), jaune #FDEF42 et rouge #E31B23 (touches ponctuelles uniquement), polices Fraunces (titres) + Poppins (texte). Thème clair ou sombre selon le système, avec bouton-icône (soleil ou lune) de bascule (variables dans `public/style.css`). Pastilles de ligne par catégorie : urbaine vert, banlieue orange, TAF TAF jaune, TER bleu, toujours accompagnées du libellé de catégorie. Le pied de page cite la source officielle (demdikk.sn). Ne pas reprendre le logo ni la charte de DDD.
- Lignes urbaines DDD confirmées à utiliser en priorité : 1, 4, 7, 8, 9, 10, 13, 18, 20, 23, 121.

## Vocabulaire du domaine
- **Ligne urbaine** : trajet DDD à l'intérieur de Dakar (ex. Ligne 1, Parcelles Assainies ↔ Place Leclerc).
- **Circulation** : état de la route donné par TomTom (fluide / dense / très dense / bloqué), affiché en badge de couleur. Ce n'est pas le remplissage des bus : il n'y a plus de notion d'affluence dans l'app.
- **Point noir** : axe routier chroniquement saturé (ex. Patte d'Oie, Colobane).
- **TAF TAF** : navette express aéroport DDD.

## Méthode de travail
- Toute nouvelle donnée de trafic passe par une recherche web sourcée avant d'être ajoutée à la base xlsx.
- Toute évolution du workflow Dify est d'abord testée sur une copie du YAML avant application dans l'éditeur Dify.
- Après chaque modification nécessaire : pousser sur GitHub (code, docs, CLAUDE.md) et mettre à jour Dify (bases de connaissance, workflow) si la modification le concerne. Ne pas attendre une demande.
- Les questions des utilisateurs peuvent être courtes ou mal écrites ("8", "l8 matin", "Ouakam Plateau") : ne jamais exiger de phrase complète.
- Tester en local avec `npm start` et de vraies clés dans `.env` (pas de mode démo). Ménager le quota Dify : le guide réseau et TomTom répondent sans Dify.

## Interdits
- Ne jamais inventer de témoignage usager, de partenariat ou de statistique DDD non sourcée.
- Ne jamais coder en dur une clé API (Dify, TomTom, Gemini, etc.) ni la coller dans le chat : toujours via `.env` ou secrets Cloudflare. Une clé exposée doit être régénérée.
- Ne pas travailler sur les livrables S6 tant que l'équipe ne le demande pas.
- Pas de disponibilité, de retard, de position ni d'incident de bus : aucune source (DDD ne publie aucune donnée de suivi). Seuls le trafic TomTom, les temps calculés en direct par TomTom et les heures de pointe habituelles du réseau sont utilisés. Pas d'affluence : aucune donnée sur le remplissage des bus. Le mot retard ne désigne que le retard dû au trafic.
- Pas de prix de tickets dans la base de connaissance (hors périmètre).

## Recherche Dify (base de connaissance)
- Les segments portent des jetons collés `ligne7`, `ligne18`, `lignet07` : l'index inversé de Dify ignore les mots d'un seul caractère.
- `enrichirRequete()` (lib/core.mjs) envoie une requête compacte (jetons répétés + heures + lieux) quand la question cite une ligne. Les mots courants (ligne, vers, temps) font remonter toutes les lignes.
- Top K de la base lignes : 8. Fichiers et règles d'import dans `dify/README.md`.

## Prochaines étapes possibles
1. Passer le modèle Dify de Groq à Gemini Flash-Lite (le secours côté serveur existe déjà).
2. Relevés chronométrés de bus réels pour alimenter le catalogue et `donnees_trafic`.
3. Déploiement Cloudflare et test de bout en bout avec de vraies clés.
