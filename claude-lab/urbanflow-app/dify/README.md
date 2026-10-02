# Base de connaissance UrbanFlow : données complètes

Source : `DakarFlow_Donnees_1.xlsx` (15 lignes de la feuille DakarFlow, 16 feuilles d'arrêts, 613 arrêts), `Dakar_Dem_Dikk_contenu_collecte.docx` (liste officielle demdikk.sn : 11 lignes urbaines, 19 lignes banlieue, 7 lignes TER) et les synthèses DDD du 29 et 30/09/2026.

## Ce qui est dans la base
- 42 lignes : urbain, banlieue, TAF TAF, TER, ligne 319 (captures appli), avec trajet officiel, terminus capturés, zones traversées, heures de pointe habituelles (valables pour toutes les lignes).
- 613 arrêts ordonnés pour 16 lignes (1, 4, 5, 6, 7, 8, 9, 10, 13, 18, 121, 213, 218, 234, 23, 319).
- Temps de trajet : uniquement les 4 lignes déjà relevées (1, 4, 8, 18, estimation voiture Google Maps). Les 38 autres sont "non relevé". Le xlsx a les colonnes Temps, Prix, Fréquence, Incident vides : rien n'a été inventé.
- Incohérences entre sources signalées par "A vérifier" dans chaque ligne concernée (lignes 4, 6, 10, 13, 23, 121, 5, 213, 218, 220).

## Fichiers et import Dify (mode Économique, découpage personnalisé, séparateur \n\n, longueur max 1024)
| Fichier | Base Dify | Segments |
|---|---|---|
| urbanflow_kb_lignes.md | RECUP_LIGNES | 42 (un par ligne) |
| urbanflow_kb_arrets.md | RECUP_LIGNES | 25 |
| urbanflow_kb_lieux.md | RECUP_LIGNES | 4 |
| urbanflow_kb_affluence.md | RECUP_AFFLUENCE (remplace urbanflow_affluence_type.md) | 4 |
| urbanflow_kb_infos_ddd.md | base lignes (TAF TAF, AIBD, interurbain, gares, institution, flotte, sans prix) | 13 |
| urbanflow_lignes_complet.csv, urbanflow_arrets_complet.csv | pour l'app et le dépôt (dossier dify/) | 42 lignes, 613 arrêts |

Dans la base RECUP_LIGNES, Top K à 8. Aucun prix dans la base. Pas de niveau d affluence par ligne : seules les heures de pointe habituelles du réseau sont données.

## Pourquoi "ligne 7" ne remontait rien
L'index inversé (mode Économique) de Dify ignore les mots d'un seul caractère : les chiffres 1 à 9 ne sont jamais indexés, donc "ligne 7", "ligne 8", "ligne 4" ne trouvaient pas la bonne ligne (seules 10, 13, 18, 20, 23, 121 passaient). Les segments contiennent donc un jeton "ligne7" (2 caractères ou plus), et `core.mjs` (fonction `enrichirRequete`) envoie à Dify une requête compacte (jetons + heures + lieux) quand la question cite une ligne. Dans l'interface de test de Dify, tapez "ligne7 ligne7 18h" (sans les mots "ligne" et "vers", qui font remonter toutes les lignes).

## Remplacer les documents déjà importés
Les fichiers gardent les mêmes noms : réimporter un fichier du même nom dans la base remplace le document. Réglages : découpage personnalisé, séparateur \n\n, longueur 1024, mode Économique. Top K : 8.
