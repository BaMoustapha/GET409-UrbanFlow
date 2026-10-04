// Serveur local : sert public/ et expose /api/analyser-trafic et /api/trajet.
// Les cles (Dify, TomTom, Gemini) restent ici, cote serveur. Jamais envoyees au navigateur.
// Memes protections que le Worker : 10 ko maximum, limite de requetes par minute.
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

// En-tetes de securite : memes regles qu'en production, lues dans public/_headers (bloc /*).
const fs = require('fs');
const ENTETES = {};
let dansBloc = false;
for (const l of fs.readFileSync(path.join(__dirname, 'public', '_headers'), 'utf8').split(/\r?\n/)) {
  if (/^\S/.test(l)) { dansBloc = l.trim() === '/*'; continue; }
  const m = l.match(/^\s+([\w-]+):\s*(.+)$/);
  if (dansBloc && m) ENTETES[m[1]] = m[2];
}
app.use((req, res, next) => { res.set(ENTETES); next(); });
app.get('/_headers', (req, res) => res.status(404).end());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

const core = import('./lib/core.mjs');

// Limite simple en memoire : max requetes par minute et par adresse, par route.
function limite(max) {
  const compteurs = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const k = req.ip;
    const e = compteurs.get(k);
    if (!e || now - e.t > 60000) compteurs.set(k, { t: now, n: 1 });
    else if (++e.n > max) return res.status(429).json({ error: 'Trop de requêtes. Attendez une minute avant de réessayer.' });
    if (compteurs.size > 1000) compteurs.clear();
    next();
  };
}

app.post('/api/analyser-trafic', limite(10), async (req, res) => {
  const { analyserTrafic } = await core;
  const b = req.body || {};
  const r = await analyserTrafic(process.env, b.query, b.donneesTrafic);
  res.set('Cache-Control', 'no-store').status(r.status).json(r.body);
});

app.post('/api/trajet', limite(20), async (req, res) => {
  const { tempsTrajet } = await core;
  const r = await tempsTrajet(process.env, req.body);
  res.set('Cache-Control', 'no-store').status(r.status).json(r.body);
});

// Corps trop gros ou JSON invalide : message clair au lieu de la page d'erreur Express.
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Requête trop volumineuse.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Requête invalide.' });
  next(err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => console.log(`UrbanFlow sur http://localhost:${PORT}`));
