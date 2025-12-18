const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8089;
const TARGET = process.env.EMAIL_API_TARGET || 'http://192.168.246.110:8088/email/enviar-correo';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:8000,https://cheerful-sopapillas-d44bf5.netlify.app')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: function (origin, cb) {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  maxAge: 3600
}));

app.options('/email/enviar-correo', (req, res) => {
  res.status(204).end();
});

app.post('/email/enviar-correo', async (req, res) => {
  try {
    const { destinatarios, asunto, cuerpo } = req.body || {};
    if (!Array.isArray(destinatarios) || !destinatarios.length || typeof asunto !== 'string' || typeof cuerpo !== 'string') {
      return res.status(400).json({ ok: false, error: 'payload invalido' });
    }
    const r = await fetch(TARGET, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': '*/*' },
      body: JSON.stringify({ destinatarios, asunto, cuerpo })
    });
    const text = await r.text();
    const isJson = (r.headers.get('content-type') || '').includes('application/json');
    if (!r.ok) {
      return res.status(r.status).send(isJson ? JSON.parse(text) : text);
    }
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return res.status(200).send(text);
    }
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true, target: TARGET, origins: ALLOWED_ORIGINS });
});

app.listen(PORT, () => {
  console.log(`Email proxy server listening on http://localhost:${PORT}`);
});
