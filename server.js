const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));
app.use('/img', express.static(path.join(__dirname, 'img')));

// Asegurar que la carpeta img existe
const imgDir = path.join(__dirname, 'img');
if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
    console.log('📁 Carpeta img creada');
}

// Variable para saber si estamos en modo local (sin DB) o con DB
let dbConnected = false;
let pool = null;

// Datos por defecto para inicializar la boda (actualizados a Tijuana)
const DEFAULT_DATA = {
    config: {
        wedding_date: "2027-02-20T16:00:00",
        couple_name: "Michell & Alejandro",
        venue_name: "48va Iglesia Apostólica de la Fe en Cristo Jesús (IAFCJ)",
        venue_address: "Tijuana, Colonia Cumbres del Rubí, Baja California, México",
        coordinates: "32.0979, -116.5660",
        reception_name: "Hacienda Santa Clara",
        reception_address: "Carretera Libre Tijuana - Ensenada Km 30, Valle de Guadalupe, Baja California, México",
        whatsapp_number: "5216641117035",
        story_text: "Nos conocimos en Tijuana en el 2019, compartiendo sueños y construyendo amor. Hoy, gracias a Dios, celebramos nuestra unión.",
        verse_text: "El amor es paciente, es bondadoso...",
        verse_reference: "1 Corintios 13:4-8",
        selected_theme: "limon",
        theme_text: "🍋 Nuestra boda con limones - Verde menta y amarillo limón 🍋",
        gallery_message: "📸 Las fotos de nuestra boda estarán disponibles próximamente"
    },
    slider_images: [
        {
            id: "default",
            url: "https://images.pexels.com/photos/169197/pexels-photo-169197.jpeg",
            caption: "Nuestro gran día"
        }
    ],
    rsvps: [],
    photos: []
};

// Función para guardar imagen en archivo local
async function saveImageToFile(base64Data, filename) {
    const matches = base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Formato de imagen inválido');
    }
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const filepath = path.join(imgDir, filename);
    fs.writeFileSync(filepath, imageBuffer);
    return `/img/${filename}`;
}

// Función para intentar conectar a la base de datos
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

        await pool.query(`
            CREATE TABLE IF NOT EXISTS wedding_data (
                id SERIAL PRIMARY KEY,
                config JSONB NOT NULL,
                slider_images JSONB NOT NULL DEFAULT '[]',
                rsvps JSONB NOT NULL DEFAULT '[]',
                photos JSONB NOT NULL DEFAULT '[]',
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("✅ Tabla 'wedding_data' verificada/creada.");

        const result = await pool.query('SELECT COUNT(*) FROM wedding_data');
        if (parseInt(result.rows[0].count) === 0) {
            console.log("💡 Tabla vacía. Insertando datos por defecto...");
            await pool.query(
                'INSERT INTO wedding_data (config, slider_images, rsvps, photos) VALUES ($1, $2, $3, $4)',
                [JSON.stringify(DEFAULT_DATA.config), JSON.stringify(DEFAULT_DATA.slider_images), JSON.stringify(DEFAULT_DATA.rsvps), JSON.stringify(DEFAULT_DATA.photos)]
            );
            console.log("✅ Datos por defecto insertados.");
        }
        return true;
    } catch (err) {
        console.error("❌ Error conectando a la base de datos:", err.message);
        return false;
    }
}

// Función para leer los datos
async function getData() {
    if (dbConnected && pool) {
        try {
            const result = await pool.query('SELECT config, slider_images, rsvps, photos FROM wedding_data LIMIT 1');
            if (result.rows.length > 0) {
                return result.rows[0];
            } else {
                return { config: DEFAULT_DATA.config, slider_images: DEFAULT_DATA.slider_images, rsvps: DEFAULT_DATA.rsvps, photos: DEFAULT_DATA.photos };
            }
        } catch (dbErr) {
            console.error("❌ Error leyendo desde BD, usando archivo local:", dbErr.message);
            return readLocalData();
        }
    } else {
        return readLocalData();
    }
}

// Fallback: leer archivo local
function readLocalData() {
    const localFilePath = path.join(__dirname, 'data.json');
    try {
        if (fs.existsSync(localFilePath)) {
            return JSON.parse(fs.readFileSync(localFilePath, 'utf8'));
        }
    } catch(e) { console.error("Error leyendo archivo local:", e); }
    return { config: DEFAULT_DATA.config, slider_images: DEFAULT_DATA.slider_images, rsvps: DEFAULT_DATA.rsvps, photos: DEFAULT_DATA.photos };
}

function writeLocalData(data) {
    const localFilePath = path.join(__dirname, 'data.json');
    try {
        fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2));
    } catch(e) { console.error("Error escribiendo archivo local:", e); }
}

async function saveData(config, slider_images, rsvps, photos) {
    if (dbConnected && pool) {
        try {
            await pool.query(
                'UPDATE wedding_data SET config = $1, slider_images = $2, rsvps = $3, photos = $4, updated_at = NOW()',
                [JSON.stringify(config), JSON.stringify(slider_images), JSON.stringify(rsvps), JSON.stringify(photos)]
            );
        } catch (dbErr) {
            console.error("❌ Error guardando en BD, usando archivo local:", dbErr.message);
            writeLocalData({ config, slider_images, rsvps, photos });
        }
    } else {
        writeLocalData({ config, slider_images, rsvps, photos });
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
        await saveData(data.config, data.slider_images, data.rsvps, data.photos);
        res.json({ ok: true });
    } catch (err) {
        console.error("Error en POST /save-rsvp:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/save-data', async (req, res) => {
    try {
        await saveData(req.body.config, req.body.slider_images, req.body.rsvps, req.body.photos);
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