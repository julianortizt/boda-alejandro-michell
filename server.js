const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Configurar conexión a Supabase (PostgreSQL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
    try {
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
                    wedding_date: "2027-02-20T16:00:00",
                    couple_name: "Alejandro & Michell",
                    venue_name: "Basílica de Santa María de Guadalupe",
                    venue_address: "Fray Juan de Zumárraga No. 1, Villa Gustavo A. Madero, 07050 Ciudad de México, CDMX",
                    coordinates: "19.432608, -99.133209",
                    reception_name: "Hacienda de los Morales",
                    reception_address: "Av. Miguel Ángel Quevedo 111, Vértiz Narvarte, 03600 Ciudad de México, CDMX",
                    whatsapp_number: "5216641117035",
                    story_text: "Nos conocimos en la Ciudad de México en el 2019, compartiendo sueños y construyendo amor. Hoy, gracias a Jehova, celebramos nuestra unión en esta hermosa ciudad llena de historia y tradición.",
                    verse_text: "El amor es paciente, es bondadoso... El amor nunca deja de ser.",
                    verse_reference: "1 Corintios 13:4-8",
                    selected_theme: "limon",
                    theme_text: "🍋 Nuestra boda con limones - Blanco, Verde Menta y Amarillo 🍋",
                    gallery_message: "📸 Las fotos de nuestra boda estarán disponibles después del 13 de mayo de 2027"
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
            console.log('✅ Datos iniciales insertados');
        }
        console.log('✅ Base de datos conectada y lista');
    } catch (err) {
        console.error('❌ Error inicializando base de datos:', err.message);
        throw err;
    }
}

async function getData() {
    const result = await pool.query('SELECT config, rsvps, photos FROM wedding_data LIMIT 1');
    return result.rows[0];
}

async function saveData(config, rsvps, photos) {
    await pool.query(
        'UPDATE wedding_data SET config = $1, rsvps = $2, photos = $3, updated_at = NOW()',
        [config, rsvps, photos]
    );
}

// Endpoints API
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
        const attendees = (data.rsvps || []).filter(r => r.attending === true);
        res.json({
            total: attendees.length,
            sent: attendees.length,
            details: attendees.map(g => ({ name: g.name, status: 'simulado' }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Iniciar servidor
initDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📱 Web pública: http://localhost:${PORT}`);
        console.log(`🔧 Panel admin: http://localhost:${PORT}/admin.html`);
        console.log(`🗄️ Base de datos: Supabase (PostgreSQL) 🍋`);
    });
}).catch(err => {
    console.error('❌ No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
});

module.exports = app;