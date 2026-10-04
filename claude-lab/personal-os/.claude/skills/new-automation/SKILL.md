---
name: new-automation
description: Crée une nouvelle automatisation du Personal OS (dossier work/NN-nom avec son CLAUDE.md, son skill et son dossier de sortie). Se lance avec /new-automation suivi de la description.
disable-model-invocation: true
---
# /new-automation

1. Lis la description donnée par Moustapha. Si l'objectif, les entrées ou la sortie manquent, pose une question à la fois.
2. Choisis le numéro suivant dans `work/` et un nom court : `work/NN-nom/`.
3. Crée `work/NN-nom/CLAUDE.md` (60 lignes maximum) : Objectif, Entrées (outils et connecteurs, en précisant lecture seule), Sortie (format, emplacement), Étapes, Règles strictes, Correctifs appris (vide au départ).
4. Crée le skill `.claude/skills/<nom>/SKILL.md` avec `disable-model-invocation: true`, qui dit de lire `work/NN-nom/CLAUDE.md` puis d'exécuter ses étapes.
5. Règles de toute automatisation : lecture seule sur Gmail et Agenda (jamais envoyer, archiver, supprimer, modifier) ; demander avant de créer quoi que ce soit dans Notion ; sorties dans `vault/projects/<nom>/` ou `work/NN-nom/output/` ; mise à jour de `vault/index.md` et `vault/log.md` ; en cas d'erreur, boucle d'auto-correction du CLAUDE.md principal.
6. Ajoute une ligne datée à `vault/log.md` et rappelle de relancer Claude pour que le nouveau skill apparaisse dans le menu `/`.
