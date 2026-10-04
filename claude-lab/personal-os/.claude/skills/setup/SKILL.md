---
name: setup
description: Installe le Personal OS sur ce PC (fichiers locaux du vault) puis remplit SOUL.md par une interview. Se lance seulement avec /setup.
disable-model-invocation: true
---
# /setup

1. Crée ce qui manque, sans rien écraser :
   - `vault/sources/`, `vault/me/`, `vault/business/`, `vault/people/`, `vault/projects/`
   - `vault/index.md` (titre « Index » et une section par dossier), `vault/log.md` (titre « Journal »), `vault/errors.md` (titre « Erreurs et correctifs », colonnes date, symptôme, cause, correctif)
   - `SOUL.md` copié depuis `SOUL.template.md`
2. Ajoute à `vault/log.md` : `- AAAA-MM-JJ : installation du Personal OS (/setup)`.
3. Vérifie avec `git check-ignore SOUL.md vault/log.md` que ces fichiers sont bien ignorés. Sinon, arrête-toi et préviens.
4. Interview pour SOUL.md : une question à la fois, 10 maximum : rôle, organisations, 5 priorités classées, longueur, formalité, niveau technique, 3 vraies phrases écrites par Moustapha, règles de voix, ce qu'il ne veut jamais voir.
5. Écris SOUL.md : phrases citées mot pour mot, rien d'ajouté qu'il n'a pas dit, moins de 2 Ko. Affiche la taille en octets.
