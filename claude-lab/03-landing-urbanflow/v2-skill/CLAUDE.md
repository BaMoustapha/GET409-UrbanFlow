# CLAUDE.md

## Projet
Landing page one-page pour UrbanFlow, application qui aide les usagers de Dakar Dem Dikk à anticiper la durée réelle de leur trajet malgré les embouteillages quotidiens (projet GET409, UMEF Swiss University, avec Astou).

## Règles de contenu
- Texte en français uniquement.
- Ne jamais inventer de chiffres de trafic, de témoignages usagers ou de partenariats : toute donnée factuelle vient de la base `DakarFlow_Donnees_UrbanFlow.xlsx` ou des sources citées dans `sources-trafic-dakar.md` / `sources-ddd-complet.md`.
- Les lignes DDD affichées (1, 4, 7, 8, 9, 121) sont des lignes urbaines réelles confirmées sur demdikk.sn/info-voyageurs : ne pas en ajouter sans vérification.

## Règles de design
- Identité DDD : vert #00A651 en accent principal, jaune #FDEF42 et rouge #E31B23 réservés aux touches ponctuelles (bande tricolore, bordures d'étapes), jamais en fond plein.
- Fond et texte en tons cassés (off-black / off-white), jamais #000/#FFF purs.
- Titres avec letter-spacing négatif (-0.02 à -0.04em).
- Éviter Inter / Roboto / Poppins / system-ui comme police de titre ; polices actuelles : Fraunces (titres) + Work Sans (texte).
- Garder au moins un détail signature (ici : le bandeau défilant en haut + la bande tricolore).

## Structure du fichier
Une seule page `index.html`, autonome, sans framework ni build step. Le formulaire de contact n'est pas encore connecté à un backend (`onsubmit="return false"`).

## Commandes utiles
Aucune (pas de build). Ouvrir `index.html` directement dans un navigateur pour prévisualiser.
