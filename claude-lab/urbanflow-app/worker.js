// Point d'entree Cloudflare Worker : memes routes API, fichiers statiques via ASSETS.
import { analyserTrafic, tempsTrajet } from './lib/core.mjs';

const json = (r) => new Response(JSON.stringify(r.body), {
  status: r.status,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method === 'POST' && pathname === '/api/analyser-trafic') {
      const b = await request.json().catch(() => ({}));
      return json(await analyserTrafic(env, b.query, b.donneesTrafic));
    }
    if (request.method === 'POST' && pathname === '/api/trajet') {
      const b = await request.json().catch(() => ({}));
      return json(await tempsTrajet(env, b));
    }
    return env.ASSETS.fetch(request);
  },
};
