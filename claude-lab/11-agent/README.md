# 11-agent : agent Python avec et sans mémoire (E11)

Agent Gemini qui répond sur les lignes Dakar Dem Dikk à partir de `../urbanflow-app/dify/urbanflow_lignes_complet.csv`, d'abord sans mémoire, puis avec mémoire de session. Il répond « non relevé » quand une donnée manque.

## Mise en route (PowerShell, dans ce dossier)
1. Skill externe : choisis une skill « agents sdk » sur https://skills.sh, lis son `SKILL.md`, envoie le lien pour relecture, puis installe-la (Claude Code seulement, portée Project).
2. Environnement :
   ```
   py -m venv .venv
   .venv\Scripts\pip install -r requirements.txt
   .venv\Scripts\python -m ipykernel install --user --name agents-lab --display-name agents-lab
   copy .env.example .env
   ```
3. Ouvre `.env` dans VS Code et colle ta clé après `GEMINI_API_KEY=` (clé gratuite sur aistudio.google.com), puis Ctrl+S. Claude ne peut pas lire ce fichier (règles deny de `.claude/settings.json`).
4. Ouvre `notebooks/agent_lab.ipynb`, choisis le noyau **agents-lab**, puis **Run All**.

## À observer
- Partie 1 : la question de suivi (« Et quels quartiers traverse-t-elle ? ») échoue : l'agent ne sait plus de quelle ligne on parle.
- Partie 2 : elle réussit, et le temps en bus est donné comme « non relevé ».

Vérification : `git check-ignore .env` doit afficher `.env`.
