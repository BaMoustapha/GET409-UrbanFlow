# .claude/ralph-brief.md : amélioration de l'interface UrbanFlow

Chaque tour :
1. Critiquer l'interface sur mobile (375 px) puis sur ordinateur, en thème clair et sombre, avec la skill frontend-design : lisibilité, contraste, taille des zones cliquables (44 px minimum), clarté du badge de circulation, états de chargement, vide et erreur.
2. Lister les problèmes, les classer par impact et effort, corriger les 3 plus importants.
3. Vérifier que l'app démarre (`npm start`) et que les pages /, /trajet, /agent, /lignes et /a-propos s'affichent sans erreur dans la console.
4. Ajouter dans docs/decisions.md une entrée datée « Ralph round N : ce qui a changé ».

Niveau attendu : un vrai produit, pas une démo. Hiérarchie claire, espacements réguliers, rien qui déborde à 360 px, identité visuelle de CLAUDE.md respectée (vert #00A651, Fraunces et Poppins).

Interdit : toucher à lib/, server.js, worker.js, wrangler.toml, aux clés et aux fichiers .env ; inventer des données (pas d'affluence, pas de position de bus, pas de temps en bus, pas de témoignage ni de chiffre non sourcé).

Écris POLISHED seulement quand tout le niveau attendu est atteint et que l'app démarre.
