// Point d'entree Cloudflare Worker : memes routes API, fichiers statiques via ASSETS.
// Protections : limite de requetes par adresse IP (bindings [[ratelimits]] de wrangler.toml),
// taille du corps limitee a 10 ko, JSON uniquement, en-tetes de securite sur les reponses API.
import { analyserTrafic, tempsTrajet } from './lib/core.mjs';

const MAX_OCTETS = 10 * 1024;
const ENTETES = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
};
const json = (r) => new Response(JSON.stringify(r.body), { status: r.status, headers: ENTETES });
const erreur = (status, error) => json({ status, body: { error } });

// Lit le corps JSON en s'arretant des que MAX_OCTETS est depasse, meme sans en-tete Content-Length
// (transfert en morceaux) : le corps n'est jamais lu en entier en memoire avant le controle.
async function lireCorps(request) {
  const annonce = Number(request.headers.get('Content-Length') || 0);
  if (annonce > MAX_OCTETS) return { tropGros: true };
  let texte = '';
  if (request.body) {
    const lecteur = request.body.getReader();
    const decodeur = new TextDecoder();
    let total = 0;
    for (;;) {
      const { done, value } = await lecteur.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_OCTETS) { await lecteur.cancel().catch(() => {}); return { tropGros: true }; }
      texte += decodeur.decode(value, { stream: true });
    }
    texte += decodeur.decode();
  }
  try {
    const b = JSON.parse(texte || '{}');
    return b && typeof b === 'object' && !Array.isArray(b) ? { b } : { b: {} };
  } catch (e) {
    return { b: {} };
  }
}

// Limite de requetes : sans binding (wrangler dev ancien, tests), on laisse passer, mais on le signale
// dans les journaux (une fois par instance) pour qu'une limite absente en production ne passe pas inapercue.
let avertiLimiteurAbsent = false;
async function autorise(limiteur, request) {
  if (!limiteur) {
    if (!avertiLimiteurAbsent) { avertiLimiteurAbsent = true; console.warn('Limite de requetes absente : bindings [[ratelimits]] non actifs.'); }
    return true;
  }
  const ip = request.headers.get('CF-Connecting-IP') || 'inconnu';
  try { return (await limiteur.limit({ key: ip })).success; } catch (e) { return true; }
}

const ROUTES = {
  '/api/analyser-trafic': { limiteur: 'LIMITE_AGENT', run: (env, b) => analyserTrafic(env, b.query, b.donneesTrafic) },
  '/api/trajet': { limiteur: 'LIMITE_TRAJET', run: (env, b) => tempsTrajet(env, b) },
};

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const route = ROUTES[pathname];
    if (!route) return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return erreur(405, 'Méthode non autorisée.');
    if (!await autorise(env[route.limiteur], request)) {
      return erreur(429, 'Trop de requêtes. Attendez une minute avant de réessayer.');
    }
    // JSON uniquement : refuse un POST de formulaire (text/plain, urlencoded) envoye depuis un site tiers.
    if (!/^application\/json\b/i.test(request.headers.get('Content-Type') || '')) return erreur(415, 'Format non pris en charge : JSON attendu.');
    const { b, tropGros } = await lireCorps(request);
    if (tropGros) return erreur(413, 'Requête trop volumineuse.');
    return json(await route.run(env, b));
  },
};
