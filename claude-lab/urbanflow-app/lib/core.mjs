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

// ---------- Agent Dify ----------
const DEMO = {
  '8': "FICHE TRAJET\nLigne 8 : Aéroport LSS (Yoff) vers Palais 2.\n\nTEMPS DE TRAJET\n24 à 45 minutes selon l'heure.\n\nANALYSE\nExemple de démonstration, non issu du workflow en direct.\n\nALERTES\nHeures de pointe : durée proche du haut de la fourchette.\n\nRECOMMANDATIONS\nPartez avant 7h30 ou après 9h30.",
  '18': "FICHE TRAJET\nLigne 18 : Dieuppeul vers Centre-ville.\n\nTEMPS DE TRAJET\n18 à 35 minutes selon l'heure.\n\nANALYSE\nExemple de démonstration, non issu du workflow en direct.\n\nALERTES\nHeures de pointe : durée proche du haut de la fourchette.\n\nRECOMMANDATIONS\nPartez avant 7h30 ou après 9h30.",
};

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
  if (!env.DIFY_API_KEY) {
    return { status: 500, body: { error: 'Clé Dify absente (DIFY_API_KEY).' } };
  }

  const inputs = { query };
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
      return { status: 502, body: { error: "L'agent n'a pas pu répondre, réessayez." } };
    }
    const out = data.data ? data.data.outputs : data.outputs || data;
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

export async function tempsTrajet(env, body) {
  if (!env.TOMTOM_API_KEY) return { status: 200, body: { statut: 'no_key' } };
  try {
    const a = await point(env, body && body.depart);
    const b = await point(env, body && body.arrivee);
    if (!a || !b) return { status: 200, body: { statut: 'not_found' } };

    const k = `r:${a.lat.toFixed(4)},${a.lng.toFixed(4)}:${b.lat.toFixed(4)},${b.lng.toFixed(4)}`;
    let res = cacheGet(k);
    if (!res) {
      const url = `${base(env)}/routing/1/calculateRoute/${a.lat},${a.lng}:${b.lat},${b.lng}/json?key=${env.TOMTOM_API_KEY}&traffic=true&travelMode=car&computeTravelTimeFor=all`;
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
      };
      cacheSet(k, res);
    }
    return { status: 200, body: { statut: 'ok', depart: a, arrivee: b, ...res } };
  } catch (e) {
    return { status: 200, body: { statut: 'unavailable' } };
  }
}
