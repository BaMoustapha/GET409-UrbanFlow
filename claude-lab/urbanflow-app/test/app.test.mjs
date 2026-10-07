// Tests de l'app UrbanFlow (node --test). Aucun appel reseau : fetch est remplace par des faux serveurs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ligneCitee, repondreReseau, contexteReseau } from '../lib/guide.mjs';
import { enrichirRequete, analyserTrafic, filtrerTemps, niveauCongestion, resultatDeRepli, distanceMetres, horsDakar, tempsTrajet } from '../lib/core.mjs';
import worker from '../worker.js';

const vraiFetch = globalThis.fetch;
const avecFetch = async (faux, fn) => { globalThis.fetch = faux; try { return await fn(); } finally { globalThis.fetch = vraiFetch; } };

test('un numéro de lieu n’est pas pris pour une ligne', () => {
  assert.equal(ligneCitee('combien de minutes pour aller à Liberté 5'), null);
  assert.equal(ligneCitee('temps Palais 2'), null);
  assert.equal(ligneCitee('temps ligne 8').n, '8');
  assert.equal(ligneCitee('l8 matin').n, '8');
  assert.equal(enrichirRequete('Liberté 5 vers Plateau'), 'Liberté 5 vers Plateau');
  assert.equal(enrichirRequete('ligne 7 à 18h'), 'ligne7 ligne7 18h');
});

test('guide réseau : ligne directe et arrêts', () => {
  assert.match(repondreReseau('Ouakam vers Plateau'), /Ligne 7 : Ouakam ↔ Palais 2/);
  assert.match(repondreReseau('arrêts ligne 7'), /38 arrêts/);
});

test('niveau de circulation', () => {
  assert.equal(niveauCongestion(20, 20).niveau, 'fluide');
  assert.equal(niveauCongestion(34, 21).niveau, 'très dense');
  assert.equal(niveauCongestion(50, 20).niveau, 'bloqué');
});

test('le secours retire tout temps chiffré', () => {
  const t = filtrerTemps('FICHE TRAJET\nLigne 7\nTEMPS DE TRAJET\nEnviron 35 min\nANALYSE\nok');
  assert.doesNotMatch(t, /35 min/);
  assert.match(t, /non publié/);
});

test('Gemini prend le relais quand Dify échoue', async () => {
  const appels = [];
  const r = await avecFetch(async (url, opt) => {
    appels.push(String(url));
    if (String(url).includes('dify')) return new Response('{}', { status: 401 });
    assert.ok(opt.headers['x-goog-api-key'], 'clé dans l’en-tête');
    assert.ok(!String(url).includes('key='), 'jamais de clé dans l’URL');
    assert.match(JSON.parse(opt.body).contents[0].parts[0].text, /Gare Ouakam/);
    return Response.json({ candidates: [{ content: { parts: [{ text: 'FICHE TRAJET\nLigne 7' }] } }] });
  }, () => analyserTrafic({ DIFY_API_KEY: 'x', GEMINI_API_KEY: 'y' }, 'ligne 7, quels quartiers ?'));
  assert.equal(r.status, 200);
  assert.equal(r.body.source, 'secours');
  assert.equal(appels.length, 2);
});

test('pas d’appel au modèle si rien n’est reconnu', async () => {
  assert.equal(contexteReseau('xyzzy blabla'), '');
  const r = await avecFetch(async (url) => {
    if (String(url).includes('dify')) return new Response('{}', { status: 500 });
    throw new Error('Gemini ne doit pas être appelé');
  }, () => analyserTrafic({ DIFY_API_KEY: 'x', GEMINI_API_KEY: 'y' }, 'xyzzy blabla'));
  assert.match(r.body.outputs, /^INSUFFISANT/);
});

test('Worker : limite de requêtes, taille, méthode', async () => {
  let n = 0;
  const env = { ASSETS: { fetch: () => new Response('page') }, LIMITE_AGENT: { limit: async () => ({ success: ++n <= 1 }) } };
  const post = (body) => new Request('https://x/api/analyser-trafic', { method: 'POST', body, headers: { 'CF-Connecting-IP': '1.2.3.4', 'Content-Type': 'application/json' } });
  assert.equal((await worker.fetch(post('{"query":"arrêts ligne 7"}'), env)).status, 200);
  assert.equal((await worker.fetch(post('{"query":"arrêts ligne 7"}'), env)).status, 429);
  n = 0;
  assert.equal((await worker.fetch(post('x'.repeat(20000)), env)).status, 413);
  assert.equal((await worker.fetch(new Request('https://x/api/trajet'), env)).status, 405);
  assert.equal(await (await worker.fetch(new Request('https://x/lignes'), env)).text(), 'page');
});

test('Worker : JSON exigé, corps en morceaux plafonné, limite absente tolérée', async () => {
  const env = { ASSETS: { fetch: () => new Response('page') } };
  const avertissements = []; const vraiWarn = console.warn; console.warn = (m) => avertissements.push(m);
  try {
  // Content-Type absent ou text/plain : refusé avant toute lecture du corps.
  const texte = new Request('https://x/api/analyser-trafic', { method: 'POST', body: '{"query":"arrêts ligne 7"}', headers: { 'Content-Type': 'text/plain' } });
  assert.equal((await worker.fetch(texte, env)).status, 415);
  // Corps envoyé en morceaux, sans Content-Length : arrêté au plafond de 10 ko.
  const flux = new ReadableStream({ start(c) { for (let i = 0; i < 30; i++) c.enqueue(new TextEncoder().encode('x'.repeat(1000))); c.close(); } });
  const gros = new Request('https://x/api/analyser-trafic', { method: 'POST', body: flux, duplex: 'half', headers: { 'Content-Type': 'application/json' } });
  assert.equal(gros.headers.get('Content-Length'), null);
  assert.equal((await worker.fetch(gros, env)).status, 413);
  // Sans binding de limite : la requête passe (le Worker le signale une seule fois dans les journaux).
    const ok = new Request('https://x/api/analyser-trafic', { method: 'POST', body: '{"query":""}', headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    assert.equal((await worker.fetch(ok, env)).status, 400);
  } finally { console.warn = vraiWarn; }
  assert.equal(avertissements.length, 1);
});

test('aucune clé ni message de configuration renvoyé au navigateur', async () => {
  const r = await analyserTrafic({}, 'xyzzy blabla');
  assert.doesNotMatch(JSON.stringify(r.body), /DIFY_API_KEY|clé|TOMTOM/i);
  const { readFileSync } = await import('node:fs');
  assert.doesNotMatch(readFileSync(new URL('../public/page-trajet.js', import.meta.url), 'utf8'), /clé TomTom|TOMTOM_API_KEY/i);
});

test('fichiers de données Dify importables : ni affluence, ni clé', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const dossier = new URL('../dify/', import.meta.url);
  const importables = readdirSync(dossier).filter((x) => /^urbanflow_.*.(md|csv)$/.test(x));
  assert.ok(importables.length >= 3, 'fichiers importables trouvés');
  for (const f of importables) {
    const t = readFileSync(new URL(f, dossier), 'utf8');
    assert.doesNotMatch(t, /affluence/i, f + ' : l’affluence est retirée du projet (archive dans dify/archive/)');
    assert.doesNotMatch(t, /AIza[0-9A-Za-z_-]{20,}|gsk_[A-Za-z0-9]{20,}|app-[A-Za-z0-9]{20,}/, f);
  }
});

test('guide réseau : formulations courtes, "jusqu\'au" et numéro de ligne seul', () => {
  for (const q of ['Ouakam Plateau', 'Plateau Ouakam', 'Ouakam/Plateau', 'bus Ouakam Plateau', 'ligne pour Ouakam Plateau svp', "Ouakam jusqu'au Plateau", 'Yoff Plateau', 'Parcelles Assainies Plateau']) {
    assert.match(repondreReseau(q) || '', /^LIGNES POSSIBLES/, q);
  }
  assert.match(repondreReseau('Ouakam Plateau'), /Ligne 7 : Ouakam ↔ Palais 2/);
  for (const q of ['8', 'l8', 'ligne 8', 'l8 matin', 'bus 18 soir']) assert.match(repondreReseau(q) || '', /^Ligne \d+ :/, q);
  assert.match(repondreReseau('999'), /introuvable/);
  // Ce que le guide ne doit pas capter : il laisse l'agent (ou la règle suivante) répondre.
  for (const q of ['18h', '2026', 'bonjour', 'Météo demain à Dakar ?', 'Ouakam Plateau horaires', 'combien de temps Ouakam Plateau', 'prix du ticket ligne 8']) {
    assert.equal(repondreReseau(q), null, q);
  }
});

test('trajet : lieu inconnu ramené à la ville, même lieu, hors de Dakar', async () => {
  // TomTom répond la ville elle-même quand il ne reconnaît pas le lieu : refusé ; demander "Dakar" reste accepté.
  const ville = { type: 'Geography', entityType: 'Municipality', address: { freeformAddress: 'Dakar, Dakar', municipality: 'Dakar' } };
  assert.equal(resultatDeRepli(ville, 'Zzzzqx'), true);
  assert.equal(resultatDeRepli(ville, 'Dakar'), false);
  assert.equal(resultatDeRepli({ type: 'Geography', entityType: 'MunicipalitySubdivision', address: { freeformAddress: 'Dakar Plateau, Dakar' } }, 'Plateau'), false);
  assert.equal(resultatDeRepli({ type: 'POI', address: { freeformAddress: 'Université Cheikh Anta Diop, Dakar' } }, 'UCAD'), false);
  assert.equal(resultatDeRepli({ type: 'Geography', entityType: 'Municipality', address: { freeformAddress: 'Rufisque, Dakar' } }, 'Rufisque'), false);
  assert.equal(resultatDeRepli({ address: {} }, 'x'), false, 'champs absents : on accepte');
  // Distance et région.
  assert.ok(distanceMetres({ lat: 14.7, lng: -17.4 }, { lat: 14.7, lng: -17.4 }) < 1);
  assert.ok(Math.abs(distanceMetres({ lat: 14.7, lng: -17.4 }, { lat: 14.8, lng: -17.4 }) - 11120) < 200);
  assert.equal(horsDakar({ lat: 14.72, lng: -17.47 }), false);
  assert.equal(horsDakar({ lat: 14.79, lng: -16.92 }), true, 'Thiès');
  // Même lieu : refus avant tout calcul d'itinéraire (un seul appel de géocodage, pas d'appel de route).
  const appels = [];
  const r = await avecFetch(async (url) => {
    appels.push(String(url));
    return Response.json({ results: [{ type: 'Street', position: { lat: 14.67, lon: -17.43 }, address: { freeformAddress: 'Plateau, Dakar' } }] });
  }, () => tempsTrajet({ TOMTOM_API_KEY: 'x' }, { depart: 'Plateau', arrivee: 'Plateau' }));
  assert.equal(r.body.statut, 'meme_lieu');
  assert.ok(!appels.some((u) => u.includes('calculateRoute')), 'aucun calcul d’itinéraire');
});

test('trajet : la recherche floue retrouve un lieu que le géocodage remplace par la ville', async () => {
  const ville = { type: 'Geography', entityType: 'Municipality', address: { freeformAddress: 'Dakar, Dakar' }, position: { lat: 14.6954, lon: -17.4486 } };
  const marche = { type: 'POI', poi: { name: 'Marché Sandaga' }, address: { freeformAddress: 'Président Lamine Guèye, Dakar' }, position: { lat: 14.6695, lon: -17.4374 } };
  const route = { routes: [{ summary: { travelTimeInSeconds: 600, noTrafficTravelTimeInSeconds: 600, trafficDelayInSeconds: 0, lengthInMeters: 5000 }, legs: [{ points: [{ latitude: 14.67, longitude: -17.43 }, { latitude: 14.7, longitude: -17.45 }] }] }] };
  const faux = (rechercheFloue) => async (url) => {
    const u = String(url);
    if (u.includes('/search/2/geocode/')) return Response.json({ results: [ville] });
    if (u.includes('/search/2/search/')) return Response.json({ results: rechercheFloue });
    if (u.includes('calculateRoute')) return Response.json(route);
    return Response.json({ incidents: [] });
  };
  const arrivee = { lat: 14.70, lng: -17.45 };
  const ok = await avecFetch(faux([marche]), () => tempsTrajet({ TOMTOM_API_KEY: 'x' }, { depart: 'Sandaga test', arrivee }));
  assert.equal(ok.body.statut, 'ok');
  assert.match(ok.body.depart.label, /Marché Sandaga/);
  assert.equal(ok.body.depart.lat, 14.6695, 'position du marché, pas du centre-ville');
  // Rien de plus précis que la ville nulle part : lieu introuvable, pas d'itinéraire depuis le centre-ville.
  const inconnu = await avecFetch(faux([]), () => tempsTrajet({ TOMTOM_API_KEY: 'x' }, { depart: 'Zzzzqx test', arrivee }));
  assert.equal(inconnu.body.statut, 'not_found');
});

test('pages : description, page 404 et cible tactile du zoom', async () => {
  const { readdirSync, readFileSync, existsSync } = await import('node:fs');
  const dossier = new URL('../public/', import.meta.url);
  for (const f of readdirSync(dossier).filter((x) => x.endsWith('.html'))) {
    const t = readFileSync(new URL(f, dossier), 'utf8');
    assert.match(t, /<meta name="description" content="[^"]{30,}"/, f + ' : description manquante');
    assert.match(t, /<title>[^<]{5,}<\/title>/, f);
  }
  assert.ok(existsSync(new URL('404.html', dossier)), '404.html');
  assert.match(readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8'), /not_found_handling\s*=\s*"404-page"/);
  assert.match(readFileSync(new URL('style.css', dossier), 'utf8'), /\.leaflet-control-zoom|\.leaflet-bar a\{[^}]*44px/);
});

test('aucune clé ni affluence dans l’interface', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const dossier = new URL('../public/', import.meta.url);
  for (const f of readdirSync(dossier).filter((x) => /\.(html|js)$/.test(x))) {
    const t = readFileSync(new URL(f, dossier), 'utf8');
    assert.doesNotMatch(t, /AIza[0-9A-Za-z_-]{20,}|gsk_[A-Za-z0-9]{20,}|app-[A-Za-z0-9]{20,}/, f);
    assert.doesNotMatch(t, /affluence|y a-t-il du monde/i, f);
    if (f.endsWith('.html')) assert.doesNotMatch(t, /<script>(?!<\/script>)/, f + ' : script inline interdit par la CSP');
  }
});
