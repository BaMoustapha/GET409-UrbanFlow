# CLAUDE.md — UrbanFlow

## Présentation
UrbanFlow aide les usagers de Dakar Dem Dikk à anticiper la durée réelle de leur trajet malgré les embouteillages quotidiens. Projet GET409 (Atelier IA), UMEF Swiss University, Dakar. Équipe : Moustapha & Astou.

## Outils du projet
- **App** : construite et hébergée sur Lovable.dev (pas de code local pour l'instant ; ce dossier sert de labo local complémentaire).
- **Workflow IA** : Dify (nœuds Chercheur → SI/SINON → Rédacteur), export DSL dans `URBAN_FLOW_corrige.yml`.
- **Données** : `DakarFlow_Donnees_UrbanFlow.xlsx` (base maître, 11 feuilles, lignes DDD réelles).
- **Dépôt GitHub** : `BaMoustapha/GET409-UrbanFlow` (docs S3/S4, README).

## Dossiers
- `docs/s3/`, `docs/s4/` — journaux de prompts par séance (sur le dépôt GitHub, pas ici).
- `05-brand/` — identité de marque (skill `/urbanflow-brand`), email, post, flyer.
- `06-plugins/` — analyse concurrentielle et plan marketing.

## Conventions
- Texte en français partout (interface, contenus, documentation).
- Toute donnée de trafic doit être sourcée : base xlsx ou fichiers `sources-*.md`. Jamais de chiffre inventé.
- Identité visuelle : vert #00A651 (principal), jaune #FDEF42 et rouge #E31B23 (touches ponctuelles uniquement), polices Fraunces + Work Sans.
- Lignes urbaines DDD confirmées à utiliser en priorité : 1, 4, 7, 8, 9, 10, 13, 18, 20, 23, 121.

## Vocabulaire du domaine
- **Ligne urbaine** : trajet DDD à l'intérieur de Dakar (ex. Ligne 1, Parcelles Assainies ↔ Place Leclerc).
- **Affluence** : niveau d'occupation estimé d'une ligne (fluide / dense / saturé).
- **Point noir** : axe routier chroniquement saturé (ex. Patte d'Oie, Colobane).
- **TAF TAF** : navette express aéroport DDD.

## Méthode de travail
- Toute nouvelle donnée de trafic passe par une recherche web sourcée avant d'être ajoutée à la base xlsx.
- Toute évolution du workflow Dify est d'abord testée sur une copie du YAML avant application dans l'éditeur Dify.

## Interdits
- Ne jamais inventer de témoignage usager, de partenariat ou de statistique DDD non sourcée.
- Ne jamais coder en dur une clé API (Dify, Gemini, etc.) dans un fichier frontend : toujours via une fonction serveur / variable d'environnement.
