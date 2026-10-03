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

## Phase 3 (2026-10-02 et 2026-10-03)
- Interface en 5 pages au lieu d'une seule : Trajet, Agent IA, Lignes, Relevés terrain, À propos (sans framework ni build : fichiers HTML dans `public/`, `app.js` et `style.css` partagés, menu injecté par `app.js`). Raison : le parcours principal (trajet) reste direct sur `/`, les autres usages ont leur URL partageable.
- Les lignes viennent de `public/lignes.json` (42 lignes, données du projet). La liste codée en dur de la Phase 1 est supprimée : elle contredisait la base maître (par exemple ligne 7 = Ouakam vers Palais 2, pas Pikine).
- Aucun temps en bus n'est affiché par l'application : seulement des temps voiture calculés en direct par TomTom, et la réponse de l'agent. Les temps par ligne (`t8`, `t18`) ont été retirés de `lignes.json` et de l'interface. Quand une donnée manque, l'interface le dit.
- Heure de départ : TomTom `departAt` (de 5 minutes à 7 jours). Les incidents routiers ne sont affichés que pour « maintenant », car ils décrivent le moment présent.
- Le journal de trajets local est supprimé. La page Relevés terrain (relevé chronométré envoyé à l'agent, non enregistré) est retirée de l'interface pour l'instant et conservée dans `archive/releves.html`.
- Page d'accueil : introduction courte avec la limite (pas de données bus en direct) et trois points d'entrée, sans chiffre ni témoignage.
- Quota Dify : une erreur « rate limit » de l'abonnement donne un message clair (HTTP 429). Limitation de débit propre à l'app et cache des réponses de l'agent : à faire.
