# Journal de Prompts — GET409-UrbanFlow

Ce journal documente 5 prompts utilisés pendant les Séances 1 et 2, avec la technique appliquée, le prompt exact, un résumé de la réponse obtenue, une note d'évaluation et l'itération effectuée le cas échéant.

---

## 1. Découverte des problèmes (Séance 1) — Zero-Shot

**Technique :** Zero-Shot Prompting

**Prompt exact :**
> Tu es un expert en mobilité urbaine à Dakar. Identifie les 3 principaux problèmes que rencontrent les usagers des transports en commun, notamment Dakar Dem Dikk, dans le contexte des embouteillages quotidiens à Dakar. Pour chaque problème, indique : la cause principale, l'impact sur la vie quotidienne, une piste de solution technologique accessible.

**Résumé de la réponse :** Trois problèmes identifiés — imprévisibilité des temps d'attente/arrivée des bus, sur-saturation aux heures de pointe, manque d'information sur les itinéraires alternatifs en cas de blocage — chacun avec sa cause, son impact quotidien et une piste technologique (SMS/USSD, alerte de charge, chatbot WhatsApp/SMS).

**Note :** 4/5 — réponse structurée, réaliste et directement exploitable, mais un peu générique sur la 3e piste (chatbot) qui mériterait d'être creusée.

**Itération :** Aucune reformulation nécessaire ; réponse conservée telle quelle comme base de la phase de découverte.

---

## 2. Carte d'empathie — Prompt structuré (Séance 1)

**Technique :** Prompt structuré avec persona imposé (proche du Few-Shot par la structure en sections fixes)

**Prompt exact :**
> À partir des 3 problèmes identifiés, construis une carte d'empathie pour un persona représentatif des usagers de Dakar Dem Dikk (prénom, âge, profession, localisation, équipement digital, contexte familial). Structure la carte en 6 sections : ce qu'il/elle pense et ressent, ce qu'il/elle voit, ce qu'il/elle entend, ce qu'il/elle dit et fait, ses frustrations (pains), ses aspirations (gains). Termine par des insights clés.

**Résumé de la réponse :** Persona Aïssatou Diallo, 29 ans, assistante administrative à Guédiawaye/Plateau. Carte complète sur les 6 sections, 4 pains et 4 gains priorisés par intensité, 3 insights clés dont le principal : « le vrai problème n'est pas l'embouteillage lui-même, mais l'absence totale d'information fiable pendant le trajet ».

**Note :** 5/5 — persona crédible et cohérent avec le contexte sénégalais, pains/gains directement réutilisables pour le VPC en S2.

**Itération :** Aucune ; la carte a servi de socle stable jusqu'en S2.

---

## 3. Value Proposition Canvas (Séance 2) — Zero-Shot structuré

**Technique :** Zero-Shot Prompting avec gabarit imposé (Profil Client / Proposition de Valeur)

**Prompt exact :**
> À partir de la carte d'empathie d'Aïssatou, construis un Value Proposition Canvas élaboré. Profil Client : Jobs To Be Done, Pains, Gains. Proposition de Valeur pour UrbanFlow : description en 2 phrases, Produits & Services, Pain Relievers (associés explicitement à chaque Pain), Gain Creators (associés explicitement à chaque Gain). Termine par un FIT Check vérifiant qu'aucun Pain Reliever ou Gain Creator n'est orphelin.

**Résumé de la réponse :** VPC complet avec 4 Jobs, 4 Pains, 4 Gains côté client ; description du service (SMS sans smartphone requis) ; 4 Produits & Services ; chaque Pain Reliever et Gain Creator explicitement relié à son Pain/Gain d'origine ; FIT Check validant l'absence d'éléments orphelins.

**Note :** 5/5 — correspondance stricte Pain↔Reliever et Gain↔Creator, directement conforme au gabarit du cours.

**Itération :** Aucune ; premier jet retenu et committé dans `docs/s2/vpc.md`.

---

## 4. HMW définitif — Chain-of-Thought (Séance 2)

**Technique :** Chain-of-Thought (raisonnement explicite avant reformulation, puis validation critère par critère)

**Prompt exact :**
> Compare le HMW provisoire de la S1 aux 5 critères de validation du cours (utilisateur réel, vraie frustration, assez large, assez précis, pas de solution intégrée). Identifie explicitement le critère non respecté, explique pourquoi, puis reformule un HMW définitif qui corrige ce défaut tout en restant fidèle à la carte d'empathie et au VPC. Valide le nouvel énoncé sur les 5 critères dans un tableau.

**Résumé de la réponse :** Le HMW S1 a été identifié comme contenant déjà une solution (« via un simple SMS »). Reformulation en HMW définitif centré sur le besoin réel (« anticiper de façon fiable la durée réelle de leur trajet »), sans canal technique imposé. Tableau de validation des 5 critères, tous ✅, avec justification pour chacun.

**Note :** 5/5 — le raisonnement explicite avant reformulation a permis d'isoler précisément le défaut du HMW initial plutôt que de le récrire au hasard.

**Itération :** Une itération : premier brouillon encore trop proche du HMW S1 (gardait une référence implicite au canal) ; reformulation demandée pour retirer toute mention de solution, aboutissant à la version définitive committée dans `docs/s2/hmw-definitif.md`.

---

## 5. Formulations alternatives du HMW — Few-Shot (Séance 1)

**Technique :** Few-Shot Prompting (plusieurs variantes générées à partir d'un même contexte pour comparaison)

**Prompt exact :**
> Génère 3 formulations différentes d'un énoncé HMW à partir des mêmes insights (incertitude sur le trajet, bus surchargés, manque d'info sur les déviations), en variant l'angle : une centrée sur l'information en temps réel, une centrée sur les itinéraires alternatifs, une centrée sur l'anticipation du temps de trajet.

**Résumé de la réponse :** Trois formulations produites, chacune avec un angle distinct : (1) position et charge des bus en temps réel, (2) itinéraire alternatif fiable en cas de blocage, (3) anticipation du temps de trajet réel. La 3e formulation a servi de point de départ pour le HMW définitif de la S2.

**Note :** 4/5 — bonne diversité d'angles, mais deux des trois variantes contenaient encore une solution implicite, ce qui a été corrigé plus tard via le prompt Chain-of-Thought (entrée n°4).

**Itération :** Aucune sur ce prompt lui-même ; son résultat (formulation n°3) a directement nourri l'itération de l'entrée n°4.
