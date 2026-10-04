# Mise en ligne automatique (GitHub Actions)

À faire une seule fois. Ensuite, chaque push sur `main` qui touche `claude-lab/urbanflow-app/` est testé puis mis en ligne.

## 1. Créer le jeton Cloudflare
1. https://dash.cloudflare.com/profile/api-tokens, puis **Create Token**.
2. Modèle **Edit Cloudflare Workers**, puis **Continue to summary**, puis **Create Token**.
3. Copie le jeton (affiché une seule fois). Ne le colle jamais dans un chat.
4. Note aussi ton **Account ID** : page d'accueil Cloudflare, menu à trois points du compte, ou colonne de droite de **Workers & Pages**.

## 2. Ajouter les secrets dans GitHub
Dépôt GitHub, **Settings > Secrets and variables > Actions > New repository secret**, un par un :

| Nom | Valeur | Obligatoire |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | jeton de l'étape 1 | oui |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID | oui |
| `GEMINI_API_KEY` | clé AI Studio | pour le secours |
| `DIFY_API_KEY`, `TOMTOM_API_KEY`, `DIFY_API_URL` | celles de ton `.env` | non : déjà sur le Worker si tu as lancé `deployer.bat` une fois |

## 3. Lancer
Onglet **Actions** du dépôt, workflow **UrbanFlow**, **Run workflow**. En vert : le site est à jour et répond. En rouge : ouvre l'étape en erreur et envoie-moi le message (il ne contient aucune clé).
