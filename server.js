const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json({ limit: '50mb' }));

// ========== CONFIGURACIÓN DE ALMACENAMIENTO ==========
// En Vercel, los archivos se guardan en /tmp (temporal)
// En local, se guardan en la carpeta del proyecto
const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION;
const DATA_DIR = isVercel ? '/tmp' : __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');

console.log(`📁 Modo: ${isVercel ? 'Vercel (serverless)' : 'Local'}`);
console.log(`📁 Archivo de datos: ${DATA_FILE}`);

// Servir archivos estáticos
app.use(express.static('.'));

// ========== FUNCIONES DE LECTURA/ESCRITURA ==========
function readData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        } else {
            // Datos por defecto para la primera vez
            const defaultData = {
                config: {
                    wedding_date: "2025-06-15T16:00:00",
                    couple_name: "Alejandro & Michell",
                    venue_name: "Basílica de Santa María de Guadalupe",
                    venue_address: "Fray Juan de Zumárraga No. 1, Villa Gustavo A. Madero, 07050 Ciudad de México, CDMX",
                    coordinates: "19.432608, -99.133209",
                    reception_name: "Hacienda de los Morales",
                    reception_address: "Av. Miguel Ángel Quevedo 111, Vértiz Narvarte, 03600 Ciudad de México, CDMX",
                    whatsapp_number: "5216641117035",
                    story_text: "Nos conocimos en la Ciudad de México en el 2019, compartiendo sueños y construyendo amor. Hoy, gracias a Dios, celebramos nuestra unión en esta hermosa ciudad llena de historia y tradición.",
                    verse_text: "El amor es paciente, es bondadoso... El amor nunca deja de ser.",
                    verse_reference: "1 Corintios 13:4-8",
                    selected_theme: "blancoDorado"
                },
                rsvps: [],
                photos: [
                    {
                        "id": "1",
                        "url": "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg",
                        "caption": "Preparativos"
                    },
                    {
                        "id": "2",
                        "url": "https://images.pexels.com/photos/261956/pexels-photo-261956.jpeg",
                        "caption": "Anillos"
                    }
                ]
            };
            // Guardar datos por defecto
            fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
    } catch (error) {
        console.error('Error leyendo datos:', error);
        return { config: {}, rsvps: [], photos: [] };
    }
}

function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log('✅ Datos guardados correctamente');
        return true;
    } catch (error) {
        console.error('Error guardando datos:', error);
        return false;
    }
}

// ========== ENDPOINTS API ==========

// Obtener todos los datos
app.get('/get-data', (req, res) => {
    try {
        const data = readData();
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Guardar RSVP
app.post('/save-rsvp', (req, res) => {
    try {
        const data = readData();
        data.rsvps = req.body.rsvps;
        writeData(data);
        res.json({ ok: true, message: 'RSVP guardado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Guardar toda la configuración (admin)
app.post('/save-data', (req, res) => {
    try {
        writeData(req.body);
        res.json({ ok: true, message: 'Datos guardados correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Enviar recordatorios
app.post('/send-reminders', (req, res) => {
    try {
        const data = readData();
        const { daysBefore, testMode, message } = req.body;
        const attendees = (data.rsvps || []).filter(r => r.attending === true);
        
        const weddingDate = new Date(data.config.wedding_date);
        const formattedDate = weddingDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        
        const results = {
            total: attendees.length,
            sent: 0,
            failed: 0,
            details: []
        };
        
        attendees.forEach(guest => {
            let personalizedMessage = message
                .replace('{name}', guest.name || 'Invitado')
                .replace('{date}', formattedDate)
                .replace('{venue}', data.config.venue_name || 'Hacienda Santa Clara')
                .replace('{address}', data.config.venue_address || 'Dirección por definir');
            
            results.details.push({
                name: guest.name,
                phone: guest.phone || 'No registrado',
                whatsapp: guest.whatsapp || 'No registrado',
                message: testMode ? personalizedMessage : 'Enviado (simulado)',
                status: testMode ? 'simulado' : 'pendiente'
            });
            results.sent++;
        });
        
        // Guardar log de recordatorios (opcional)
        const reminderLog = {
            date: new Date().toISOString(),
            daysBefore: daysBefore,
            total: attendees.length,
            testMode: testMode
        };
        
        const remindersFile = path.join(DATA_DIR, 'reminders.json');
        let reminders = [];
        try {
            if (fs.existsSync(remindersFile)) {
                reminders = JSON.parse(fs.readFileSync(remindersFile));
            }
        } catch(e) { reminders = []; }
        reminders.push(reminderLog);
        fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2));
        
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== RUTAS PARA ARCHIVOS ESTÁTICOS ==========
// Asegurar que admin.html e index.html se sirvan correctamente
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ========== INICIAR SERVIDOR (SOLO LOCAL) ==========
if (!isVercel) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
        console.log(`📱 Web pública: http://localhost:${PORT}`);
        console.log(`🔧 Panel admin: http://localhost:${PORT}/admin.html`);
        console.log(`📁 Datos guardados en: ${DATA_FILE}`);
    });
}

// Exportar para Vercel
module.exports = app;