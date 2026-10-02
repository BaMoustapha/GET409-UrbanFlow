# UrbanFlow app

App locale et Cloudflare : trajet A vers B avec trafic (TomTom), carte et géolocalisation, agent IA Dify, journal de trajets.

## Lancer en local
1. `npm install`
2. Copier `.env.example` en `.env` et remplir `DIFY_API_KEY` et `TOMTOM_API_KEY` (clé gratuite sur developer.tomtom.com, sans carte bancaire).
3. `npm start` puis ouvrir http://localhost:3000 (la géolocalisation marche sur localhost et en https).
- `DEMO_MODE=1` dans `.env` : réponses d'exemple pour les lignes 8 et 18, sans appeler Dify.

## Déployer sur Cloudflare
1. Créer un compte gratuit sur cloudflare.com.
2. Double-cliquer sur `deployer.bat` (le `.env` doit être rempli). Cliquer vite sur « Allow » dans la page qui s'ouvre.
3. Lien public : `https://urbanflow.<sous-domaine>.workers.dev`.

Les clés sont envoyées comme secrets Cloudflare et ne figurent dans aucun fichier du dépôt.

## Structure
- `public/index.html` : interface (carte Leaflet, trajet, lignes, journal, agent).
- `lib/core.mjs` : logique serveur partagée (Dify, TomTom, cache 5 min).
- `server.js` : serveur Express local. `worker.js` + `wrangler.toml` : version Cloudflare.

## Limites
Aucune donnée en temps réel n'existe pour les bus Dakar Dem Dikk : le temps affiché est celui d'une voiture avec le trafic actuel. Les temps des lignes viennent du catalogue (estimations).
