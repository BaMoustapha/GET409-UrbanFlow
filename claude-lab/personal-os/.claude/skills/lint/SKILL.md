---
name: lint
description: Contrôle la santé du vault (liens cassés, pages orphelines, doublons, pages sans source, index incomplet) et propose les corrections. Se lance avec /lint.
disable-model-invocation: true
---
# /lint

Vérifie, sans rien modifier d'abord :
1. Liens `[[...]]` qui pointent vers une page inexistante.
2. Pages absentes de `vault/index.md`, et lignes de l'index vers des pages supprimées.
3. Pages orphelines (aucun lien entrant).
4. Doublons probables (même personne ou organisation sous deux noms).
5. Pages sans ligne `Sources :`.
6. Données sensibles (numéros de pièce, de carte, de compte, mots de passe).

Rapport : un tableau (problème, page, correction proposée). Applique les corrections seulement après accord, puis ajoute une ligne datée à `vault/log.md`. Ne touche jamais à `vault/sources/`.
