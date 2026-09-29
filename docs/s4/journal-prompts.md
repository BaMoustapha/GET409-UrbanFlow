# Journal de Prompts — S4 (GET409-UrbanFlow)

Ce journal documente les prompts utilisés pour générer et itérer sur le MVP UrbanFlow avec Lovable.dev (équivalent Bolt.new retenu par l'équipe), à partir du template E1-S4 du cours adapté au secteur mobilité urbaine / Dakar Dem Dikk.

---

## 1. Prompt d'initialisation MVP UrbanFlow — Prompt structuré (S1-S4)

**Technique :** Prompt structuré — personnalisation du template E1-S4 (6 sections : contexte, pages, design, données, stack)

**Prompt exact (résumé) :**
> Crée une application web complète appelée UrbanFlow.
> CONTEXTE : UrbanFlow aide les usagers de Dakar Dem Dikk à anticiper la durée réelle de leur trajet malgré les embouteillages quotidiens.
> PAGES : Accueil (hero + 2 CTA + 3 stats secteur), Lignes (6 lignes DDD réelles avec statut Disponible/Indisponible, filtres Fluide/Dense/Saturé), Contact (formulaire).
> DESIGN : couleur principale #1565C0, police Inter, responsive mobile 768px.
> DONNÉES : 6 lignes réelles issues de la base UrbanFlow (Ligne 23, Ligne 6, Ligne T05, Ligne 8, Ligne 121, Ligne T06) avec axe et temps de trajet estimé.
> STACK : React + Tailwind CSS + Vite.

**Résumé de la réponse attendue :** Un MVP 3 pages fonctionnel avec navigation fixe, cartes de lignes avec pastille de statut, formulaire de contact.

**Note :** 4/5 — structure correcte et données réelles respectées, mais rendu visuel jugé trop générique (voir itération 3).

**Itération :** Aucune sur ce prompt ; les corrections sont venues des itérations suivantes.

---

## 2. Contraintes anti-cliché IA — Prompt correctif (S4)

**Technique :** Prompt correctif ciblé, une seule préoccupation (éviter les patterns visuels génériques de génération IA)

**Prompt exact (résumé) :**
> Ajoute une section CONTRAINTES ANTI-CLICHÉ IA : pas de dégradé violet/bleu en fond de hero, pas de glassmorphism, pas d'illustrations vectorielles génériques type "undraw", pas de copy générique ("révolutionnez", "next-gen"), un seul emoji dans tout le header, pas d'icônes en cercles dégradés ni de glow, cartes à bords nets (4-8px), chiffres et textes ancrés dans le contexte réel de Dakar.

**Résumé de la réponse attendue :** Le MVP généré évite les clichés de design IA les plus courants tout en gardant les données réelles.

**Note :** 3/5 — a bien évité les clichés (pas de dégradé, pas de glassmorphism) mais a produit un rendu jugé "trop simple" par l'équipe : les contraintes négatives seules ne suffisent pas, il faut aussi des instructions positives de hiérarchie visuelle.

**Itération :** Une itération corrective a suivi (voir prompt 3).

---

## 3. Passe de polish visuel — Prompt correctif détaillé (S4)

**Technique :** Prompt correctif détaillé, découpé par zone d'écran (hero, cartes, hiérarchie générale, typographie)

**Prompt exact (résumé) :**
> Le design actuel est trop plat et générique. Améliore-le sans tomber dans les clichés IA : fond hero bleu foncé avec motif de routes stylisées à 8% d'opacité, titre 56-64px avec un mot clé en couleur accent, carte flottante illustrant un exemple concret ("Ligne 23 · 45 min · Trafic dense"), icône bus par ligne, bordure gauche colorée selon le statut, élévation au survol, section chiffres sur fond gris clair, typographie à deux graisses distinctes (700/400).

**Résumé de la réponse attendue :** Plus de relief et de hiérarchie visuelle, sans retomber dans les gradients/glassmorphism.

**Note :** 4/5 — nette amélioration de la lisibilité et de la structure, mais l'équipe a ensuite préféré changer complètement de direction visuelle (voir itération 4).

**Itération :** Remplacée par l'itération suivante, basée sur une vraie référence de marque.

---

## 4. Rebranding aux couleurs officielles DDD — Prompt basé sur une référence réelle (S4)

**Technique :** Prompt basé sur une référence externe (recherche web du vrai site demdikk.sn, confirmant le rebranding 2025 de Dakar Dem Dikk aux couleurs nationales)

**Prompt exact (résumé) :**
> Refais l'identité visuelle en t'inspirant du vrai site Dakar Dem Dikk (demdikk.sn) : couleur principale #00853F (vert, identité DDD/couleurs nationales), accent jaune #FDEF42 (badge "dense"), accent rouge #E31B23 (badge "saturé"/indisponible), fine bande tricolore sous le header, bordure gauche des cartes colorée par statut, boutons contour vert devenant pleins au survol. Pas d'illustrations ni de photos de bus.

**Résumé de la réponse attendue :** Un MVP dont l'identité visuelle est crédible car ancrée dans la vraie identité de marque DDD (recherchée et sourcée), pas inventée.

**Note :** 5/5 — la recherche préalable (rebranding DDD confirmé par plusieurs sources de presse sénégalaise) a permis un prompt bien plus convaincant que des choix de couleur arbitraires ; résout aussi la critique "trop simple" en donnant une vraie identité au produit.

**Itération :** Aucune itération supplémentaire nécessaire après cette passe ; version retenue pour L1/L2.

---

GET409-UrbanFlow — GET 409 — Swiss UMEF University — Campus de Dakar
