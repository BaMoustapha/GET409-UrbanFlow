# Rapport comparatif — Moovit, Dakar Dem Dikk, SunuBRT (pour UrbanFlow)

Date d'observation : 30/09/2026, page d'accueil uniquement, desktop 1440×900, via Playwright.
Captures : `moovit.png`, `demdikk.png`, `demdikk-cta.png`, `sunubrt.png` (dossier du projet).
Couleurs = valeurs CSS calculées (`getComputedStyle`). Rien d'autre que la page d'accueil n'a été analysé (tarifs, app, pages internes non visités).

## Limites de l'observation
- UrbanFlow : aucune info fournie sur le produit. Les recommandations partent des constats ci-dessous, pas d'une connaissance d'UrbanFlow.
- Moovit affichait « Dakar » (ville détectée) et un carrousel de 4 slides ; seul le contenu textuel des slides a été relevé.
- SunuBRT : la capture est en partie masquée par deux bandeaux cookies ; le hero est un slider (slogan en wolof visible : « ñëp a ngi ci birr… », texte coupé sur la capture).
- Dem Dikk : le hero est une image-affiche ; les chiffres cités viennent de cette image.

## Tableau comparatif

| | Moovit | Dakar Dem Dikk | SunuBRT |
|---|---|---|---|
| **Message** | « Get Anywhere With Moovit in Dakar » / « Plan, pay, and ride with the #1 mobility app » ; « World's #1 Mobility App » | Hero = affiche « NOUVELLE DESTINATION Dakar ⇄ Guinguineo » ; description meta : « Vivez une expérience inédite à bord des bus Dem Dikk… » ; « Vous chercher le meilleur service de Transport ? Voyager avec Dem Dikk partout en toute sécurité » | « Bus Rapid Transit — Le transport haute qualité entre Dakar et Guédiawaye » ; meta : « Le futur du transport urbain au Sénégal… Bus 100% électriques » |
| **Couleurs** | Blanc `#FFFFFF`, orange `#FF6400` (bouton recherche), jaune `#FFC645` (hero), bleu `#1A65E5` (bouton « Download Moovit »), texte `#292A30` | Teal `#4A968B` (boutons, hero), barre haute sombre, bandeau CTA bleu nuit, jaune vif (logo, titres du hero) | Vert `#00884B` (fond hero, boutons), jaune `#EFCF1B` (bouton Info Trafic), crème `#FFFDF3` |
| **Bouton principal** | Recherche d'itinéraire : champs « Start / End » + bouton loupe orange, au-dessus de l'écran. Secondaire : « Get the app » (blanc, texte sombre) | « RESERVEZ UNE PLACE » (teal `#4A968B`, texte blanc), en bas de page ; son `href` est `https://demdikk.sn/#` (pas de destination réelle observée) | Pas de CTA unique. Boutons visibles : « Zéro Harcèlement dans les Transports » (vert, slide), « Info Trafic » (jaune), lien « Horaires des lignes et arrêts » |
| **Offre** | App gratuite ; Moovit+ (« Start free trial » : sans pub, suivi de ligne, partage de trajet, contacts sécurité) ; billets longue distance dans « over 40 countries » ; eSIM « Save 25 % », code MOOVIT | Bus urbains et interurbains ; réservation via app Dem Dikk, tél. 33 824 10 10 ou site ; exemples de prix sur l'affiche : Guinguineo 5000 FCFA, Gossas 4000, Bambey 3000 ; 7 nouveaux arrêts interurbains annoncés | BRT 100 % électrique ; lignes B1 Omnibus (23 stations), B2 Semi-Express, B3 Semi-Express, B4 Express « Prochainement » ; 7j/7, 6h–21h, passage toutes les 6 min ; boutique, compte, carte à associer |
| **Preuves / confiance** | « Over 1 million 5-star ratings », avis clients, données officielles | Compteurs (voyageurs annuels, destinations, % clients satisfaits, projets) : valeurs affichées « 0 » au chargement | « Plus de 99 % de satisfaction » (actualité, 23 juin 2026), FAQ avec horaires et numéro 818 55 55 55 |

## Constats notables
1. Seul Moovit met la **planification de trajet** (départ/arrivée) au premier écran.
2. Dem Dikk et SunuBRT communiquent surtout **l'offre de l'opérateur** ; l'accès aux horaires passe par le menu ou un lien.
3. Dem Dikk : le texte de la page contient, en bas, une longue liste de mots-clés de casino/paris en ligne (« toto », « slot gacor »…) et des liens externes. Vérifié le 30/09/2026 : 203 liens de ce type, positionnés hors écran (environ -9900 px du haut de page) donc invisibles pour un visiteur, avec des cibles sur des domaines externes sans rapport. Ça ressemble à de l'injection de liens SEO (site probablement compromis) ; je n'ai pas visité ces cibles ni cherché la cause. À signaler, pas à imiter.
4. Les trois sites affichent des éléments qui gênent le premier écran ou ne fonctionnent pas encore (bandeaux cookies chez SunuBRT, lien `#` chez Dem Dikk, compteurs à 0 au chargement).
5. Consoles navigateur : Dem Dikk 4 erreurs, SunuBRT 15 erreurs / 6 avertissements (non analysées en détail).

## 5 recommandations pour UrbanFlow
1. **Un seul CTA principal, au premier écran, avec un vrai lien.** Moovit y arrive avec un champ départ/arrivée + bouton orange ; SunuBRT en montre plusieurs sans hiérarchie ; le CTA de Dem Dikk pointe sur `#`. Choisir l'action n°1 d'UrbanFlow et la relier à une destination fonctionnelle.
2. **Donner la réponse « quand est mon prochain bus ? » sans passer par le menu.** Chez Dem Dikk et SunuBRT, horaires et lignes sont derrière un menu ou un lien secondaire. Moovit les met en avant (« View Real-Time Arrivals »).
3. **Afficher des chiffres concrets et vérifiables.** SunuBRT donne fréquence (6 min) et amplitude (6h–21h, 7j/7) ; Moovit donne « 1 million de notes 5 étoiles ». Dem Dikk affiche des compteurs qui montrent « 0 » au chargement. Publier des chiffres sourcés, visibles immédiatement.
4. **Se différencier par une palette propre.** Orange/jaune (Moovit), teal/jaune (Dem Dikk) et vert/jaune (SunuBRT) sont déjà pris ; le jaune revient chez les trois. Éviter jaune + vert/teal/orange comme couple dominant, et garder un fort contraste texte/fond pour le bouton principal.
5. **Garder la page d'accueil propre et légère.** SunuBRT superpose deux bandeaux cookies et un chatbot sur le hero ; Dem Dikk laisse un bloc de liens parasites en bas de page. Un seul bandeau de consentement, pas d'éléments flottants sur le hero, et un pied de page sans contenu tiers non maîtrisé.

## Sources
- https://moovitapp.com/ · https://demdikk.sn/ · https://www.sunubrt.sn/ (consultés le 30/09/2026)
