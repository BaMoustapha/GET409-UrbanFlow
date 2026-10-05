// Tests de l'app UrbanFlow (node --test). Aucun appel reseau : fetch est remplace par des faux serveurs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ligneCitee, repondreReseau, contexteReseau } from '../lib/guide.mjs';
import { enrichirRequete, analyserTrafic, filtrerTemps, niveauCongestion } from '../lib/core.mjs';
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
