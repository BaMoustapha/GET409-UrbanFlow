# UrbanFlow app

App locale et Cloudflare : trajet A vers B avec trafic (TomTom), carte et géolocalisation, lignes Dakar Dem Dikk, agent IA Dify.

Production : https://urbanflow.urbanflow-moustapha.workers.dev/

## Pages
- `/` : trajet A vers B (carte, temps voiture, heure de départ, circulation, incidents, lignes dont un terminus correspond).
- `/agent` : questions à l'agent.
- `/lignes` : les lignes du réseau (`public/lignes.json`).
- `/a-propos` : sources, limites, confidentialité.

## Lancer en local
1. `npm install`
2. Copier `.env.example` en `.env` et remplir `DIFY_API_KEY` et `TOMTOM_API_KEY` (clé gratuite sur developer.tomtom.com, sans carte bancaire).
3. `npm start` puis ouvrir http://localhost:3000 (la géolocalisation marche sur localhost et en https).
- `DEMO_MODE=1` dans `.env` : réponses d'exemple pour les lignes 8 et 18, sans appeler Dify.

## Déployer sur Cloudflare
1. Créer un compte gratuit sur cloudflare.com.
2. Première fois : double-cliquer sur `deployer.bat` (le `.env` doit être rempli). Cliquer vite sur « Allow » dans la page qui s'ouvre. Il déploie et envoie les clés comme secrets.
3. Mises à jour du code : `npm run deploy` (les secrets sont conservés).

Les clés sont envoyées comme secrets Cloudflare et ne figurent dans aucun fichier du dépôt.

## Structure
- `public/` : interface (`index.html`, `agent.html`, `lignes.html`, `a-propos.html`, `app.js`, `style.css`, `lignes.json`).
- `lib/core.mjs` : logique serveur partagée (Dify, TomTom, cache 5 min). `lib/guide.mjs` et `lib/reseau.mjs` : réponses directes du guide réseau.
- `server.js` : serveur Express local. `worker.js` + `wrangler.toml` : version Cloudflare.
- `archive/` : pages retirées pour l'instant (relevés terrain).
- `dify/` : bases de connaissance de l'agent.

## Limites
Aucune donnée en temps réel n'existe pour les bus Dakar Dem Dikk : le temps affiché est celui d'une voiture avec le trafic estimé par TomTom. Les temps par ligne de `lignes.json` sont des temps voiture relevés, jamais des temps en bus. L'abonnement Dify limite le nombre de requêtes à la base de connaissance : l'interface affiche un message clair quand la limite est atteinte.
