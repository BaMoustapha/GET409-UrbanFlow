# CLAUDE.md : UrbanFlow

## Présentation
UrbanFlow aide les usagers de Dakar Dem Dikk à anticiper la durée réelle de leur trajet malgré les embouteillages quotidiens. Projet GET409 (Atelier IA), UMEF Swiss University, Dakar. Équipe : Moustapha & Astou.

## Architecture de l'app (ce dossier)
- `public/index.html` : interface unique (carte Leaflet/OpenStreetMap, géolocalisation, trajet A vers B, lignes, journal local, agent IA).
- `lib/core.mjs` : logique serveur partagée (appel Dify, TomTom, cache mémoire 5 min). Aucune clé dedans, tout vient de `env`.
- `server.js` : serveur Express local (`npm start`, http://localhost:3000). Sert uniquement `public/`.
- `worker.js` + `wrangler.toml` : même API sur Cloudflare Workers (`deployer.bat` pousse aussi les secrets). Worker nommé `urbanflow`.
- Routes : `POST /api/analyser-trafic` (Dify) et `POST /api/trajet` (TomTom).

## Services externes
- **Dify** : workflow UrbanFlow (RAG sur 2 bases, Chercheur, SI/SINON, Rédacteur). Entrées : `query` et `donnees_trafic` (optionnelle, 256 caractères max). Sortie à 5 titres : FICHE TRAJET, TEMPS DE TRAJET, ANALYSE, ALERTES, RECOMMANDATIONS. Répond INSUFFISANT quand la donnée manque (anti-hallucination). Modèle actuel : gpt-oss-120b via Groq (comptes Groq parfois suspendus, prévoir Gemini Flash-Lite avec une clé AI Studio personnelle).
- **TomTom** : géocodage (Sénégal) et itinéraire avec trafic, offre gratuite sans carte bancaire. Clé côté serveur uniquement.
- Variables : `DIFY_API_KEY`, `DIFY_API_URL`, `TOMTOM_API_KEY`, `DEMO_MODE` (1 = réponses d'exemple lignes 8 et 18, sans Dify). Voir `.env.example`.

## Limites connues
- Aucune donnée en temps réel n'existe pour les bus DDD (rien n'est publié). Le temps affiché dans l'app est celui d'une voiture avec le trafic actuel, et l'interface le dit.
- Les temps par ligne viennent du catalogue (`dify/urbanflow_lignes_catalogue.csv`), ce sont des estimations.

## Dossiers
- `dify/` : bases de connaissance Dify (catalogue des lignes, affluence type, base xlsx maître, 11 feuilles).
- `docs/decisions.md` : décisions techniques par phase.
- Hors de ce dossier : `docs/s3/`, `docs/s4/`, `docs/s5/` (journaux de prompts par séance) à la racine du dépôt.

## Conventions
- Texte en français partout (interface, contenus, documentation).
- Réponses concises, pas de tirets cadratins, pas de récapitulatif non demandé.
- Toute donnée de trafic doit être sourcée : base xlsx ou fichiers `sources-*.md`. Jamais de chiffre inventé.
- Identité visuelle : vert #00A651 (principal), jaune #FDEF42 et rouge #E31B23 (touches ponctuelles uniquement), polices Fraunces + Work Sans.
- Lignes urbaines DDD confirmées à utiliser en priorité : 1, 4, 7, 8, 9, 10, 13, 18, 20, 23, 121.

## Vocabulaire du domaine
- **Ligne urbaine** : trajet DDD à l'intérieur de Dakar (ex. Ligne 1, Parcelles Assainies ↔ Place Leclerc).
- **Affluence** : niveau d'occupation estimé d'une ligne (fluide / dense / saturé).
- **Point noir** : axe routier chroniquement saturé (ex. Patte d'Oie, Colobane).
- **TAF TAF** : navette express aéroport DDD.

## Méthode de travail
- Toute nouvelle donnée de trafic passe par une recherche web sourcée avant d'être ajoutée à la base xlsx.
- Toute évolution du workflow Dify est d'abord testée sur une copie du YAML avant application dans l'éditeur Dify.
- Tester en local avec `DEMO_MODE=1` avant de brancher les vraies clés.

## Interdits
- Ne jamais inventer de témoignage usager, de partenariat ou de statistique DDD non sourcée.
- Ne jamais coder en dur une clé API (Dify, TomTom, Gemini, etc.) ni la coller dans le chat : toujours via `.env` ou secrets Cloudflare. Une clé exposée doit être régénérée.
- Ne pas travailler sur les livrables S6 tant que l'équipe ne le demande pas.

## Prochaines étapes possibles
1. Passer le modèle Dify de Groq à Gemini Flash-Lite.
2. Relevés chronométrés de bus réels pour alimenter le catalogue et `donnees_trafic`.
3. Déploiement Cloudflare et test de bout en bout avec de vraies clés.
