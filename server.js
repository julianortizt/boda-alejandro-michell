const express = require('express');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 10000; // Render usa el puerto 10000 por defecto

app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Variable para saber si estamos en modo local (sin DB) o con DB
let dbConnected = false;
let pool = null;

// Datos por defecto para inicializar la boda. ¡Ajusta los valores que quieras!
const DEFAULT_DATA = {
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

// Función para intentar conectar a la base de datos usando DATABASE_URL
async function connectToDatabase() {
    if (!process.env.DATABASE_URL) {
        console.log("⚠️ DATABASE_URL no está definida. Usando almacenamiento local (archivo).");
        return false;
    }

    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
        });
        await pool.query('SELECT NOW()');
        console.log("✅ Conectado a la base de datos (PostgreSQL/Supabase).");

        // Crear la tabla si no existe. Usamos JSONB para los campos de JSON.
        await pool.query(`
            CREATE TABLE IF NOT EXISTS wedding_data (
                id SERIAL PRIMARY KEY,
                config JSONB NOT NULL,
                rsvps JSONB NOT NULL,
                photos JSONB NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("✅ Tabla 'wedding_data' verificada/creada.");

        // Verificar si la tabla está vacía
        const result = await pool.query('SELECT COUNT(*) FROM wedding_data');
        if (parseInt(result.rows[0].count) === 0) {
            console.log("💡 Tabla vacía. Insertando datos por defecto...");
            // Insertar los datos por defecto. Los pasamos como JSON.stringify para asegurar el formato.
            await pool.query(
                'INSERT INTO wedding_data (config, rsvps, photos) VALUES ($1, $2, $3)',
                [JSON.stringify(DEFAULT_DATA.config), JSON.stringify(DEFAULT_DATA.rsvps), JSON.stringify(DEFAULT_DATA.photos)]
            );
            console.log("✅ Datos por defecto insertados.");
        }
        return true;
    } catch (err) {
        console.error("❌ Error conectando a la base de datos:", err.message);
        return false;
    }
}

// Función para leer los datos (desde DB o desde archivo local como fallback)
async function getData() {
    if (dbConnected && pool) {
        try {
            const result = await pool.query('SELECT config, rsvps, photos FROM wedding_data LIMIT 1');
            if (result.rows.length > 0) {
                return result.rows[0];
            } else {
                // Esto no debería pasar si insertamos los datos por defecto, pero por si acaso
                return { config: DEFAULT_DATA.config, rsvps: DEFAULT_DATA.rsvps, photos: DEFAULT_DATA.photos };
            }
        } catch (dbErr) {
            console.error("❌ Error leyendo desde BD, usando archivo local:", dbErr.message);
            return readLocalData();
        }
    } else {
        return readLocalData();
    }
}

// Fallback: leer/escribir en un archivo local (útil para desarrollo local o si falla la DB)
function readLocalData() {
    const fs = require('fs');
    const path = require('path');
    const localFilePath = path.join(__dirname, 'data.json');
    try {
        if (fs.existsSync(localFilePath)) {
            return JSON.parse(fs.readFileSync(localFilePath, 'utf8'));
        }
    } catch(e) { console.error("Error leyendo archivo local:", e); }
    return { config: DEFAULT_DATA.config, rsvps: DEFAULT_DATA.rsvps, photos: DEFAULT_DATA.photos };
}

function writeLocalData(data) {
    const fs = require('fs');
    const path = require('path');
    const localFilePath = path.join(__dirname, 'data.json');
    try {
        fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2));
    } catch(e) { console.error("Error escribiendo archivo local:", e); }
}

async function saveData(config, rsvps, photos) {
    if (dbConnected && pool) {
        try {
            await pool.query(
                'UPDATE wedding_data SET config = $1, rsvps = $2, photos = $3, updated_at = NOW()',
                [JSON.stringify(config), JSON.stringify(rsvps), JSON.stringify(photos)]
            );
        } catch (dbErr) {
            console.error("❌ Error guardando en BD, usando archivo local:", dbErr.message);
            writeLocalData({ config, rsvps, photos });
        }
    } else {
        writeLocalData({ config, rsvps, photos });
    }
}

// Inicialización asíncrona
async function initializeApp() {
    dbConnected = await connectToDatabase();
    if (!dbConnected) {
        console.log("⚠️ Usando almacenamiento local como respaldo.");
    }
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📱 Web pública: http://localhost:${PORT}`);
        console.log(`🔧 Panel admin: http://localhost:${PORT}/admin.html`);
        if (dbConnected) {
            console.log(`🗄️ Base de datos: Supabase (PostgreSQL) 🍋`);
        } else {
            console.log(`💾 Base de datos: Archivo local (data.json)`);
        }
    });
}

// ========== ENDPOINTS API ==========

app.get('/get-data', async (req, res) => {
    try {
        const data = await getData();
        res.setHeader('Cache-Control', 'no-cache');
        res.json(data);
    } catch (err) {
        console.error("Error en GET /get-data:", err);
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
        console.error("Error en POST /save-rsvp:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/save-data', async (req, res) => {
    try {
        await saveData(req.body.config, req.body.rsvps, req.body.photos);
        res.json({ ok: true });
    } catch (err) {
        console.error("Error en POST /save-data:", err);
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
        console.error("Error en POST /send-reminders:", err);
        res.status(500).json({ error: err.message });
    }
});

// Iniciar todo
initializeApp().catch(err => {
    console.error("❌ Error fatal al iniciar la aplicación:", err);
    process.exit(1);
});

module.exports = app;