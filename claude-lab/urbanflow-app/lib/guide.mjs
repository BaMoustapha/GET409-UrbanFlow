// Réponses déterministes (sans IA) aux questions sur le réseau : quelle ligne prendre, arrêts d'une ligne.
// Tout vient de reseau.mjs : rien n'est inventé. Retourne null si la question n'est pas de ce type.
import { LIGNES, ARRETS } from './reseau.mjs';

export const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const VIDES = new Set('de du des la le les un une en au aux a face gare arret station rue pres devant'.split(' '));
const jetons = (s) => norm(s).split(' ').filter((w) => w && !VIDES.has(w));

const parLigne = new Map(LIGNES.map((l) => [l.n.toLowerCase(), l]));
const index = LIGNES.map((l) => {
  const arrets = (ARRETS[l.n] || []).map((a, i) => ({ nom: a, ordre: i, j: new Set(jetons(a)) }));
  const term = String(l.trajet).split('↔').map((x) => x.trim());
  const zones = String(l.zones).split(/\s*[>/]\s*/).filter(Boolean);
  return {
    l, arrets,
    termini: term.map((t) => new Set(jetons(t))),
    zones: zones.map((z) => new Set(jetons(z))),
    capt: String(l.terminus).split('->').map((x) => x.trim()),
  };
});

const contient = (grand, petit) => petit.size > 0 && [...petit].every((w) => grand.has(w));

// Une ligne dessert un lieu si un arrêt, un terminus ou une zone le contient. force : 3 arrêt/terminus, 2 zone.
function desserte(ix, lieu) {
  const P = new Set(jetons(lieu));
  if (!P.size) return null;
  let meilleur = null;
  for (const a of ix.arrets) if (contient(a.j, P)) { meilleur = { force: 3, ordre: a.ordre, nom: a.nom }; break; }
  if (!meilleur) ix.termini.forEach((t, i) => { if (!meilleur && contient(t, P)) meilleur = { force: 3, ordre: i ? ix.arrets.length : 0, nom: ix.l.trajet.split('↔')[i].trim() }; });
  if (!meilleur && ix.zones.some((z) => contient(z, P))) meilleur = { force: 2, ordre: null, nom: lieu };
  return meilleur;
}

function ficheLigne(l, ctx) {
  return `Ligne ${l.n} : ${l.trajet}${l.verif ? ' (trajet à vérifier)' : ''}\n${ctx ? ctx + '\n' : ''}${l.zones ? 'Zones traversées : ' + l.zones + '.\n' : ''}Heures de pointe habituelles : ${l.pointe}.`;
}

const SIGLES = new Set(['ucad', 'bceao', 'hlm', 'lss', 'aibd', 'ter', 'sos', 'bhs', 'bicis', 'ipress', 'uvs', 'imt', 'pt1']);
const joli = (s) => s.split(' ').map((w) => (SIGLES.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
const NOTE = "Limites : pas d'horaires, de prix ni de position des bus (Dakar Dem Dikk ne les publie pas). Seules les lignes directes sont proposées. Pour le temps de trajet en voiture avec le trafic actuel, utilisez le calcul de trajet.";

export function lignesEntre(depart, arrivee) {
  const res = [];
  for (const ix of index) {
    const d = desserte(ix, depart), a = desserte(ix, arrivee);
    if (!d || !a) continue;
    let ctx = '';
    if (d.ordre !== null && a.ordre !== null && d.ordre !== a.ordre) {
      const [t1, t2] = ix.capt.length === 2 ? ix.capt : ix.l.trajet.split('↔');
      ctx = d.ordre < a.ordre ? `Sens : ${t1} vers ${t2}.` : `Sens : ${t2} vers ${t1}.`;
      ctx += ` Montée : ${d.nom}. Descente : ${a.nom}.`;
    }
    res.push({ ix, force: Math.min(d.force, a.force), score: d.force + a.force, ctx });
  }
  res.sort((x, y) => y.score - x.score || x.ix.l.n.localeCompare(y.ix.l.n, 'fr', { numeric: true }));
  return res;
}

export function lignesPassantPar(lieu) {
  return index.map((ix) => ({ ix, d: desserte(ix, lieu) })).filter((x) => x.d).sort((x, y) => y.d.force - x.d.force);
}

// Mots sans valeur de lieu dans une question courte ("bus Ouakam Plateau svp", "ligne pour Yoff Plateau").
const BRUIT = new Set('ligne lignes bus quelle quel quels quelles prendre prend aller va vais veux voudrais je pour par depuis vers jusqu jusque svp stp s il vous plait merci bonjour salut et ou'.split(' '));

// Deux lieux connus côte à côte, sans mot de liaison ("Ouakam Plateau", "Yoff/Palais 2", "Guédiawaye > Plateau").
// Tous les mots restants doivent former exactement deux lieux que le réseau connaît : sinon null (l'agent IA répond).
function deuxLieux(texte) {
  const mots = norm(texte).split(' ').filter((w) => w && !BRUIT.has(w));
  if (mots.length < 2 || mots.length > 6) return null;
  for (let k = 1; k < mots.length; k++) {
    const g = mots.slice(0, k).join(' '), d = mots.slice(k).join(' ');
    if (lignesPassantPar(g).length && lignesPassantPar(d).length) return [joli(g), joli(d)];
  }
  return null;
}

// Réponse pour un numéro de ligne seul ("8", "l8 matin", "ligne 18") : fiche de la ligne, sans IA.
function ficheCourte(l) {
  const arrets = ARRETS[l.n];
  const bornes = String(l.terminus).split('->').map((x) => x.trim());
  return ficheLigne(l, '')
    + (arrets ? `\nArrêts : ${arrets.length}, de ${bornes[0]} à ${bornes[1] || ''}. Écrivez « arrêts ligne ${l.n} » pour la liste.` : '\nArrêts : non relevés dans nos données.')
    + `\n\nPour le temps de trajet en voiture avec le trafic actuel, écrivez « temps ligne ${l.n} » ou utilisez le calcul de trajet. Le temps en bus n'est pas publié.`;
}

// Détection du type de question. Retourne un texte de réponse, ou null pour laisser l'agent IA répondre.
export function repondreReseau(question) {
  const q = ' ' + String(question).trim() + ' ';
  const qn = norm(q);

  // 0. Un numéro de ligne seul ("8", "l8", "ligne 18", "bus 7 matin") : fiche de la ligne, sans IA.
  const mL = qn.match(/^(?:lignes? ?|bus ?|l ?|n ?)?(t?\d{1,3}[a-gi-z]?)(?: (?:matin|soir|midi|aujourd hui|demain))?$/);
  if (mL) {
    const l = parLigne.get(mL[1]);
    return l ? ficheCourte(l) : `Ligne ${mL[1].toUpperCase()} introuvable dans nos données.`;
  }

  // 1. Arrêts d'une ligne
  const mA = qn.match(/\b(?:arrets?|stations?)\b.*?\b(?:ligne|bus|l)?\s*(t?\d{1,3}[a-z]?)\b/) || qn.match(/\b(?:ligne|bus|l)\s*(t?\d{1,3}[a-z]?)\b.*?\b(?:arrets?|stations?)\b/);
  if (mA && /\b(arrets?|stations?)\b/.test(qn)) {
    const l = parLigne.get(mA[1]);
    const liste = l && ARRETS[l.n];
    if (!l) return `Ligne ${mA[1].toUpperCase()} introuvable dans nos données.`;
    if (!liste) return `Les arrêts de la ligne ${l.n} ne sont pas encore dans nos données (disponibles : lignes ${Object.keys(ARRETS).join(', ')}).\n\nTrajet officiel : ${l.trajet}.\nZones traversées : ${l.zones}.`;
    return `Ligne ${l.n} : ${l.trajet}${l.verif ? ' (trajet à vérifier)' : ''}\n${liste.length} arrêts dans l'ordre de ${l.terminus.split('->')[0].trim()} vers ${(l.terminus.split('->')[1] || '').trim()} :\n` + liste.map((a, i) => `${i + 1}. ${a}`).join('\n');
  }

  // 2. Aller de A vers B
  let dep = null, arr = null;
  let m = qn.match(/\b(?:de|depuis|du)\s+(.+?)\s+(?:a|au|aux|vers|pour|jusqu a|jusqu au)\s+(.+)$/) || qn.match(/^(.+?)\s+(?:vers|jusqu a|jusqu au|jusqu aux|pour aller a|pour)\s+(.+)$/);
  if (!m) m = String(question).match(/^\s*(.+?)\s*(?:->|→|=>|>)\s*(.+?)\s*$/);
  if (m) { dep = m[1]; arr = m[2]; }
  else {
    const m2 = qn.match(/\b(?:aller|va|vais|rendre|arriver|rejoindre|rejoins)\s+(?:a|au|aux|vers|chez)\s+(.+)$/) || qn.match(/^(?:a|au|vers)\s+(.+)$/);
    if (m2) arr = m2[1];
  }
  // Deux lieux côte à côte ("Ouakam Plateau") : seulement si la question ne cite pas de ligne ni ne pose une autre question.
  if (!m && !arr && !/\b(?:ligne|bus)\s*\d/.test(qn) && !/\b(?:combien|temps|minutes?|prix|tarif|horaires?|heures?|monde|affluence|retard|comment|pourquoi|quand)\b/.test(qn)) {
    const dl = deuxLieux(question);
    if (dl) { dep = dl[0]; arr = dl[1]; }
  }
  if (!arr || /^(?:quel|quelle|quels|quelles|combien|comment|quand|qui|quoi|pourquoi|est ce|y a)\b/.test(arr)) return null;
  // Si la question cite une ligne, c'est une fiche de ligne : laisser l'agent.
  if (/\b(?:ligne|bus)\s*\d/.test(qn)) return null;
  const nettoie = (s) => String(s).replace(/\b(?:comment|je|veux|voudrais|quel|quelle|bus|ligne|prendre|aller|va|vais|svp|stp|s il vous plait|combien|temps|a|au)\b/gi, ' ').replace(/[?!.,]/g, ' ').replace(/\s+/g, ' ').trim();
  arr = joli(nettoie(arr)); dep = dep ? joli(nettoie(dep)) : null;
  if (!arr || (!jetons(arr).length)) return null;

  if (dep && jetons(dep).length) {
    const r = lignesEntre(dep, arr);
    if (!r.length) {
      const inconnus = [dep, arr].filter((x) => !lignesPassantPar(x).length);
      return inconnus.length
        ? `Aucune ligne directe trouvée. Lieu non reconnu dans nos données : ${inconnus.join(', ')}.\nEssayez un arrêt ou un quartier proche (ex : Plateau, Médina, Ouakam).\n\n${NOTE}`
        : `Aucune ligne directe trouvée entre ${dep} et ${arr} dans nos données. Une correspondance serait nécessaire, mais nous n'avons pas les données pour la proposer.\n\n${NOTE}`;
    }
    const top = r.slice(0, 5);
    return `LIGNES POSSIBLES : ${dep} vers ${arr}\n\n` + top.map((x) => ficheLigne(x.ix.l, x.ctx)).join('\n\n')
      + (r.length > top.length ? `\n\n(${r.length - top.length} autre(s) ligne(s) possible(s) non listée(s).)` : '')
      + `\n\n${NOTE}`;
  }
  // Un seul "lieu" inconnu qui contient en fait deux lieux ("ligne pour Ouakam Plateau svp").
  if (!lignesPassantPar(arr).length) {
    const dl = deuxLieux(arr);
    const e = dl ? lignesEntre(dl[0], dl[1]) : [];
    if (e.length) {
      return `LIGNES POSSIBLES : ${dl[0]} vers ${dl[1]}\n\n` + e.slice(0, 5).map((x) => ficheLigne(x.ix.l, x.ctx)).join('\n\n')
        + (e.length > 5 ? `\n\n(${e.length - 5} autre(s) ligne(s) possible(s) non listée(s).)` : '') + `\n\n${NOTE}`;
    }
  }
  const r = lignesPassantPar(arr);
  if (!r.length) return `Lieu non reconnu dans nos données : ${arr}.\nEssayez un arrêt ou un quartier proche (ex : Plateau, Médina, Ouakam).\n\n${NOTE}`;
  return `LIGNES QUI DESSERVENT : ${arr}\n\n` + r.slice(0, 6).map((x) => ficheLigne(x.ix.l, '')).join('\n\n')
    + `\n\nPrécisez votre point de départ pour savoir laquelle prendre.\n\n${NOTE}`;
}

// ---------- Question de temps sur une ligne (le calcul est fait par TomTom, voir core.mjs) ----------
export function estQuestionTemps(question) {
  return /\b(temps|dur[ée]e|dure|combien de minutes|minutes|mn|long|rapide|vite)\b/i.test(String(question));
}

// Noms de lieux qui contiennent un numéro ("Liberté 5", "Palais 2", "Rue 11", "UCAD 2") : le numéro n'est pas une ligne.
const LIEUX_NUMEROTES = new Set();
for (const l of LIGNES) for (const t of [l.trajet, l.zones, l.terminus, ...(ARRETS[l.n] || [])]) {
  for (const m of norm(t).matchAll(/([a-z]+) (\d{1,3}[a-z]?)\b/g)) LIEUX_NUMEROTES.add(m[1] + ' ' + m[2]);
}
// Vrai si le numéro à la position idx de la question normalisée fait partie d'un nom de lieu.
export function numeroDeLieu(qn, idx, num) {
  const avant = qn.slice(0, idx).trim().split(' ').pop();
  return !!avant && LIEUX_NUMEROTES.has(avant + ' ' + num);
}

// Retourne la ligne citée dans la question ("ligne 8", "l8", "bus 18", "8"), ou null.
// Un numéro seul est ignoré quand il appartient à un nom de lieu ("aller à Liberté 5").
export function ligneCitee(question) {
  const qn = norm(question);
  const m = qn.match(/\b(?:lignes?|bus|l|n|numero)\s*(t?\d{1,3}[a-z]?)\b/);
  if (m) return parLigne.get(m[1]) || null;
  for (const b of qn.matchAll(/(?<![\d:.])\b(t?\d{1,3}[a-gi-z]?)\b(?!\s*(?:h|min|km|mn))/g)) {
    if (numeroDeLieu(qn, b.index, b[1])) continue;
    return parLigne.get(b[1]) || null;
  }
  return null;
}

// Deux extrémités d'une ligne (pour le calcul de trajet). Les boucles prennent les deux premiers lieux distincts.
export function extremites(l) {
  const parts = String(l.trajet).split('↔').map((x) => x.replace(/\(.*?\)/g, '').trim()).filter(Boolean);
  const uniq = [...new Set(parts)];
  return uniq.length >= 2 ? [uniq[0], uniq[1]] : null;
}

// ---------- Contexte pour le modèle de secours (Gemini) ----------
// Extrait du réseau lié à la question : la ligne citée (avec ses arrêts) ou les lignes qui desservent les lieux nommés.
// Chaîne vide si rien ne correspond : dans ce cas, aucun appel au modèle (rien à lui donner, risque d'invention).
export function contexteReseau(question) {
  const l = ligneCitee(question);
  if (l) {
    const arrets = ARRETS[l.n];
    return ficheLigne(l, '') + (arrets ? `\nArrêts (${arrets.length}, dans l'ordre) : ${arrets.join(', ')}.` : '\nArrêts : non relevés.');
  }
  const mots = jetons(question).filter((w) => w.length >= 4 && !/^\d/.test(w));
  const vues = new Map();
  for (const w of mots) for (const x of lignesPassantPar(w)) if (!vues.has(x.ix.l.n)) vues.set(x.ix.l.n, x.ix.l);
  return [...vues.values()].slice(0, 6).map((x) => ficheLigne(x, '')).join('\n\n');
}
