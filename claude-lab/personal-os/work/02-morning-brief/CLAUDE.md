# work/02-morning-brief : CLAUDE.md

## Objectif
Un résumé de la journée, lisible en moins de 3 minutes, avant d'ouvrir l'ordinateur.

## Entrées (lecture seule)
- Gmail : emails non lus des 12 dernières heures (`is:unread newer_than:12h`).
- Google Agenda : événements du jour.
- Notion : pages des projets liés aux emails et aux événements.
- `SOUL.md` : les 5 priorités classées, pour noter chaque élément.

## Sortie
Quatre sections : **Urgent** · **Aujourd'hui** · **Contexte** · **FYI**. Pour chaque élément : une ligne, la source (email, agenda, Notion) et pourquoi il est classé là.
- Fichier : `vault/projects/morning-brief/AAAA-MM-JJ.md`
- Copie : une page dans la base Notion « Daily briefs », titre « Daily brief AAAA-MM-JJ ».

## Étapes
1. Lire `SOUL.md` et `vault/errors.md`.
2. Récupérer emails, événements, pages Notion (lecture seule).
3. Noter chaque élément selon les priorités ; regrouper les doublons (même sujet par email et agenda).
4. Écrire le brief (fichier puis page Notion).
5. Nouvelles personnes : `vault/people/` ; nouvelles organisations : `vault/business/`.
6. Mettre à jour `vault/index.md` et `vault/log.md`.

## Règles strictes
- Jamais envoyer, répondre, archiver, marquer comme lu, supprimer un email. Jamais créer ni modifier un événement.
- Demander avant de créer la base Notion « Daily briefs ».
- Ne recopier aucune donnée sensible (codes, numéros de compte, mots de passe) ; résumer sans citer.

## Correctifs appris
- (vide : chaque correctif est ajouté ici et dans `vault/errors.md`)
