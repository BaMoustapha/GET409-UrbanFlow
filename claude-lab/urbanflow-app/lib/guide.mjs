// Réponses déterministes (sans IA) aux questions sur le réseau : quelle ligne prendre, arrêts d'une ligne.
// Tout vient de reseau.mjs : rien n'est inventé. Retourne null si la question n'est pas de ce type.
import { LIGNES, ARRETS } from './reseau.mjs';

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
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
  const t = l.t8 ? `Voiture (Google Maps, vendredi) : 8h ${l.t8}, 18h ${l.t18}.` : 'Temps non relevé.';
  return `Ligne ${l.n} : ${l.trajet}${l.verif ? ' (trajet à vérifier)' : ''}\n${ctx ? ctx + '\n' : ''}${t}\nAffluence typique : ${l.aff || 'non renseignée'}.`;
}

const SIGLES = new Set(['ucad', 'bceao', 'hlm', 'lss', 'aibd', 'ter', 'sos', 'bhs', 'bicis', 'ipress', 'uvs', 'imt', 'pt1']);
const joli = (s) => s.split(' ').map((w) => (SIGLES.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
const NOTE = "Limites : pas d'horaires, de prix ni de position des bus (Dakar Dem Dikk ne les publie pas). Seules les lignes directes sont proposées.";

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

// Détection du type de question. Retourne un texte de réponse, ou null pour laisser l'agent IA répondre.
export function repondreReseau(question) {
  const q = ' ' + String(question).trim() + ' ';
  const qn = norm(q);

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
  let m = qn.match(/\b(?:de|depuis|du)\s+(.+?)\s+(?:a|au|aux|vers|pour|jusqu a|jusqu au)\s+(.+)$/) || qn.match(/^(.+?)\s+(?:vers|jusqu a|pour aller a|pour)\s+(.+)$/);
  if (!m) m = String(question).match(/^\s*(.+?)\s*(?:->|→|=>|>)\s*(.+?)\s*$/);
  if (m) { dep = m[1]; arr = m[2]; }
  else {
    const m2 = qn.match(/\b(?:aller|va|vais|rendre|arriver|rejoindre|rejoins)\s+(?:a|au|aux|vers|chez)\s+(.+)$/) || qn.match(/^(?:a|au|vers)\s+(.+)$/);
    if (m2) arr = m2[1];
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
  const r = lignesPassantPar(arr);
  if (!r.length) return `Lieu non reconnu dans nos données : ${arr}.\nEssayez un arrêt ou un quartier proche (ex : Plateau, Médina, Ouakam).\n\n${NOTE}`;
  return `LIGNES QUI DESSERVENT : ${arr}\n\n` + r.slice(0, 6).map((x) => ficheLigne(x.ix.l, '')).join('\n\n')
    + `\n\nPrécisez votre point de départ pour savoir laquelle prendre.\n\n${NOTE}`;
}
