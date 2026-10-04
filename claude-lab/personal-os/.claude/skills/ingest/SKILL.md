---
name: ingest
description: Lit une source de vault/sources et met à jour les pages du vault (moi, organisations, personnes, projets), l'index et le journal. Se lance avec /ingest <fichier>.
disable-model-invocation: true
---
# /ingest <fichier>

1. Le fichier doit être dans `vault/sources/`. Sinon, demande à Moustapha de l'y copier. Ne le modifie jamais.
2. Lis-le en entier (PDF, docx, texte). Liste ce qu'il contient : rôles, compétences, formations, organisations, personnes, projets, dates.
3. Pour chaque sujet, crée ou mets à jour une page : `vault/me/` (profil, compétences, formation), `vault/business/` (organisations), `vault/people/`, `vault/projects/`. Une page = un sujet ; relie les pages par `[[nom]]`. Première ligne : `Sources : [[sources/<fichier>]]`.
4. N'invente rien. Ignore et ne recopie jamais : numéro de pièce, de carte ou de compte, adresse exacte, téléphone, mot de passe.
5. Mets à jour `vault/index.md` (une ligne par page : lien et résumé de 10 mots maximum).
6. Ajoute à `vault/log.md` : `- AAAA-MM-JJ : /ingest <fichier> : N pages créées, M mises à jour`.
7. Termine par la liste des pages créées ou modifiées.
