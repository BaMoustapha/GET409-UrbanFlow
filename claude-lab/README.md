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
| `urbanflow-app/` | E10 | Brief de la boucle Ralph (`.claude/ralph-brief.md`), un tour d'amélioration réel avec le plugin et deux tours manuels, captures dans `docs/captures/e10/` |
| `11-agent/` | E11 | Agent Python Gemini sur les lignes DDD, sans puis avec mémoire (`notebooks/agent_lab.ipynb`) |
| `personal-os/` | E12, E13 | Agent personnel : CLAUDE.md, modèle SOUL.md, vault, skills `/setup`, `/ingest`, `/lint`, `/new-automation`, `/morning-brief` (lecture seule) |
| `urbanflow-app/` | E14 | Sous-agent `securite-urbanflow` (lecture seule), audit `docs/audit-securite-2026-10-04.md`, limite de requêtes et taille du corps |

Le détail de chaque épisode (quoi, pourquoi, compromis) est dans `urbanflow-app/docs/decisions.md`.

## Validation
- E08 : validé le 05/10/2026 (Claude refuse de lire `.env`, bouton « Copier le trajet » testé en local, historique git).
- E09 : validé le 05/10/2026 (fausse clé Dify, question « ligne 7, quels quartiers ? », réponse `source=secours` via Gemini avec la note de secours ; les questions de trajet « A vers B » passent par le guide réseau, sans IA).
- E11 : notebook exécuté le 05/10/2026 (22 s, 0 erreur, aucune clé dans les sorties) : sans mémoire la question de suivi échoue, avec mémoire elle réussit (ligne 7, quartiers, temps en bus « non relevé »). Skill externe : `agents-sdk` de Cloudflare (https://github.com/cloudflare/skills), `SKILL.md` relu (documentation seule, aucune commande risquée), installée en portée Project dans `11-agent/.claude/skills/agents-sdk/`. E11 validé.
- E12 : `/setup` (interview, `SOUL.md`) et `/ingest` du CV (13 pages dans le vault, index et journal à jour) faits le 05/10/2026 ; contenu personnel gardé sur le PC (ignoré par git). Graphe Obsidian vérifié (16 pages reliées autour de `index` et `profil`). E12 validé.
- E13 : brief partiel du 05/10/2026 (Notion seul, mention « Gmail et Agenda non connectés », base Notion « Daily briefs » créée après accord, rien inventé) ; erreur réelle consignée dans `vault/errors.md` (SOUL.md mal rangé). Gmail et Agenda restent à connecter pour un brief complet.
- E10 : plugin ralph-loop lancé le 06/10/2026 sur ton PC : un tour réel (commit `51867a1` : cibles tactiles 44 px, focus visible, placeholder lisible ; page Trajet vérifiée avec Playwright, 11 tests OK). Le hook d'arrêt du plugin a échoué (`jq` introuvable sous Windows), donc la boucle ne s'est pas relancée seule ; POLISHED volontairement non écrit.
- Déploiement : fait le 06/10/2026 par GitHub Actions (run #8 vert, commit `aead9ac`) : tests, déploiement Cloudflare, vérification en ligne. L'avertissement « aucun 429 » n'est pas apparu : la limite de requêtes agit en production.
- E14 : validé le 05/10/2026 (sous-agent `securite-urbanflow` chargé depuis `urbanflow-app`, ligne d'outil `securite-urbanflow(...)`, lecture seule ; verdict : règles Read/Edit OK, commandes Bash de lecture non couvertes, hook PreToolUse recommandé).

## Où trouver les étapes
- Tableau ci-dessus : le dossier de chaque épisode.
- `urbanflow-app/docs/decisions.md` : le quoi, le pourquoi et les compromis de E07 à E14.
- `urbanflow-app/docs/audit-securite-2026-10-04.md` : audit de sécurité (E14).
- `urbanflow-app/docs/deploiement-github.md` : secrets et déploiement automatique.
- `urbanflow-app/docs/captures/e10/` : captures avant et après la boucle Ralph.

Exclus volontairement : `.git`, `node_modules`, `.venv`, journaux Playwright, réglages locaux, fichiers `.env`, `SOUL.md` et le contenu du vault.
