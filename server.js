const express = require('express');
const path    = require('path');
const { Pool } = require('pg');
const app  = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: '50mb' }));

// ── Servir archivos estáticos desde /public ──────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Pool PostgreSQL (singleton) ──────────────────────────────────────────────
let pool = null;
function getPool() {
    if (!process.env.DATABASE_URL) return null;
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });
        pool.on('error', err => { console.error('Pool error:', err.message); pool = null; });
    }
    return pool;
}

// ── Datos por defecto ────────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
    wedding_date:       "2027-02-20T16:00:00",
    couple_name:        "Michell & Alejandro",
    venue_name:         "Hacienda Santa Clara",
    venue_address:      "Carretera Libre Tijuana - Ensenada Km 30, Valle de Guadalupe, Baja California, México",
    coordinates:        "32.0979, -116.5660",
    reception_name:     "Hacienda Santa Clara",
    reception_address:  "Carretera Libre Tijuana - Ensenada Km 30, Valle de Guadalupe, Baja California, México",
    whatsapp_number:    "5216641117035",
    story_text:         "Nos conocimos en Tijuana en el 2019, compartiendo sueños y construyendo amor. Hoy, gracias a Dios, celebramos nuestra unión en este hermoso país lleno de tradición y calidez.",
    verse_text:         "El amor es paciente, es bondadoso... El amor nunca deja de ser.",
    verse_reference:    "1 Corintios 13:4-8",
    selected_theme:     "limon",
    theme_text:         "🍋 Nuestra boda con limones - Verde menta y amarillo limón 🍋",
    gallery_message:    "📸 Las fotos de nuestra boda estarán disponibles próximamente",
    hero_slides: [
        { url: "https://images.pexels.com/photos/169197/pexels-photo-169197.jpeg",  caption: "" },
        { url: "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg", caption: "" },
        { url: "https://images.pexels.com/photos/261956/pexels-photo-261956.jpeg",   caption: "" }
    ]
};
const DEFAULT_PHOTOS = [
    { id: "1", url: "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg", caption: "Preparativos" },
    { id: "2", url: "https://images.pexels.com/photos/261956/pexels-photo-261956.jpeg",   caption: "Anillos" }
];

// ── DB helpers ───────────────────────────────────────────────────────────────
async function ensureTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS wedding_data (
            id         SERIAL PRIMARY KEY,
            config     JSONB NOT NULL,
            rsvps      JSONB NOT NULL DEFAULT '[]',
            photos     JSONB NOT NULL DEFAULT '[]',
            updated_at TIMESTAMP DEFAULT NOW()
        )
    `);
    const { rows } = await client.query('SELECT COUNT(*) FROM wedding_data');
    if (parseInt(rows[0].count) === 0) {
        await client.query(
            'INSERT INTO wedding_data (config, rsvps, photos) VALUES ($1, $2, $3)',
            [JSON.stringify(DEFAULT_CONFIG), '[]', JSON.stringify(DEFAULT_PHOTOS)]
        );
        console.log('✅ Datos por defecto insertados en DB');
    }
}

async function dbGet() {
    const p = getPool();
    if (!p) return null;
    const client = await p.connect();
    try {
        await ensureTable(client);
        const { rows } = await client.query(
            'SELECT config, rsvps, photos FROM wedding_data ORDER BY id LIMIT 1'
        );
        return rows[0] || null;
    } finally { client.release(); }
}

async function dbSave(config, rsvps, photos) {
    const p = getPool();
    if (!p) return false;
    const client = await p.connect();
    try {
        await ensureTable(client);
        const { rows } = await client.query('SELECT id FROM wedding_data ORDER BY id LIMIT 1');
        if (rows.length === 0) {
            await client.query(
                'INSERT INTO wedding_data (config, rsvps, photos) VALUES ($1, $2, $3)',
                [JSON.stringify(config), JSON.stringify(rsvps), JSON.stringify(photos)]
            );
        } else {
            await client.query(
                'UPDATE wedding_data SET config=$1, rsvps=$2, photos=$3, updated_at=NOW() WHERE id=$4',
                [JSON.stringify(config), JSON.stringify(rsvps), JSON.stringify(photos), rows[0].id]
            );
        }
        return true;
    } finally { client.release(); }
}

// ── Fallback archivo local ───────────────────────────────────────────────────
const fs       = require('fs');
const localFile = path.join(__dirname, 'data.json');

function localRead() {
    try {
        if (fs.existsSync(localFile)) return JSON.parse(fs.readFileSync(localFile, 'utf8'));
    } catch(e) { console.error('localRead:', e.message); }
    return { config: DEFAULT_CONFIG, rsvps: [], photos: DEFAULT_PHOTOS };
}

function localWrite(data) {
    try { fs.writeFileSync(localFile, JSON.stringify(data, null, 2)); }
    catch(e) { console.error('localWrite:', e.message); }
}

// ── Get / Save ───────────────────────────────────────────────────────────────
async function getData() {
    try {
        const row = await dbGet();
        if (row) return row;
    } catch(e) { console.error('DB get:', e.message); }
    return localRead();
}

async function saveData(config, rsvps, photos) {
    try {
        if (await dbSave(config, rsvps, photos)) { console.log('✅ Supabase'); return; }
    } catch(e) { console.error('DB save:', e.message); }
    localWrite({ config, rsvps, photos });
    console.log('💾 data.json local');
}

// ── Rutas API ────────────────────────────────────────────────────────────────
app.get('/get-data', async (req, res) => {
    try {
        const data = await getData();
        res.setHeader('Cache-Control', 'no-store');
        res.json(data);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/save-rsvp', async (req, res) => {
    try {
        const data = await getData();
        data.rsvps = req.body.rsvps || [];
        await saveData(data.config, data.rsvps, data.photos);
        res.json({ ok: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/save-data', async (req, res) => {
    try {
        const { config, rsvps, photos } = req.body;
        if (!config) return res.status(400).json({ error: 'Falta config' });
        await saveData(config, rsvps || [], photos || []);
        res.json({ ok: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/send-reminders', async (req, res) => {
    try {
        const data = await getData();
        const attendees = (data.rsvps || []).filter(r => r.attending === true);
        res.json({ total: attendees.length, sent: attendees.length });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Subir música ─────────────────────────────────────────────────────────────
const multer = require('multer');
const musicDir = path.join(__dirname, 'public', 'music');
if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, musicDir),
    filename:    (req, file, cb) => {
        // Nombre limpio sin espacios
        const clean = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, clean);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB máx
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) cb(null, true);
        else cb(new Error('Solo archivos de audio'));
    }
});

app.post('/upload-music', upload.single('music'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
    res.json({ ok: true, filename: req.file.filename, url: `/music/${req.file.filename}` });
});

app.get('/list-music', (req, res) => {
    try {
        const files = fs.readdirSync(musicDir)
            .filter(f => f.match(/\.(mp3|ogg|wav|m4a)$/i))
            .map(f => ({ filename: f, url: `/music/${f}` }));
        res.json(files);
    } catch(e) { res.json([]); }
});

app.delete('/delete-music/:filename', (req, res) => {
    try {
        const file = path.join(musicDir, req.params.filename);
        if (fs.existsSync(file)) fs.unlinkSync(file);
        res.json({ ok: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Arranque ─────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Servidor en http://localhost:${PORT}`);
    console.log(`   Sitio:  http://localhost:${PORT}/`);
    console.log(`   Admin:  http://localhost:${PORT}/login.html`);
    console.log(`   DB:     ${process.env.DATABASE_URL ? '🗄 Supabase (PostgreSQL)' : '💾 data.json local'}\n`);
});

module.exports = app;
