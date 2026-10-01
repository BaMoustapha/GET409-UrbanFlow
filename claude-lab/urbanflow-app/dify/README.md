# Bases Dify UrbanFlow — Etape A (RAG a deux recherches)

Deux fichiers prets a importer dans Dify -> Connaissance -> + Creer des Connaissances.

## 1. urbanflow_lignes_catalogue.csv (base recherchee)
- Import : selectionner le fichier CSV
- Decoupage : General -> longueur du segment 300, chevauchement 50
- Verification : Test de Recuperation avec les mots "ligne 8" -> doit remonter la ligne 8 (Parcelles Assainies vers Palais, 40 min)

## 2. urbanflow_affluence_type.md (base fixe)
- Import : selectionner le fichier .md
- Decoupage : Personnalise -> identifiant de segment = deux retours a la ligne (\n\n), longueur 1000
- Verification : le document doit afficher 1 seul segment (puisque le texte est sur une seule ligne, aucun \n\n dedans)
- Attendre le statut vert Disponible sur les deux documents avant de brancher les noeuds Recuperation

## Pourquoi le decoupage personnalise sur la base fixe
Avec le decoupage General (qui coupe aux sauts de ligne), un texte structure serait
fragmente phrase par phrase et perdrait le lien entre chaque donnee et son libelle.
Le decoupage personnalise avec \n\n comme separateur garde tout le texte en un seul
segment puisqu'il n'y a pas de double saut de ligne dans le fichier.

## Suite (etapes B-D, deja documentees)
Voir claude/urbanflow-dify-rag-2recherches.md dans le projet Claude "Atelier Interdisciplinare" :
ENV requete_affluence, noeuds RECUP_LIGNES / RECUP_AFFLUENCE, noeud Modele Jinja2,
blocs SYSTEM du Chercheur, tests T1-T3.
