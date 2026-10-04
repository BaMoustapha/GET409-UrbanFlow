# personal-os : agent personnel (E12) et brief du matin (E13)

Structure de l'agent personnel du cours (SOUL.md, CLAUDE.md, vault, skills), adaptée à Moustapha. Le contenu personnel ne quitte jamais le PC : `SOUL.md`, `vault/` et les sorties sont ignorés par git (dépôt public).

## E12 (PowerShell, dans ce dossier)
1. `claude`, puis `/setup` : crée le vault local et t'interviewe (10 questions maximum) pour remplir SOUL.md.
2. Copie ton CV (sans téléphone, adresse ni numéro de pièce) dans `vault\sources\cv.pdf`, puis `/ingest vault/sources/cv.pdf`.
3. Obsidian : « Open folder as vault », `vault`, puis le graphe.
Preuves : SOUL.md, capture du graphe.

## E13
1. `claude mcp add --transport http notion https://mcp.notion.com/mcp`, puis `claude` et `/mcp` pour te connecter à Notion. Gmail et Google Agenda : connecte-les sur claude.ai (Paramètres, Connecteurs).
2. `/morning-brief` (déjà créé : `work/02-morning-brief/CLAUDE.md` et le skill). Pour une autre automatisation : `/new-automation`.
3. Envoie-toi un email de test, lance `/morning-brief`, réponds Oui pour créer la base Notion « Daily briefs ».
4. En cas d'erreur : « Corrige l'erreur et note la leçon dans vault/errors.md et dans les Correctifs appris de work/02-morning-brief/CLAUDE.md. »
Preuves : capture de la page Notion, contenu de `vault\errors.md`.
