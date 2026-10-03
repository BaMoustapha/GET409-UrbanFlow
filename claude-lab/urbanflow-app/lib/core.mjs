// Logique serveur partagee entre Express (local) et Cloudflare Worker (production).
// Aucune cle ici : tout vient de l'objet env (variables d'environnement / secrets).

const TTL_MS = 5 * 60 * 1000;
const cache = new Map();
function cacheGet(k) {
  const e = cache.get(k);
  if (e && Date.now() - e.t < TTL_MS) return e.v;
  cache.delete(k);
  return null;
}
function cacheSet(k, v) {
  if (cache.size > 200) cache.clear();
  cache.set(k, { t: Date.now(), v });
}

async function fetchJson(url, options = {}, ms = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

import { repondreReseau, estQuestionTemps, ligneCitee, extremites } from './guide.mjs';

// ---------- Agent Dify ----------
const MOTS_VIDES = new Set(('le la les un une de du des d l au aux a à en et ou &  vers pour par sur dans depuis jusqu jusque avec sans ' +
  'je tu il elle on nous vous me te se mon ma mes ton ta tes son sa ses ce cet cette ces qui que quoi dont où ' +
  'veux voudrais voulez aller va vais prendre pris prend est sont suis quel quelle quels quelles combien comment quand ' +
  'temps trajet trajets duree durée dure mets met mettre faut combien minutes minute min heure heures bus ligne lignes ' +
  'svp stp merci bonjour salut bonsoir donne donnez dis dites infos info information informations ' +
  'matin soir midi aujourd hui demain actuellement maintenant').split(/\s+/).filter(Boolean));

// Tolère les requêtes courtes ou mal écrites : "8", "l8", "bus 8 matin", "ligne 18 ouakam plateau 18h".
// L'index inversé de Dify ignore les mots d'un seul caractère ("ligne 7" ne retrouve rien) et les mots courants
// font remonter toutes les lignes. La base indexe des jetons "ligne7" ; quand on repère une ligne, on envoie une
// requête compacte : jetons + heures + noms de lieux. Sans ligne repérée, la question part telle quelle.
export function enrichirRequete(q) {
  q = String(q).trim();
  const jetons = [];
  const add = (n) => { const j = 'ligne' + n.toLowerCase(); if (!jetons.includes(j)) jetons.push(j); };
  const re = /(?:\b(?:lignes?|bus|n°|no|num[ée]ro)\s*\.?\s*|\bl\s*(?=\d))(t?\d{1,3}[a-z]?)\b/gi;
  for (const m of q.matchAll(re)) add(m[1]);
  // listes : "ligne 8 et 18", "8, 18 ou 121"
  if (jetons.length) for (const m of q.matchAll(/(?:\bet|\bou|&|,)\s*(\d{1,3}[a-z]?)\b(?!\s*(?:h|:|min|km))/gi)) add(m[1]);
  // numéro seul : "8", "18 ouakam" (un nombre qui n'est ni une heure, ni une durée)
  if (!jetons.length) {
    for (const m of q.matchAll(/(?<![\d:.])\b(t?\d{1,3}[a-gi-z]?)\b(?!\s*(?:h|:|min|km|m\b|mn|heures?))/gi)) add(m[1]);
  }
  if (!jetons.length) return q;
  const heures = [...q.matchAll(/\b(\d{1,2})\s*(?:h|:)\s*(\d{2})?(?!\w)/gi)].map((m) => m[1] + 'h' + (m[2] || ''));
  if (!heures.length) {
    if (/\bmatin\b/i.test(q)) heures.push('8h');
    else if (/\bsoir\b/i.test(q)) heures.push('18h');
  }
  const sans = q.replace(re, ' ').replace(/\b\d{1,2}\s*(?:h|:)\s*\d{0,2}/gi, ' ').replace(/\b\d+[a-z]?\b/gi, ' ');
  const lieux = (sans.match(/[\p{L}][\p{L}'-]*/gu) || [])
    .filter((w) => w.length >= 3 && !MOTS_VIDES.has(w.toLowerCase()))
    .slice(0, 6);
  return [...jetons, ...jetons, ...heures, ...lieux].join(' ');
}

const DEMO = {
  '8': "FICHE TRAJET\nLigne 8 : Aéroport LSS (Yoff) vers Palais 2.\n\nTEMPS DE TRAJET\n24 à 45 minutes selon l'heure.\n\nANALYSE\nExemple de démonstration, non issu du workflow en direct.\n\nALERTES\nHeures de pointe : durée proche du haut de la fourchette.\n\nRECOMMANDATIONS\nPartez avant 7h30 ou après 9h30.",
  '18': "FICHE TRAJET\nLigne 18 : Dieuppeul vers Centre-ville.\n\nTEMPS DE TRAJET\n18 à 35 minutes selon l'heure.\n\nANALYSE\nExemple de démonstration, non issu du workflow en direct.\n\nALERTES\nHeures de pointe : durée proche du haut de la fourchette.\n\nRECOMMANDATIONS\nPartez avant 7h30 ou après 9h30.",
};


// Questions de temps ("temps ligne 8", "combien de minutes ligne 7") : le calcul est fait par TomTom entre les deux terminus de la ligne.
async function reponseTemps(env, query) {
  if (!estQuestionTemps(query)) return null;
  const l = ligneCitee(query);
  const ext = l && extremites(l);
  if (!ext) return null;
  const r = await tempsTrajet(env, { depart: ext[0] + ', Dakar', arrivee: ext[1] + ', Dakar' });
  const b = r.body;
  const tete = `TEMPS DE TRAJET\nLigne ${l.n} : ${l.trajet}\n`;
  if (b.statut !== 'ok') {
    const msg = b.statut === 'no_key' ? "Le calcul de trajet n'est pas activé." : b.statut === 'not_found' ? "Les terminus de cette ligne n'ont pas pu être localisés sur la carte." : 'Le service de trafic est indisponible pour le moment.';
    return tete + msg + " Les horaires et le temps en bus ne sont pas publiés. Réessayez dans un instant ou utilisez le calcul de trajet avec deux adresses.";
  }
  const hh = new Date(b.calculeA).toISOString().slice(11, 16);
  const c = b.congestion ? b.congestion.niveau : 'non évaluée';
  return tete + `En voiture avec le trafic actuel entre les deux terminus (${ext[0]} et ${ext[1]}) : ${b.voitureMin} min (${b.distanceKm} km).\nSans trafic : ${b.habituelMin} min. Circulation : ${c}.\nCe n'est pas le temps en bus (non publié) : c'est une référence de l'état de la route. Calculé à ${hh} (heure de Dakar).\nHeures de pointe habituelles : ${l.pointe}.`;
}

export async function analyserTrafic(env, query, donneesTrafic) {
  query = String(query || '').trim().slice(0, 500);
  donneesTrafic = String(donneesTrafic || '').trim().slice(0, 256);
  if (!query) return { status: 400, body: { error: 'Question vide.' } };

  if (env.DEMO_MODE === '1') {
    const m = query.match(/\b(8|18)\b/);
    return m
      ? { status: 200, body: { outputs: DEMO[m[1]], demo: true } }
      : { status: 200, body: { outputs: "INSUFFISANT : mode démonstration, seules les lignes 8 et 18 sont disponibles.", demo: true } };
  }
  // Questions sur le réseau (quelle ligne prendre, arrêts d'une ligne) : réponse directe depuis les données, sans IA.
  const temps = await reponseTemps(env, query);
  if (temps) return { status: 200, body: { outputs: temps, source: 'tomtom' } };
  const direct = repondreReseau(query);
  if (direct) return { status: 200, body: { outputs: direct, source: 'reseau' } };
  if (!env.DIFY_API_KEY) {
    return { status: 500, body: { error: 'Clé Dify absente (DIFY_API_KEY).' } };
  }

  const inputs = { query: enrichirRequete(query) };
  if (donneesTrafic) inputs.donnees_trafic = donneesTrafic;
  try {
    const r = await fetchJson(env.DIFY_API_URL || 'https://api.dify.ai/v1/workflows/run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.DIFY_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs, response_mode: 'blocking', user: 'urbanflow-web' }),
    }, 30000);
    if (!r.ok) return { status: 502, body: { error: 'Service temporairement indisponible.' } };
    const data = await r.json();
    if (data.data && data.data.status && data.data.status !== 'succeeded') {
      if (/rate limit/i.test(String(data.data.error || ''))) {
        return { status: 429, body: { error: "L'agent a atteint sa limite de requêtes. Réessayez dans quelques minutes." } };
      }
      return { status: 502, body: { error: "L'agent n'a pas pu répondre, réessayez." } };
    }
    let out = data.data ? data.data.outputs : data.outputs || data;
    // Dify renvoie un objet {nom_de_variable: texte} : on garde le premier texte.
    if (out && typeof out === 'object') {
      const texte = Object.values(out).find((v) => typeof v === 'string' && v.trim());
      if (texte) out = texte;
    }
    return { status: 200, body: { outputs: out } };
  } catch (err) {
    if (err.name === 'AbortError') return { status: 504, body: { error: 'La réponse prend trop de temps, réessayez.' } };
    return { status: 502, body: { error: 'Service temporairement indisponible.' } };
  }
}

// ---------- Trajet A -> B (TomTom, avec trafic) ----------
const base = (env) => env.TOMTOM_BASE || 'https://api.tomtom.com';

async function geocoder(env, texte) {
  const k = 'g:' + texte.toLowerCase();
  const c = cacheGet(k);
  if (c) return c;
  const url = `${base(env)}/search/2/geocode/${encodeURIComponent(texte + ', Dakar')}.json?key=${env.TOMTOM_API_KEY}&countrySet=SN&limit=1&language=fr-FR`;
  const r = await fetchJson(url);
  if (!r.ok) throw new Error('geocode ' + r.status);
  const j = await r.json();
  const p = j.results && j.results[0];
  if (!p) return null;
  const v = { lat: p.position.lat, lng: p.position.lon, label: (p.address && p.address.freeformAddress) || texte };
  cacheSet(k, v);
  return v;
}

async function point(env, p) {
  if (p && typeof p === 'object' && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
    return { lat: p.lat, lng: p.lng, label: p.label || `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` };
  }
  const t = String(p || '').trim().slice(0, 120);
  if (!t) return null;
  return geocoder(env, t);
}

// Niveau de congestion : rapport entre le temps avec trafic et le temps sans trafic.
export function niveauCongestion(voitureMin, habituelMin) {
  if (!habituelMin || habituelMin <= 0) return null;
  const ratio = voitureMin / habituelMin;
  const niveau = ratio < 1.15 ? 'fluide' : ratio < 1.4 ? 'dense' : ratio < 1.8 ? 'très dense' : 'bloqué';
  return { niveau, ratio: Math.round(ratio * 100) / 100 };
}

const CATEGORIES = { 1: 'Accident', 2: 'Brouillard', 3: 'Conditions dangereuses', 4: 'Pluie', 5: 'Verglas', 6: 'Bouchon', 7: 'Voie fermée', 8: 'Route fermée', 9: 'Travaux', 10: 'Vent', 11: 'Inondation', 14: 'Véhicule en panne' };

// Incidents routiers TomTom le long du trace. Jamais bloquant : renvoie null si le service échoue.
async function incidentsSurTrace(env, trace) {
  if (!trace || !trace.length) return [];
  const lats = trace.map((q) => q[0]), lngs = trace.map((q) => q[1]);
  const m = 0.01;
  const bbox = [Math.min(...lngs) - m, Math.min(...lats) - m, Math.max(...lngs) + m, Math.max(...lats) + m].map((x) => x.toFixed(4)).join(',');
  const k = 'i:' + bbox;
  const c = cacheGet(k);
  if (c) return c;
  const fields = encodeURIComponent('{incidents{geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description},from,to,delay,length}}}');
  const url = `${base(env)}/traffic/services/5/incidentDetails?key=${env.TOMTOM_API_KEY}&bbox=${bbox}&fields=${fields}&language=fr-FR&timeValidityFilter=present`;
  const r = await fetchJson(url);
  if (!r.ok) throw new Error('incidents ' + r.status);
  const j = await r.json();
  const proche = (lat, lng) => trace.some((q) => Math.abs(q[0] - lat) < 0.004 && Math.abs(q[1] - lng) < 0.004);
  const out = [];
  for (const inc of j.incidents || []) {
    const g = inc.geometry || {}, pr = inc.properties || {};
    const pts = g.type === 'Point' ? [g.coordinates] : (g.coordinates || []);
    if (!pts.some((pt) => Array.isArray(pt) && proche(pt[1], pt[0]))) continue;
    const ev = (pr.events && pr.events[0] && pr.events[0].description) || '';
    out.push({
      type: CATEGORIES[pr.iconCategory] || 'Incident',
      description: String(ev).slice(0, 120),
      de: String(pr.from || '').slice(0, 80),
      vers: String(pr.to || '').slice(0, 80),
      retardMin: pr.delay ? Math.round(pr.delay / 60) : 0,
      gravite: pr.magnitudeOfDelay || 0,
    });
  }
  out.sort((x, y) => y.gravite - x.gravite);
  const res = out.slice(0, 5);
  cacheSet(k, res);
  return res;
}

// Heure de depart future (5 min a 7 jours) au format TomTom, sinon null (= maintenant).
function departAt(v) {
  const t = new Date(v).getTime();
  if (!v || !Number.isFinite(t)) return null;
  const now = Date.now();
  if (t < now + 5 * 60 * 1000 || t > now + 7 * 24 * 3600 * 1000) return null;
  return new Date(t).toISOString().slice(0, 19) + '+00:00';
}

export async function tempsTrajet(env, body) {
  if (!env.TOMTOM_API_KEY) return { status: 200, body: { statut: 'no_key' } };
  try {
    const a = await point(env, body && body.depart);
    const b = await point(env, body && body.arrivee);
    if (!a || !b) return { status: 200, body: { statut: 'not_found' } };

    const dep = departAt(body && body.departAt);
    const k = `r:${a.lat.toFixed(4)},${a.lng.toFixed(4)}:${b.lat.toFixed(4)},${b.lng.toFixed(4)}:${dep || 'now'}`;
    let res = cacheGet(k);
    if (!res) {
      const url = `${base(env)}/routing/1/calculateRoute/${a.lat},${a.lng}:${b.lat},${b.lng}/json?key=${env.TOMTOM_API_KEY}&traffic=true&travelMode=car&computeTravelTimeFor=all`
        + (dep ? `&departAt=${encodeURIComponent(dep)}` : '');
      const r = await fetchJson(url);
      if (!r.ok) throw new Error('route ' + r.status);
      const j = await r.json();
      const rt = j.routes && j.routes[0];
      if (!rt) return { status: 200, body: { statut: 'not_found' } };
      const s = rt.summary;
      res = {
        voitureMin: Math.round(s.travelTimeInSeconds / 60),
        habituelMin: Math.round((s.noTrafficTravelTimeInSeconds || s.travelTimeInSeconds) / 60),
        retardMin: Math.round((s.trafficDelayInSeconds || 0) / 60),
        distanceKm: Math.round(s.lengthInMeters / 100) / 10,
        trace: (rt.legs || []).flatMap((l) => l.points || []).filter((_, i) => i % 3 === 0).map((q) => [q.latitude, q.longitude]),
        calculeA: new Date().toISOString(),
        previsionPour: dep,
      };
      cacheSet(k, res);
    }
    // Les incidents TomTom sont ceux du moment : inutiles (et trompeurs) pour une prevision a une heure future.
    let incidents = null;
    if (!res.previsionPour) {
      try { incidents = await incidentsSurTrace(env, res.trace); } catch (e) { incidents = null; }
    }
    return { status: 200, body: { statut: 'ok', depart: a, arrivee: b, ...res, congestion: niveauCongestion(res.voitureMin, res.habituelMin), incidents } };
  } catch (e) {
    return { status: 200, body: { statut: 'unavailable' } };
  }
}
