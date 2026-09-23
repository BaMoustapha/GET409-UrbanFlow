# GET409-UrbanFlow

## Équipe

| Prénom Nom | Rôle | GitHub Username | E-mail GitHub |
|---|---|---|---|
| Mouhamadou Moustapha BA | Chef de Produit (PM) / Dev UI (No-Code) | BaMoustapha | bam480836@gmail.com |
| Astou Barro Ndiaye | Master Prompt Engineer / Responsable Impact | (à compléter par Astou) | (à compléter par Astou) |

## Notre défi

**Secteur :** Mobilité urbaine à Dakar

**Utilisateurs cibles :** Usagers des transports en commun, notamment les usagers de Dakar Dem Dikk (DDD)

**Contexte :** Embouteillages quotidiens à Dakar

## Découverte — 3 problèmes identifiés (Prompt S1)

### 1. Imprévisibilité des temps d'attente et d'arrivée des bus

- **Cause principale :** Absence de système de suivi en temps réel des bus ; les horaires théoriques ne sont plus tenus dès que le trafic se congestionne sur les grands axes.
- **Impact sur la vie quotidienne :** Retards au travail et à l'école, attentes prolongées et incertaines aux arrêts, stress et perte de confiance dans le réseau DDD.
- **Piste de solution technologique accessible :** Un système par SMS/USSD (sans smartphone requis) donnant une estimation d'arrivée du prochain bus par ligne, alimenté par un signalement de position simple (chauffeurs ou usagers relais).

### 2. Sur-saturation des bus aux heures de pointe

- **Cause principale :** Convergence de plusieurs lignes sur les mêmes axes déjà engorgés (ex. Route de Rufisque, VDN), sans voie ou créneau dédié aux bus.
- **Impact sur la vie quotidienne :** Usagers debout et serrés, risques accrus de vols ou d'agressions, fatigue physique, temps de trajet parfois doublé ou triplé.
- **Piste de solution technologique accessible :** Une alerte SMS de "charge estimée" par ligne et par créneau horaire, pour permettre aux usagers de décaler leur départ ou choisir une ligne moins chargée.

### 3. Manque d'information sur les itinéraires alternatifs en cas de blocage

- **Cause principale :** Absence de coordination en temps réel entre DDD et les usagers lors d'incidents ou de déviations ; aucune communication officielle immédiate.
- **Impact sur la vie quotidienne :** Usagers bloqués sans visibilité sur la durée du blocage, rendez-vous manqués, sentiment d'impuissance face au trafic.
- **Piste de solution technologique accessible :** Un chatbot WhatsApp/SMS simple donnant l'état du trafic par ligne et proposant des itinéraires alternatifs, mis à jour par un petit réseau de contributeurs locaux.

## Énoncé HMW définitif (S2)

> Comment pourrions-nous aider les usagers de Dakar Dem Dikk à anticiper de façon fiable la durée réelle de leur trajet, malgré les embouteillages quotidiens, pour organiser leur journée sereinement ?

Ce HMW remplace la version provisoire de S1 (qui imposait déjà le canal SMS). Justification complète et comparaison S1 → S2 : [`docs/hmw-definitif.md`](docs/hmw-definitif.md)

## Value Proposition Canvas (S2)

Profil Client (Jobs, Pains, Gains) et Proposition de Valeur (Produits & Services, Pain Relievers, Gain Creators) du persona Aïssatou : [`docs/vpc.md`](docs/vpc.md)

## Livrables S1

- [x] Fiche équipe soumise (2 membres, 4 rôles répartis)
- [x] Énoncé HMW provisoire formulé
- [x] Carte d'empathie

## Livrables S2

- [x] Value Proposition Canvas élaboré — [`docs/vpc.md`](docs/vpc.md)
- [x] HMW définitif rédigé et validé par rapport au HMW S1 — [`docs/hmw-definitif.md`](docs/hmw-definitif.md)
- [x] README mis à jour avec le HMW définitif

---

# Carte d'empathie — Aïssatou Diallo

## Persona

| Champ | Détail |
|---|---|
| Prénom, âge, profession | Aïssatou Diallo, 29 ans, assistante administrative |
| Localisation | Habite Guédiawaye, travaille au Plateau, Dakar |
| Problème principal | Ne sait jamais combien de temps son trajet en DDD va réellement durer à cause des embouteillages |
| Équipement digital | Téléphone basique avec SMS, smartphone d'entrée de gamme partagé avec le foyer |
| Revenus approximatifs | 80 000 - 100 000 FCFA/mois |
| Contexte familial | Vit avec ses parents, doit récupérer sa petite sœur à l'école certains jours |

## 1. Ce qu'elle pense et ressent

- Anxieuse à l'idée d'arriver en retard au bureau, surtout les jours de réunion
- Frustrée de ne jamais savoir si elle doit attendre 5 ou 40 minutes le bus
- Se sent impuissante face aux embouteillages qu'elle subit sans aucune information
- Aimerait pouvoir planifier sa journée avec plus de certitude

## 2. Ce qu'elle voit

- Des files d'attente longues et désorganisées aux arrêts DDD aux heures de pointe
- Des bus qui passent déjà pleins sans pouvoir s'arrêter
- Des embouteillages denses sur la Route de Rufisque et la VDN chaque matin
- D'autres usagers qui consultent leur téléphone sans trouver d'information fiable

## 3. Ce qu'elle entend

- Les autres passagers se plaindre des retards et des bus bondés
- Des rumeurs non confirmées sur des routes bloquées, transmises de bouche à oreille
- Son responsable lui faire remarquer ses retards répétés
- Des chauffeurs qui annoncent des changements d'itinéraire au dernier moment

## 4. Ce qu'elle dit et fait

- "Je ne sais jamais à quelle heure je dois partir pour être à l'heure."
- Part systématiquement 45 minutes en avance "par sécurité", ce qui lui fait perdre du temps
- Appelle des collègues pour savoir si la route est dégagée
- Change parfois de ligne au hasard en espérant que ce sera plus rapide

## 5. Frustrations (Pains)

| Frustration | Intensité |
|---|---|
| Aucune visibilité sur l'heure d'arrivée réelle du bus | ★★★ |
| Bus surchargés aux heures de pointe | ★★★ |
| Pas d'information sur les itinéraires alternatifs en cas de blocage | ★★ |
| Temps perdu à attendre "par précaution" | ★★ |

## 6. Aspirations (Gains)

| Aspiration | Priorité |
|---|---|
| Recevoir une estimation fiable de l'heure d'arrivée du prochain bus | ★★★ |
| Savoir à l'avance si un bus est trop chargé pour l'éviter | ★★ |
| Être informée en temps réel des déviations et blocages | ★★ |
| Gagner du temps le matin en partant au bon moment | ★ |

## Insights clés

- Le vrai problème n'est pas l'embouteillage lui-même, mais l'absence totale d'information fiable pendant le trajet.
- La solution doit fonctionner sur téléphone basique (SMS/USSD), car tous les usagers n'ont pas un smartphone connecté en permanence.
- Une information simple et rapide (position, charge, alternative) change concrètement l'organisation de la journée des usagers.

## Énoncé HMW (provisoire S1 — voir HMW définitif S2 plus haut)

> Comment pourrions-nous aider les usagers de Dakar Dem Dikk à connaître en temps réel la position et la charge des bus, via un simple SMS, afin de réduire l'incertitude liée aux embouteillages quotidiens ?
