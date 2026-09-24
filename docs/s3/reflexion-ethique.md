# L4 — Réflexion Éthique (GET409-UrbanFlow)

| Champ | Détail |
|---|---|
| Équipe | GET409-UrbanFlow |
| Projet | UrbanFlow |
| Livrable | L4 — Réflexion éthique |
| Persona | Aïssatou Diallo · 29 ans · Assistante administrative · Guédiawaye → Plateau · Téléphone basique (SMS) / smartphone d'entrée de gamme partagé · Sans moyen de paiement dédié à l'app |
| Outil IA | Dify.ai — Workflow Chercheur → IF/ELSE → Rédacteur (claude-3-haiku pour le Chercheur, claude-3-sonnet pour le Rédacteur) |

## Contexte de la réflexion

UrbanFlow est un agent IA destiné à aider les usagers de Dakar Dem Dikk à anticiper de façon fiable la durée réelle de leur trajet malgré les embouteillages quotidiens. Le système repose sur un workflow Dify (Chercheur → IF/ELSE → Rédacteur) qui collecte des données de trafic et génère une fiche trajet courte et actionnable. Trois risques éthiques ont été identifiés et sont examinés ci-dessous.

## Risque 1 — Fiabilité des estimations de trajet

**Description :** Le nœud Chercheur peut manquer de données de trafic réellement à jour (pas d'accès direct à un flux GPS des bus DDD) et produire une estimation approximative ou périmée. Si Aïssatou part sur la base d'un temps de trajet erroné, elle risque d'arriver en retard à une réunion ou de perdre du temps à attendre inutilement.

**Garde-fou technique :** Activer l'outil Web Search du nœud Chercheur en le limitant à des sources fiables (annonces officielles DDD, données trafic disponibles publiquement) et afficher systématiquement l'heure de collecte dans la fiche, avec la mention "Estimation indicative — sous réserve d'évolution du trafic".

**Garde-fou organisationnel :** Mettre en place une validation ponctuelle par un petit groupe d'usagers relais (comme pour le test des livrables L1/L2), qui signalent les écarts significatifs entre l'estimation reçue et le temps de trajet réellement constaté.

## Risque 2 — Exclusion numérique

**Description :** Aïssatou utilise un téléphone basique avec SMS ; l'interface Dify elle-même est une application web. Si le seul canal de livraison reste une interface web ou un chatbot nécessitant un smartphone connecté, les usagers les plus dépendants de DDD — précisément ceux qu'UrbanFlow vise à aider — restent exclus du service.

**Garde-fou technique :** Prévoir une passerelle SMS/USSD (ex. API Orange Sénégal) qui déclenche le workflow Dify et renvoie la fiche trajet condensée par SMS, sans passer par une interface web.

**Garde-fou organisationnel :** Identifier des relais numériques aux arrêts de bus les plus fréquentés (kiosques, agents DDD) capables de consulter UrbanFlow pour un usager qui n'a pas de smartphone, le temps que la passerelle SMS soit disponible.

## Risque 3 — Dépendance à l'infrastructure et disponibilité au mauvais moment

**Description :** Le workflow dépend entièrement de la disponibilité de l'API du fournisseur LLM et de l'outil Web Search. Une panne survenant à une heure de pointe — précisément le moment où l'information est la plus critique pour décider de partir ou d'attendre — rendrait UrbanFlow inopérant au pire moment possible pour l'usager.

**Garde-fou technique :** Configurer un modèle de repli dans Dify (bascule automatique vers un second fournisseur en cas d'erreur) et mettre en cache la dernière fiche valide avec son horodatage, affichée si le service est temporairement indisponible.

**Garde-fou organisationnel :** Suivre un tableau de bord de disponibilité du service et définir un seuil d'indisponibilité (ex. plus de 30 minutes en heure de pointe) déclenchant une communication directe aux usagers réguliers.

## Recommandation finale

**Phase recommandée : Pilote contrôlé**

UrbanFlow ne doit pas être déployé à grande échelle avant d'avoir testé la fiabilité des estimations et la passerelle SMS. La recommandation est de conduire un pilote sur un nombre limité d'usagers volontaires sur l'axe Guédiawaye–Plateau, avec collecte systématique des écarts entre temps annoncé et temps réel, test du canal SMS, et activation du modèle de repli. Le passage à un déploiement élargi sera décidé sur la base de la fiabilité mesurée et de l'accessibilité effective aux usagers sans smartphone.

---
GET409-UrbanFlow — GET 409 — Swiss UMEF University — Campus de Dakar
