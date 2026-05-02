const express = require('express');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Configurar conexión a PostgreSQL
let pool = null;
let isUsingLocalFile = false;

async function initDatabase() {
    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
        });
        await pool.query('SELECT NOW()');
        console.log('✅ Conectado a PostgreSQL');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS wedding_data (
                id SERIAL PRIMARY KEY,
                config JSONB NOT NULL DEFAULT '{}',
                rsvps JSONB NOT NULL DEFAULT '[]',
                photos JSONB NOT NULL DEFAULT '[]',
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        const result = await pool.query('SELECT * FROM wedding_data LIMIT 1');
        if (result.rows.length === 0) {
            const defaultData = {
                config: {
                    wedding_date: "2026-05-12T15:00:00",
                    couple_name: "Alejandro & Michell",
                    venue_name: "Basílica de Santa María de Guadalupe",
                    venue_address: "Fray Juan de Zumárraga No. 1, Villa Gustavo A. Madero, 07050 Ciudad de México, CDMX",
                    coordinates: "19.432608, -99.133209",
                    reception_name: "Hacienda de los Morales",
                    reception_address: "Av. Miguel Ángel Quevedo 111, Vértiz Narvarte, 03600 Ciudad de México, CDMX",
                    whatsapp_number: "5216641117035",
                    story_text: "Nos conocimos en la Ciudad de México en el 2019, compartiendo sueños y construyendo amor. Hoy, gracias a Jehova, celebramos nuestra unión.",
                    verse_text: "El amor es paciente, es bondadoso... El amor nunca deja de ser.",
                    verse_reference: "1 Corintios 13:4-8",
                    selected_theme: "blancoDorado"
                },
                rsvps: [],
                photos: [
                    { id: "1", url: "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg", caption: "Preparativos" },
                    { id: "2", url: "https://images.pexels.com/photos/261956/pexels-photo-261956.jpeg", caption: "Anillos" }
                ]
            };
            await pool.query(
                'INSERT INTO wedding_data (config, rsvps, photos) VALUES ($1, $2, $3)',
                [defaultData.config, defaultData.rsvps, defaultData.photos]
            );
        }
    } catch (err) {
        console.log('⚠️ No se pudo conectar a PostgreSQL, usando archivo local');
        isUsingLocalFile = true;
    }
}

async function getData() {
    if (pool && !isUsingLocalFile) {
        const result = await pool.query('SELECT config, rsvps, photos FROM wedding_data LIMIT 1');
        return result.rows[0];
    } else {
        const dataPath = path.join(__dirname, 'data.json');
        if (fs.existsSync(dataPath)) {
            return JSON.parse(fs.readFileSync(dataPath));
        }
        return { config: {}, rsvps: [], photos: [] };
    }
}

async function saveData(config, rsvps, photos) {
    if (pool && !isUsingLocalFile) {
        await pool.query(
            'UPDATE wedding_data SET config = $1, rsvps = $2, photos = $3, updated_at = NOW()',
            [config, rsvps, photos]
        );
    } else {
        const dataPath = path.join(__dirname, 'data.json');
        fs.writeFileSync(dataPath, JSON.stringify({ config, rsvps, photos }, null, 2));
    }
}

// Servir archivos estáticos
app.use(express.static('.'));

// Endpoints
app.get('/get-data', async (req, res) => {
    try {
        const data = await getData();
        res.setHeader('Cache-Control', 'no-cache');
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/save-rsvp', async (req, res) => {
    try {
        const data = await getData();
        data.rsvps = req.body.rsvps;
        await saveData(data.config, data.rsvps, data.photos);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/save-data', async (req, res) => {
    try {
        await saveData(req.body.config, req.body.rsvps, req.body.photos);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/send-reminders', async (req, res) => {
    try {
        const data = await getData();
        const { daysBefore, testMode, message } = req.body;
        const attendees = (data.rsvps || []).filter(r => r.attending === true);
        
        const results = {
            total: attendees.length,
            sent: attendees.length,
            details: attendees.map(g => ({ name: g.name, status: testMode ? 'simulado' : 'pendiente' }))
        };
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Iniciar servidor
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📱 Web pública: http://localhost:${PORT}`);
        console.log(`🔧 Panel admin: http://localhost:${PORT}/admin.html`);
        console.log(`📁 Modo: ${isUsingLocalFile ? 'ARCHIVO LOCAL' : 'POSTGRESQL'}`);
    });
});

module.exports = app;