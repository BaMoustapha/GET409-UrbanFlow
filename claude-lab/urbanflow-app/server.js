// Petit serveur local : sert index.html et proxifie l'appel a Dify.
// La cle Dify reste ici, cote serveur. Elle n'est jamais envoyee au navigateur.
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const DIFY_API_URL = process.env.DIFY_API_URL || 'https://api.dify.ai/v1/workflows/run';
const DIFY_API_KEY = process.env.DIFY_API_KEY || '';

app.post('/api/analyser-trafic', async (req, res) => {
  const query = (req.body && req.body.query || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Question vide.' });
  }
  if (!DIFY_API_KEY) {
    return res.status(500).json({ error: "Cle Dify absente. Ajoute DIFY_API_KEY dans .env (voir .env.example)." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const r = await fetch(DIFY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: { query },
        response_mode: 'blocking',
        user: 'user-urbanflow-' + Date.now(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!r.ok) {
      return res.status(502).json({ error: 'Service temporairement indisponible.' });
    }
    const data = await r.json();
    return res.json({ outputs: data.data ? data.data.outputs : data.outputs || data });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'La reponse prend trop de temps, reessayez.' });
    }
    return res.status(502).json({ error: 'Service temporairement indisponible.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`UrbanFlow serveur local sur http://localhost:${PORT}`));
