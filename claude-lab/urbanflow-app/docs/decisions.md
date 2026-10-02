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
- Agent Dify : champ optionnel `donnees_trafic`, délai 30 s, `DEMO_MODE` pour les lignes 8 et 18.
