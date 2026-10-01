# Journal de Prompts - S5 (GET409-UrbanFlow)

Ce journal documente les prompts du pipeline RAG et de l'intégration webhook d'UrbanFlow, puis les tests de cohérence réalisés le 1er octobre 2026. Résultat : l'agent ne répond plus que depuis le catalogue des lignes et l'affluence, et écrit "Non disponible" quand une donnée manque.

---

## 1. Prompt RAG : le CHERCHEUR (workflow Dify)

**Technique :** Prompt système structuré avec deux sources (catalogue des lignes, affluence par créneau) et un format de sortie obligatoire, avec branche INSUFFISANT.

**Prompt exact (champs de sortie avant correction) :**
```
LIGNE / AXE : [nom]
TEMPS DE TRAJET : [fourchette en minutes]
HEURE COLLECTE : [heure]
```

**Ce qui a échoué :**
- Le champ "HEURE COLLECTE" faisait inventer l'heure du jour ("10:12") alors que l'usager avait écrit 8h.
- "LIGNE / AXE : [nom]" ne forçait pas à recopier le trajet du catalogue : départ et arrivée sortaient en "Non disponible".
- Plus tôt dans la séance : trajets du catalogue faux (seule la ligne 1 était exacte) et reranker qui écartait le segment "ligne 8".

**Prompt corrigé (champs modifiés) :**
```
LIGNE / AXE : [numéro de ligne et trajet complet du catalogue, départ - arrivée]
TEMPS DE TRAJET : [fourchette en minutes du catalogue, estimation voiture Google Maps, créneau 8h ou 18h le plus proche de l'heure demandée]
HEURE DEMANDÉE : [jour et heure écrits par l'usager dans sa question, sinon Non précisée. Ne jamais mettre l'heure actuelle]
```

**Note :** 4/5 après correction.

**Analyse :** un champ de sortie nommé comme une donnée système (heure de collecte) pousse le modèle à la fabriquer. Nommer le champ d'après ce que dit l'usager et interdire l'heure actuelle supprime l'invention. Les bases ont aussi été recréées en mode Économique avec un seul segment, ce qui rend la récupération stable.

---

## 2. Prompt de rédaction : le RÉDACTEUR

**Technique :** Prompt à règles numérotées avec squelette de format (sans valeurs d'exemple) et consigne de repli.

**Problème :** le prompt d'origine contenait un exemple complet (ligne 14, Guédiawaye vers Plateau, 35 à 50 minutes, axe VDN). Le modèle le recopiait et ajoutait du contenu absent des données : marchandises, "partir 15 min avant", notifications en temps réel.

**Prompt corrigé (règles clés) :**
```
Tu es le rédacteur d'UrbanFlow. Les données du CHERCHEUR sont ta SEULE source.
1. N'utilise que les lignes, trajets, heures, temps et niveaux d'affluence présents dans les données. Recopie-les fidèlement.
2. Les temps du catalogue sont des estimations VOITURE Google Maps en trafic habituel. Écris toujours : "estimation voiture, le bus peut être plus long".
3. Si une information manque, écris "Non disponible".
4. N'invente rien : pas de numéro de ligne, de quartier, d'axe routier, de cause du trafic, de météo, de notification.
5. Si la question n'est pas un trajet en bus à Dakar, dis-le et propose de reformuler.
FORMAT : exactement 5 titres en majuscules (FICHE TRAJET, TEMPS DE TRAJET, ANALYSE, ALERTES, RECOMMANDATIONS), 100 à 150 mots.
```

**Note :** 5/5 après correction.

**Compatibilité MVP :** les 5 titres sont ceux que reconnaît le composant `ReponseAgent` du MVP Lovable ; des titres différents casseraient la mise en page.

**Analyse :** un exemple rempli de vraies valeurs agit comme une réponse à copier. Un squelette avec des crochets, des règles numérotées et un repli ("Non disponible") supprime les inventions sans perdre la structure.

---

## 3. Prompt webhook : intégration Lovable vers Dify

**Technique :** appel `POST https://api.dify.ai/v1/workflows/run`, `response_mode: blocking`, `inputs: { query }`.

| Point | Modèle S5 | UrbanFlow |
|---|---|---|
| Clé API | dans le code du navigateur | clé `DIFY_API_KEY` côté serveur, dans une server function `askAgent` |
| Délai maximal | 10 secondes | 30 secondes (deux appels LLM enchaînés) |
| Succès | affichage de `outputs` dès HTTP 200 | vérification de `data.status === "succeeded"` |
| Agent indisponible | message d'erreur | mode démo avec réponses de secours |

**Pourquoi :** Dify peut répondre HTTP 200 alors que l'exécution a échoué (crédits épuisés, modèle indisponible). Sans contrôle du statut, le MVP affichait "Aucune réponse" sans explication. Garder la clé côté serveur évite de l'exposer.

**Prompts exacts envoyés à Lovable (extraits de l'historique du projet, sans clé API) :**

1. 29/09, 18h58 : « Ajoute une fonctionnalité de consultation de l'agent IA sur la page Lignes de UrbanFlow. » Interface : champ « Posez votre question sur un trajet ou une ligne... », bouton vert #00853F « Demander à l'agent 🚌 », zone de résultat, spinner, erreur en rouge. Appel côté serveur à https://api.dify.ai/v1/workflows/run (corps : inputs.query, mode blocking). La clé reste côté serveur. Messages prévus : « Service temporairement indisponible » et un message si la réponse dépasse 10 s.
2. 30/09, 20h57 : « Transforme le bouton "Estimer mon trajet" en une vraie fonctionnalité connectée à mon agent IA Dify. » Section #estimer, fonction serveur lisant le secret DIFY_API_KEY, délai maximal 30 s, affichage de la première valeur texte de data.outputs.
3. 30/09, 20h58 : amélioration de l'affichage. Carte structurée par section, temps en grand et en gras, alertes dans un encadré jaune, réponse INSUFFISANT dans un encadré orange « Précisez votre ligne et votre heure de départ... », 3 suggestions cliquables, bouton désactivé pendant le chargement.
4. 30/09, 21h02 : mode démo et transparence. Réponses simulées pour la ligne 8 et la ligne 18, badge gris « Mode démo : réponse simulée », mention « Estimation indicative issue du catalogue UrbanFlow (données septembre 2026) et des heures de pointe observées. Non affilié à Dakar Dem Dikk. », message pour les questions hors sujet.
5. 30/09, 21h07 : prompt de test seul, sans modification du code (« Météo demain à Dakar ? » et « Je veux aller au marché Sandaga »).
6. 30/09, 21h09 : corrections. askAgent traite comme « indisponible » tout statut différent de "succeeded", toute erreur data.error ou toute sortie vide, et journalise. Classification hors sujet par mots-clés (ligne, bus, trajet, arrêt, noms de quartiers, etc.). Vérification avec la démo « Ligne 8 vers 8h... ».

**Erreur à signaler :** un prompt du 29/09, 18h55 était un modèle copié d'un autre projet (GreenSprint) et envoyé par erreur. Il est à ignorer. Le rebranding vert #00853F avec barre tricolore date du 28/09 (prompt de 20h44).

**Point non appliqué :** le point 2 du prompt 6 (nouvelle détection hors sujet) n'a pas été codé faute de crédits. Le correctif est prêt dans le fichier lovable_demo_patch.txt.

**Limite connue :** le mode démo contient encore d'anciens trajets pour les lignes 8 et 18, et la détection des questions hors sujet est à refaire (crédits Lovable épuisés). L'agent Dify publié est à jour.

---

## 4. Test de cohérence (1er octobre 2026)

| Test | Question | Avant correction | Après correction |
|---|---|---|---|
| T1 | "Je prends la ligne 8 vers 8h, il y a du monde ?" | trajet faux (Parcelles Assainies vers Palais), 40 min, heure "10:12" inventée | Ligne 8 Aéroport LSS (Yoff) vers Palais 2, 8 h, 24-45 min "estimation voiture, le bus peut être plus long", affluence dense |
| T2 | "Je veux aller au marché Sandaga" | INSUFFISANT | INSUFFISANT (hors catalogue), branche SI/SINON respectée |
| T3 | "Je prends la ligne 7 vers 18h, ça prend combien de temps ?" | non testé | INSUFFISANT : pas de temps pour la ligne 7, rien d'inventé |

**Lecture :** T1 vérifie le croisement des deux recherches sans invention. T2 et T3 vérifient que l'agent refuse quand la base est insuffisante. Les temps affichés sont des estimations voiture : un relevé terrain en bus reste à faire.

---

## 5. Peer review

Aucun retour de pair noté pour l'instant. À compléter :
- [ ] Retours reçus
- [ ] Modifications faites suite aux retours
- [ ] Points à reprendre pour la note d'éthique S6
