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

// Lit le corps JSON en refusant ce qui depasse MAX_OCTETS. Retourne null si invalide.
async function lireCorps(request) {
  const annonce = Number(request.headers.get('Content-Length') || 0);
  if (annonce > MAX_OCTETS) return { tropGros: true };
  const texte = await request.text();
  if (new TextEncoder().encode(texte).length > MAX_OCTETS) return { tropGros: true };
  try {
    const b = JSON.parse(texte || '{}');
    return b && typeof b === 'object' && !Array.isArray(b) ? { b } : { b: {} };
  } catch (e) {
    return { b: {} };
  }
}

// Limite de requetes : sans binding (wrangler dev ancien, tests), on laisse passer.
async function autorise(limiteur, request) {
  if (!limiteur) return true;
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
    const { b, tropGros } = await lireCorps(request);
    if (tropGros) return erreur(413, 'Requête trop volumineuse.');
    return json(await route.run(env, b));
  },
};
