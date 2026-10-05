# claude-lab : Atelier Claude Code (E01 à E14)

Fichiers produits pendant l'atelier Claude Code, adaptés à UrbanFlow (mobilité urbaine à Dakar, Dakar Dem Dikk). Le projet fil rouge PromptLens du cours est remplacé par UrbanFlow (`urbanflow-app`).

| Dossier | Épisode | Contenu |
|---|---|---|
| `01-hello/` | E01, E02 | Première carte HTML (ATA et UrbanFlow), puis thème clair/sombre fait en mode plan avec retour arrière (E02) |
| `03-landing/`, `03-landing-urbanflow/` | E03, E04 | Landing page sans skill (v1) et avec skill frontend-design (v2), CLAUDE.md réécrit (E04) |
| `05-brand/` | E05 | Skill de marque, email, flyer, post LinkedIn |
| `06-plugins/` | E06 | Analyse concurrentielle (Playwright), plan marketing, captures |
| `urbanflow-app/` | E07 | Application UrbanFlow et son CLAUDE.md |
| `urbanflow-app/` | E08 | Protections (`.gitignore`, règles deny étendues au terminal), bouton « Copier le trajet » |
| `urbanflow-app/` | E09 | Gemini en secours côté serveur quand Dify ou Groq tombe (`lib/core.mjs`), clé en secret Cloudflare |
| `urbanflow-app/` | E10 | Brief de la boucle Ralph (`.claude/ralph-brief.md`), deux tours d'amélioration de l'interface, captures dans `docs/captures/e10/` |
| `11-agent/` | E11 | Agent Python Gemini sur les lignes DDD, sans puis avec mémoire (`notebooks/agent_lab.ipynb`) |
| `personal-os/` | E12, E13 | Agent personnel : CLAUDE.md, modèle SOUL.md, vault, skills `/setup`, `/ingest`, `/lint`, `/new-automation`, `/morning-brief` (lecture seule) |
| `urbanflow-app/` | E14 | Sous-agent `securite-urbanflow` (lecture seule), audit `docs/audit-securite-2026-10-04.md`, limite de requêtes et taille du corps |

Le détail de chaque épisode (quoi, pourquoi, compromis) est dans `urbanflow-app/docs/decisions.md`.

## Validation
- E08 : validé le 05/10/2026 (Claude refuse de lire `.env`, bouton « Copier le trajet » testé en local, historique git).
- E09 : validé le 05/10/2026 (fausse clé Dify, question « ligne 7, quels quartiers ? », réponse `source=secours` via Gemini avec la note de secours ; les questions de trajet « A vers B » passent par le guide réseau, sans IA).
- E11 : notebook exécuté le 05/10/2026 (22 s, 0 erreur, aucune clé dans les sorties) : sans mémoire la question de suivi échoue, avec mémoire elle réussit (ligne 7, quartiers, temps en bus « non relevé »). Reste le lien de la skill choisie sur skills.sh.
- E14 : validé le 05/10/2026 (sous-agent `securite-urbanflow` chargé depuis `urbanflow-app`, ligne d'outil `securite-urbanflow(...)`, lecture seule ; verdict : règles Read/Edit OK, commandes Bash de lecture non couvertes, hook PreToolUse recommandé).

## Ce qui se fait sur ton PC (preuves de l'atelier)
- E08 : demander à Claude de lire `.env` (il doit refuser), capture de l'app et `git log --oneline`.
- E09 : coller `GEMINI_API_KEY` dans `.env`, tester avec une clé Dify volontairement fausse, puis `deployer.bat`.
- E10 : lancer le plugin ralph-loop avec la commande de `urbanflow-app/.claude/ralph-commande.txt` (facultatif : deux tours ont déjà été faits).
- E11 : choisir la skill sur skills.sh, créer le `.venv`, coller la clé, exécuter le notebook.
- E12, E13 : `/setup`, `/ingest`, Obsidian, connexion Notion, `/morning-brief`. Le contenu personnel reste sur le PC (ignoré par git).
- E14 : `/agents` puis relancer l'audit avec le sous-agent.

Exclus volontairement : `.git`, `node_modules`, `.venv`, journaux Playwright, réglages locaux, fichiers `.env`, `SOUL.md` et le contenu du vault.
