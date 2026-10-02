// Serveur local : sert public/ et expose /api/analyser-trafic et /api/trajet.
// Les cles (Dify, TomTom) restent ici, cote serveur. Jamais envoyees au navigateur.
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const core = import('./lib/core.mjs');

app.post('/api/analyser-trafic', async (req, res) => {
  const { analyserTrafic } = await core;
  const b = req.body || {};
  const r = await analyserTrafic(process.env, b.query, b.donneesTrafic);
  res.status(r.status).json(r.body);
});

app.post('/api/trajet', async (req, res) => {
  const { tempsTrajet } = await core;
  const r = await tempsTrajet(process.env, req.body);
  res.status(r.status).json(r.body);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => console.log(`UrbanFlow sur http://localhost:${PORT}`));
