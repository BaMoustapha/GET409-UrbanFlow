# UrbanFlow : Dify, RAG à deux recherches (adapté de GET409 S5, @Malick)

Adaptation du tutoriel "Dify RAG à deux recherches" au projet **UrbanFlow** (Moustapha & Astou). Le nœud CHERCHEUR croise le **catalogue des lignes DDD** avec l'**affluence typique par créneau horaire**.

**Statut au 01/10/2026 : terminé et publié (version avec RÉDACTEUR et CHERCHEUR corrigés). T1, T2, T3 passent.**

## 1. Architecture

```
DÉBUT → RECUP_LIGNES → RECUP_AFFLUENCE → MODÈLE (Jinja2) → CHERCHEUR → SI/SINON (contient INSUFFISANT) → SORTIE / RÉDACTEUR → SORTIE 2
```

- Modèles : **gpt-oss-120b via Groq** sur CHERCHEUR et RÉDACTEUR, avec **"Activer la séparation des balises de raisonnement"** coché (sinon le `<think>` fuit dans la réponse).
- ENV `requete_affluence` = `Affluence heures de pointe places restantes`.

## 2. Les deux bases (changement majeur : mode Économique)

Les bases "Haute Qualité" ont besoin du modèle d'embeddings (crédits Dify). Quand les crédits sont épuisés elles passent en **Indisponible**. Les bases ont donc été recréées en **Économique (index inversé)**, qui marche sans crédits.

| | RECUP_LIGNES | RECUP_AFFLUENCE |
|---|---|---|
| Fichier | `urbanflow_lignes_catalogue_bloc.md` (837 caractères, **1 seul segment**) | `urbanflow_affluence_type.md` (661 caractères, 1 segment) |
| Mode d'index | Économique, index inversé | Économique, index inversé |
| Découpage | personnalisé, longueur max **1024** (plafond du plan) | idem |

Règles à retenir :
- Une base HQ et une base Économique ne peuvent pas être mélangées dans un même nœud de récupération.
- Garder chaque fichier sous 1024 caractères pour qu'il reste un seul segment (donc toujours remonté en entier, plus de problème de "ligne 8" absente).
- Réimporter un fichier du **même nom** remplace le document (pas de doublon).

## 3. Contenu du catalogue (corrigé)

Les trajets viennent de demdikk.sn et de l'appli Lignes Urbain (et du fichier `DakarFlow_Donnees_UrbanFlow.xlsx`). Exemples : ligne 1 Parcelles Assainies - Place Leclerc, ligne 4 Liberté 5 - Place Leclerc, ligne 8 **Aéroport LSS (Yoff) - Palais 2**, ligne 18 Dieuppeul - Centre-ville. Les lignes douteuses portent la mention "à vérifier".

**Temps de trajet** : DDD n'en publie aucun. On utilise des estimations **voiture Google Maps en trafic habituel (vendredi)**, le bus peut être plus long :

| Ligne | 8h (quartier vers centre) | 18h (retour) |
|---|---|---|
| 1 | 24-40 min | 28-55 min |
| 4 | 16-30 min | 20-40 min |
| 8 | 24-45 min | 30-55 min |
| 18 | 18-35 min | 20-45 min |

Autres lignes : "non relevé". Ces relevés sont aussi dans la feuille `Collecte_TempsTrajet` du xlsx. **À faire** : un relevé terrain en bus pour comparer avec Google Maps.

## 4. ENV, récupérations, nœud Modèle

- **RECUP_LIGNES** : requête = Début · query, connaissance = catalogue lignes.
- **RECUP_AFFLUENCE** : requête = ENV · requete_affluence, connaissance = affluence.
- **MODÈLE** : variable `donnees` = RECUP_AFFLUENCE · result, code `{% for item in donnees %}{{ item.content }}\n{% endfor %}`, relié au CHERCHEUR.

## 5. Prompts

**CHERCHEUR** : question insérée avec le badge Début · query (jamais `{{sys.query}}` tapé), CONTEXTE = RECUP_LIGNES · result, bloc AFFLUENCE = badge Modèle · output, plus les règles de croisement. Format de sortie corrigé :
- `LIGNE / AXE` : numéro de ligne et trajet complet du catalogue (départ - arrivée)
- `TEMPS DE TRAJET` : fourchette du catalogue (estimation voiture), créneau 8h ou 18h le plus proche de l'heure demandée
- `HEURE DEMANDÉE` : jour et heure écrits par l'usager, sinon "Non précisée", **jamais l'heure actuelle** (avant, le champ "HEURE COLLECTE" faisait inventer "10:12")

**RÉDACTEUR** : le prompt d'origine contenait un exemple complet (ligne 14, 35-50 min, axe VDN) que le modèle recopiait. Il est remplacé par un squelette sans valeurs et des règles strictes : n'utiliser que les données du CHERCHEUR, "Non disponible" si une donnée manque, aucune invention (marchandises, notifications, SMS), et mention obligatoire "estimation voiture, le bus peut être plus long" à côté de chaque temps. Le format impose les 5 titres FICHE TRAJET, TEMPS DE TRAJET, ANALYSE, ALERTES, RECOMMANDATIONS, les seuls reconnus par le composant `ReponseAgent` du MVP.

## 6. Tests obligatoires (résultats du 01/10/2026)

| # | Question | Obtenu |
|---|---|---|
| T1 | "Je prends la ligne 8 vers 8h, il y a du monde ?" | ✅ Ligne 8 Aéroport LSS (Yoff) → Palais 2, 8 h, 24-45 min estimation voiture (le bus peut être plus long), affluence dense |
| T2 | "Je veux aller au marché Sandaga" | ✅ INSUFFISANT, branche IF |
| T3 | "Je prends la ligne 7 vers 18h, ça prend combien de temps ?" | ✅ INSUFFISANT : pas de temps pour la ligne 7, rien d'inventé |

Lire la TRACE nœud par nœud si un test échoue.

## 7. Pièges rencontrés

1. `{{sys.query}}` tapé en texte : le LLM reçoit le texte littéral. Utiliser `/` puis Début · query.
2. CONTEXTE du CHERCHEUR branché sur Début · query au lieu de RECUP_LIGNES · result.
3. Réglages de récupération : avec une seule base, Dify applique ceux de la **Connaissance** (Paramètres), pas ceux du nœud. Le reranker `qwen3-rerank` écartait "ligne 8". Résolu en passant à un segment unique.
4. **Crédits Dify épuisés** : bases HQ "Indisponible" et modèles Dify KO. Solution : modèle Groq (gpt-oss-120b, Kimi K2 indisponible sur Groq) + bases Économique.
5. **`<think>` dans la réponse** : cocher la séparation des balises de raisonnement sur les deux nœuds LLM.
6. **Plafond 1024 caractères par segment** : raccourcir le fichier plutôt que de laisser Dify le couper.
7. **Catalogue faux** : les trajets avaient été inventés (seule la ligne 1 était juste). Toujours reconstruire depuis la source vérifiée (xlsx, site officiel).
8. **Exemple dans un prompt de rédaction** : le modèle le recopie. Mettre un squelette avec des crochets, pas de vraies valeurs.
9. Lovable : Dify peut répondre HTTP 200 avec un run échoué. Vérifier `data.status === "succeeded"` côté `askAgent`.

## 8. Reste à faire

- Mode démo du MVP Lovable (anciens trajets ligne 8 et 18 à remplacer) et détection hors-sujet : en attente de crédits Lovable.
- Publier le MVP sur lovable.app et tester de bout en bout.
- Relevé terrain en bus pour valider les temps Google Maps.

## 9. Prompt de débogage (à coller dans Claude.ai si un test échoue)

```
Tu es un expert des workflows Dify (plan gratuit). Aide-moi à déboguer mon workflow. Raisonne étape par étape et ne propose AUCUNE modification de prompt tant que les branchements et les paramètres de récupération des Connaissances n'ont pas été vérifiés.
MON WORKFLOW :
- Projet : UrbanFlow, anticiper les temps de trajet réels sur le réseau Dakar Dem Dikk malgré les embouteillages
- Chaîne : DÉBUT → RECUP_LIGNES → RECUP_AFFLUENCE → MODÈLE → CHERCHEUR → SI/SINON → SORTIE / RÉDACTEUR → SORTIE 2
- Bases : catalogue lignes (1 segment, Économique) et affluence (1 segment, Économique)
- Modèle : gpt-oss-120b (Groq), séparation du raisonnement activée
LE PROBLÈME :
- Question test : [coller]
- Attendu : [...]
- Obtenu : [coller le RÉSULTAT ou l'erreur]
- Contenu de #context# dans la TRACE du CHERCHEUR : [coller]
```

---
Adapté du tutoriel GET409 S5 (@Malick). Mis à jour le 01/10/2026 : bases Économique, Groq, catalogue corrigé avec temps Google Maps, prompts CHERCHEUR et RÉDACTEUR corrigés, tests T1 à T3.
