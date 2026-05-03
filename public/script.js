let weddingData = { config: {}, rsvps: [], photos: [] };
let countdownInterval = null;

// ========== BASE DE CONOCIMIENTO DEL CHATBOT (se actualiza desde el servidor) ==========
let bodaInfo = {
    fecha: "",
    hora: "",
    lugar: "",
    direccion: "",
    recepcion: "",
    direccionRecepcion: "",
    codigoVestimenta: "Formal elegante (Blanco, Verde Menta y Amarillo) 🍋",
    estacionamiento: "Sí, hay estacionamiento gratuito en el lugar",
    ninos: "Todos los niños son bienvenidos. Habrá actividades especiales para ellos.",
    confirmacion: "Por favor confirma antes del 20 de enero usando el formulario en nuestra web",
    whatsapp: ""
};

// Función para actualizar la información del chatbot desde los datos del servidor
function actualizarInfoChatbot(config) {
    if (config.wedding_date) {
        const fecha = new Date(config.wedding_date);
        bodaInfo.fecha = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const horas = fecha.getHours();
        const minutos = fecha.getMinutes();
        bodaInfo.hora = `${horas}:${minutos.toString().padStart(2, '0')} ${horas >= 12 ? 'PM' : 'AM'}`;
    }
    bodaInfo.lugar = config.venue_name || "Basílica de Guadalupe";
    bodaInfo.direccion = config.venue_address || "Fray Juan de Zumárraga No. 1, Villa Gustavo A. Madero, 07050 Ciudad de México, CDMX";
    bodaInfo.recepcion = config.reception_name || bodaInfo.lugar;
    bodaInfo.direccionRecepcion = config.reception_address || bodaInfo.direccion;
    bodaInfo.whatsapp = config.whatsapp_number || "5216641117035";
    bodaInfo.confirmacion = `Por favor confirma antes del 20 de enero de ${new Date(config.wedding_date).getFullYear() || '2027'} usando el formulario en nuestra web`;
    
    console.log('✅ Información del chatbot actualizada:', bodaInfo);
}

// Respuestas predefinidas del chatbot
const respuestas = {
    saludo: ["hola", "buenas", "hola asistente", "hey", "buenos días", "buenas tardes", "buenas noches", "holi", "hola!", "hola"],
    fecha: ["qué día es", "cuándo es", "fecha", "día de la boda", "qué fecha", "cuándo se casa", "que dia", "fecha exacta"],
    hora: ["a qué hora", "hora", "horario", "qué hora", "cuándo empieza", "a que hora", "hora de la ceremonia"],
    lugar: ["dónde es", "ubicación", "lugar", "dirección", "cómo llegar", "donde es", "en que lugar"],
    vestimenta: ["qué me pongo", "vestimenta", "código", "ropa", "traje", "vestido", "código de vestimenta", "como debo ir", "colores"],
    ninos: ["niños", "puedo llevar niños", "familia", "menores", "bebés", "puedo ir con mi hijo", "niño", "hijos"],
    regalo: ["regalo", "mesa de regalos", "qué regalar", "presente", "regalos", "que puedo regalar", "lista de regalos"],
    confirmacion: ["confirmar", "rsvp", "cómo confirmo", "asistencia", "confirmar asistencia", "confirmación"],
    estacionamiento: ["estacionamiento", "parqueadero", "donde parquear", "parqueo", "parking"],
    gracias: ["gracias", "ok", "perfecto", "listo", "excelente", "genial", "muchas gracias", "gracias!"],
    limon: ["limón", "limones", "tematic", "decoración", "limon", "🍋"],
    adios: ["adiós", "chao", "bye", "hasta luego", "nos vemos", "salir", "adios", "chao"]
};

function obtenerRespuestaInteligente(mensaje) {
    const msg = mensaje.toLowerCase().trim();
    
    if (respuestas.saludo.some(p => msg.includes(p))) {
        return "🍋 ¡Hola! Soy el asistente de la boda de Alejandro y Michell. ¿En qué puedo ayudarte? Puedo informarte sobre fecha, lugar, horario, vestimenta y más. ¡Nuestra temática son los limones! ✨";
    }
    
    if (respuestas.limon.some(p => msg.includes(p))) {
        return "🍋 ¡Sí! Los limones son parte de nuestra temática. Los colores de nuestra boda son Blanco, Verde Menta y Amarillo. ¡Un toque fresco y alegre! 💚💛🤍";
    }
    
    if (respuestas.adios.some(p => msg.includes(p))) {
        return "🍋 ¡Gracias por visitar nuestra web! Que tengas un lindo día. ¡Nos vemos en la boda! 💒";
    }
    
    if (respuestas.fecha.some(p => msg.includes(p))) {
        return `🍋 La boda será el ${bodaInfo.fecha} a las ${bodaInfo.hora}. ¡Te esperamos! 🗓️`;
    }
    
    if (respuestas.hora.some(p => msg.includes(p))) {
        return `🍋 La ceremonia comienza a las ${bodaInfo.hora}. Te recomendamos llegar 30 minutos antes. ⏰`;
    }
    
    if (respuestas.lugar.some(p => msg.includes(p))) {
        return `🍋 La ceremonia será en ${bodaInfo.lugar}. 📍 Dirección: ${bodaInfo.direccion}. La recepción será en ${bodaInfo.recepcion} (${bodaInfo.direccionRecepcion}).`;
    }
    
    if (respuestas.vestimenta.some(p => msg.includes(p))) {
        return `🍋 El código de vestimenta es: ${bodaInfo.codigoVestimenta}. ¡Un toque de limón es bienvenido! 👔👗💛`;
    }
    
    if (respuestas.ninos.some(p => msg.includes(p))) {
        return `🍋 ${bodaInfo.ninos} 🧸💚`;
    }
    
    if (respuestas.estacionamiento.some(p => msg.includes(p))) {
        return `🍋 ${bodaInfo.estacionamiento} 🚗`;
    }
    
    if (respuestas.regalo.some(p => msg.includes(p))) {
        return `🍋 Tu presencia es el mejor regalo. Si deseas contribuir, tenemos una mesa de regalos en Liverpool. 🎁 ¡Un detalle amarillo o verde sería perfecto!`;
    }
    
    if (respuestas.confirmacion.some(p => msg.includes(p))) {
        return `🍋 Para confirmar tu asistencia, usa el formulario en nuestra web. ${bodaInfo.confirmacion} 📝`;
    }
    
    if (respuestas.gracias.some(p => msg.includes(p))) {
        return `🍋 ¡A ti por ser parte de este día tan especial! Que tengas un bendecido día. 💛💚`;
    }
    
    return `🍋 Gracias por tu mensaje. Para información más específica, puedes contactarnos directamente por WhatsApp al ${bodaInfo.whatsapp}. ¿Necesitas saber algo más sobre fecha, lugar o vestimenta? 💒 ¡Nuestra temática son los limones!`;
}

// ========== TEMAS DE COLOR ==========
const themes = {
    blancoDorado: { bg: '#FFFFFF', text: '#4A4A4A', gold: '#D4AF37', terra: '#C5A059', sectionBg: '#FDFDFD' },
    marfilLino: { bg: '#FFFDF5', text: '#333333', gold: '#BDB3A2', terra: '#A89F8E', sectionBg: '#FCFAF5' },
    cremaChampan: { bg: '#F9F6EE', text: '#5D5B57', gold: '#E7D4B5', terra: '#D4BFA0', sectionBg: '#F7F4EA' },
    terracotaArena: { bg: '#F4EDE4', text: '#3E3633', gold: '#C27D63', terra: '#B06D53', sectionBg: '#F0E8DE' },
    verdeOlivo: { bg: '#FAF9F6', text: '#424242', gold: '#556B2F', terra: '#4A5E2A', sectionBg: '#F7F6F0' },
    adobeCafe: { bg: '#F2E7DC', text: '#2D2926', gold: '#8B4513', terra: '#7A3B10', sectionBg: '#EDE2D4' },
    rosaPalo: { bg: '#FDF8F7', text: '#4F4F4F', gold: '#B39292', terra: '#A28282', sectionBg: '#FBF4F2' },
    malvaEmpolvado: { bg: '#FFFFFF', text: '#353535', gold: '#A68A8E', terra: '#957A7E', sectionBg: '#FCFAFA' },
    nudeBronce: { bg: '#F9F1EF', text: '#2F2F2F', gold: '#A67C52', terra: '#966C42', sectionBg: '#F6EDEA' },
    limon: { bg: '#FFFFFF', text: '#2D5A27', gold: '#F4D03F', terra: '#98D8C8', sectionBg: '#F0FFF0' }
};

function applyTheme(themeName) {
    const theme = themes[themeName] || themes.limon;
    
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;
    
    const sections = ['countdown', 'story', 'logistics', 'map', 'gallery', 'rsvp'];
    sections.forEach(section => {
        const el = document.querySelector(`.${section}`);
        if (el) el.style.backgroundColor = theme.sectionBg;
    });
    
    const titles = document.querySelectorAll('.section-title');
    titles.forEach(el => el.style.color = theme.text);
    
    const numbers = document.querySelectorAll('.countdown-number');
    numbers.forEach(el => el.style.color = theme.terra);
    
    const icons = document.querySelectorAll('.logistics-card i');
    icons.forEach(el => el.style.color = theme.terra);
    
    const verseRef = document.querySelector('.verse-ref');
    if (verseRef) verseRef.style.color = theme.gold;
    
    const heroDivider = document.querySelector('.hero-divider');
    if (heroDivider) heroDivider.style.backgroundColor = theme.gold;
    
    const crossIcon = document.querySelector('.cross-icon');
    if (crossIcon) crossIcon.style.color = theme.gold;
    
    const footerHashtag = document.querySelector('.footer-hashtag');
    if (footerHashtag) footerHashtag.style.color = theme.gold;
    
    const rsvpBtn = document.querySelector('.btn-rsvp');
    if (rsvpBtn) {
        rsvpBtn.style.borderColor = theme.gold;
        rsvpBtn.onmouseenter = () => { rsvpBtn.style.backgroundColor = theme.gold; rsvpBtn.style.color = theme.text === '#FFFFFF' ? '#1A1A1A' : '#FFFFFF'; };
        rsvpBtn.onmouseleave = () => { rsvpBtn.style.backgroundColor = 'transparent'; rsvpBtn.style.color = 'white'; };
    }
    
    const submitBtn = document.querySelector('.btn-submit');
    if (submitBtn) {
        submitBtn.style.backgroundColor = theme.terra;
        submitBtn.onmouseenter = () => { submitBtn.style.backgroundColor = theme.gold; submitBtn.style.color = theme.text === '#FFFFFF' ? '#1A1A1A' : '#FFFFFF'; };
        submitBtn.onmouseleave = () => { submitBtn.style.backgroundColor = theme.terra; submitBtn.style.color = 'white'; };
    }
    
    const chatbotBtn = document.querySelector('.chatbot-button');
    if (chatbotBtn) {
        chatbotBtn.style.backgroundColor = theme.terra;
        chatbotBtn.onmouseenter = () => { chatbotBtn.style.backgroundColor = theme.gold; };
        chatbotBtn.onmouseleave = () => { chatbotBtn.style.backgroundColor = theme.terra; };
    }
    
    const oldStyle = document.getElementById('dynamic-theme-style');
    if (oldStyle) oldStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'dynamic-theme-style';
    style.textContent = `.section-title:after { content: '🍋'; background: transparent !important; }`;
    document.head.appendChild(style);
}

// ========== HERO SLIDER ==========
let heroSliderInterval = null;
let heroCurrentSlide = 0;

const DEFAULT_HERO_SLIDES = [
    { url: 'https://images.pexels.com/photos/169197/pexels-photo-169197.jpeg', caption: '' },
    { url: 'https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg', caption: '' },
    { url: 'https://images.pexels.com/photos/261956/pexels-photo-261956.jpeg', caption: '' }
];

function initHeroSlider(slides) {
    const container = document.getElementById('hero-slides');
    const dotsContainer = document.getElementById('hero-dots');
    if (!container || !dotsContainer) return;

    const activeSlides = (slides && slides.length > 0) ? slides : DEFAULT_HERO_SLIDES;

    // Limpiar
    container.innerHTML = '';
    dotsContainer.innerHTML = '';
    heroCurrentSlide = 0;

    // Crear slides
    activeSlides.forEach((slide, i) => {
        const div = document.createElement('div');
        div.className = 'hero-slide' + (i === 0 ? ' active' : '');
        div.style.backgroundImage = `url('${slide.url}')`;
        container.appendChild(div);

        // Dot
        const dot = document.createElement('button');
        dot.className = 'hero-slider-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Imagen ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    });

    // Ocultar controles si solo hay 1 imagen
    const prevBtn = document.getElementById('hero-prev');
    const nextBtn = document.getElementById('hero-next');
    if (activeSlides.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        dotsContainer.style.display = 'none';
        return;
    }

    if (prevBtn) prevBtn.style.display = '';
    if (nextBtn) nextBtn.style.display = '';
    dotsContainer.style.display = '';

    // Eventos flechas
    if (prevBtn) prevBtn.onclick = () => { goToSlide(heroCurrentSlide - 1); resetAutoplay(activeSlides); };
    if (nextBtn) nextBtn.onclick = () => { goToSlide(heroCurrentSlide + 1); resetAutoplay(activeSlides); };

    // Autoplay
    startAutoplay(activeSlides);
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-slider-dot');
    if (!slides.length) return;

    heroCurrentSlide = ((index % slides.length) + slides.length) % slides.length;

    slides.forEach((s, i) => s.classList.toggle('active', i === heroCurrentSlide));
    dots.forEach((d, i) => d.classList.toggle('active', i === heroCurrentSlide));
}

function startAutoplay(slides) {
    if (heroSliderInterval) clearInterval(heroSliderInterval);
    heroSliderInterval = setInterval(() => {
        goToSlide(heroCurrentSlide + 1);
    }, 5000);
}

function resetAutoplay(slides) {
    startAutoplay(slides);
}


function actualizarMapa(lat, lng, direccion) {
    const mapAddress = document.getElementById('map-address');
    const mapBtn     = document.getElementById('map-directions-btn');

    if (mapAddress && direccion) {
        mapAddress.innerHTML = `📍 ${direccion}`;
    }
    if (mapBtn) {
        mapBtn.href = `https://www.google.com/maps?q=${lat},${lng}`;
    }

    const mapDiv = document.getElementById('map-leaflet');
    if (!mapDiv || isNaN(lat) || isNaN(lng)) return;
    if (mapDiv._leaflet_id) return; // ya inicializado

    const map = L.map('map-leaflet', { scrollWheelZoom: false }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(map);

    const icon = L.divIcon({
        html: `<div style="background:#F4D03F;border:3px solid #2D5A27;border-radius:50% 50% 50% 0;width:36px;height:36px;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:16px;">🍋</span></div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38]
    });

    L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
            <div style="text-align:center;padding:6px;min-width:180px;">
                <strong style="color:#2D5A27;">💒 Boda Michell & Alejandro</strong><br>
                <small style="color:#666;">${direccion}</small><br><br>
                <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank"
                    style="background:#4A7C6B;color:white;padding:6px 14px;border-radius:20px;text-decoration:none;font-size:0.8rem;font-weight:600;">
                    📍 Cómo llegar
                </a>
            </div>
        `, { maxWidth: 250 })
        .openPopup();
}

// ========== FUNCIONES PRINCIPALES ==========
async function loadPublicData() {
    try {
        const res = await fetch('/get-data?_=' + Date.now());
        weddingData = await res.json();
        
        // Actualizar nombres de la pareja
        document.getElementById('couple-name').innerText = weddingData.config?.couple_name || 'Alejandro & Michell';
        
        // Actualizar fecha y lugar en el hero
        const weddingDate = weddingData.config?.wedding_date;
        if (weddingDate) {
            const fecha = new Date(weddingDate);
            const fechaStr = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
            document.getElementById('wedding-date').innerText = fechaStr;
        }
        
        const venueName = weddingData.config?.venue_name || 'Basílica de Guadalupe';
        const venueAddress = weddingData.config?.venue_address || 'Fray Juan de Zumárraga No. 1, Villa Gustavo A. Madero, 07050 Ciudad de México, CDMX';
        const receptionName = weddingData.config?.reception_name || venueName;
        const receptionAddress = weddingData.config?.reception_address || venueAddress;
        
        document.getElementById('venue-name').innerText = venueName;
        
        // Actualizar tarjetas de logística
        const ceremonyNameEl = document.getElementById('ceremony-name');
        const ceremonyAddressEl = document.getElementById('ceremony-address');
        const receptionNameEl = document.getElementById('reception-name');
        const receptionAddressEl = document.getElementById('reception-address');
        
        if (ceremonyNameEl) ceremonyNameEl.innerHTML = `<strong>${venueName}</strong>`;
        if (ceremonyAddressEl) ceremonyAddressEl.innerHTML = venueAddress;
        if (receptionNameEl) receptionNameEl.innerHTML = `<strong>${receptionName}</strong>`;
        if (receptionAddressEl) receptionAddressEl.innerHTML = receptionAddress;
        
        // ACTUALIZAR LA INFORMACIÓN DEL CHATBOT
        actualizarInfoChatbot(weddingData.config);
        
        // ========== MAPA ACTUALIZADO (ESPAÑOL) ==========
        const coordinates = weddingData.config?.coordinates || '19.432608, -99.133209';
        const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
        actualizarMapa(lat, lng, venueAddress);
        
        // Actualizar versículo e historia
        document.getElementById('verse-text').innerText = weddingData.config?.verse_text || 'El amor es paciente, es bondadoso...';
        document.getElementById('verse-ref').innerText = weddingData.config?.verse_reference || '1 Corintios 13:4-8';
        document.getElementById('story-text').innerText = weddingData.config?.story_text || 'Nos conocimos en la Ciudad de México en el 2019, compartiendo sueños y construyendo amor. Hoy, gracias a Jehova, celebramos nuestra unión.';
        
        // Actualizar mensaje de galería
        const galleryMsg = document.getElementById('gallery-message');
        if (galleryMsg && weddingData.config?.gallery_message) {
            galleryMsg.innerHTML = weddingData.config.gallery_message;
        } else if (galleryMsg) {
            galleryMsg.innerHTML = '📸 Las fotos de nuestra boda estarán disponibles pronto';
        }
        
        renderGallery();
        startCountdown();
        
        const savedTheme = weddingData.config?.selected_theme || 'limon';
        applyTheme(savedTheme);

        // Música
        loadMusicConfig(weddingData.config);

        // Inicializar hero slider (solo la primera vez, no en recargas)
        if (!heroSliderInterval) {
            const heroSlides = weddingData.config?.hero_slides;
            initHeroSlider(heroSlides);
        }
        
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (weddingData.photos && weddingData.photos.length > 0) {
        weddingData.photos.forEach(photo => {
            const div = document.createElement('div');
            div.innerHTML = `<img src="${photo.url}" alt="${photo.caption}" loading="lazy" onclick="window.open('${photo.url}','_blank')">`;
            grid.appendChild(div);
        });
    }
}

function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);
    
    const target = new Date(weddingData.config?.wedding_date).getTime();
    if (isNaN(target)) return;
    
    countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const diff = target - now;
        if (diff <= 0) {
            document.getElementById('days').innerText = '00';
            document.getElementById('hours').innerText = '00';
            document.getElementById('minutes').innerText = '00';
            document.getElementById('seconds').innerText = '00';
            return;
        }
        document.getElementById('days').innerText = Math.floor(diff / (1000 * 60 * 60 * 24));
        document.getElementById('hours').innerText = Math.floor((diff % (86400000)) / 3600000);
        document.getElementById('minutes').innerText = Math.floor((diff % 3600000) / 60000);
        document.getElementById('seconds').innerText = Math.floor((diff % 60000) / 1000);
    }, 1000);
}

// ========== RSVP FORM ==========
const rsvpForm = document.getElementById('rsvp-form');
if (rsvpForm) {
    rsvpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newRSVP = {
            id: Date.now(),
            name: document.getElementById('guest-name').value,
            email: document.getElementById('guest-email').value,
            phone: document.getElementById('guest-phone').value,
            whatsapp: document.getElementById('guest-whatsapp').value,
            attendees: parseInt(document.getElementById('guest-attendees').value),
            allergies: document.getElementById('guest-allergies').value,
            song: document.getElementById('guest-song').value,
            attending: document.querySelector('input[name="attending"]:checked').value === 'yes',
            date: new Date().toISOString()
        };
        
        weddingData.rsvps = weddingData.rsvps || [];
        weddingData.rsvps.push(newRSVP);
        
        await fetch('/save-rsvp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rsvps: weddingData.rsvps })
        });
        
        const msgDiv = document.getElementById('rsvp-message');
        msgDiv.innerHTML = '<div style="background:#d4edda;padding:1rem;border-radius:8px;margin-top:1rem;text-align:center;">✅ ¡Gracias por confirmar, te esperamos! 🍋</div>';
        rsvpForm.reset();
        setTimeout(() => msgDiv.innerHTML = '', 5000);
    });
}

// ========== CHATBOT IA MEJORADO ==========
let btnCreados = false;

function agregarBotonesRapidos() {
    if (btnCreados) return;
    const container = document.getElementById('quick-buttons');
    if (!container) return;
    
    container.innerHTML = '';
    
    const preguntas = ['📅 ¿Cuándo es?', '📍 ¿Dónde es?', '👔 ¿Qué me pongo?', '🎁 ¿Regalo?', '📝 Confirmar', '🚗 Parqueadero', '🍋 Temática'];
    
    preguntas.forEach(pregunta => {
        const btn = document.createElement('button');
        btn.textContent = pregunta;
        btn.onclick = () => {
            const input = document.getElementById('chatbot-input');
            if (input) {
                input.value = pregunta.replace(/[📅📍👔🎁📝🚗🍋]/g, '').trim();
                enviarMensaje();
            }
        };
        container.appendChild(btn);
    });
    btnCreados = true;
}

async function enviarMensaje() {
    const input = document.getElementById('chatbot-input');
    const msg = input.value.trim();
    if (!msg) return;
    
    const msgsDiv = document.getElementById('chatbot-messages');
    msgsDiv.innerHTML += `<div class="message user">${msg}</div>`;
    input.value = '';
    msgsDiv.scrollTop = msgsDiv.scrollHeight;
    
    let respuesta = obtenerRespuestaInteligente(msg);
    
    if (respuesta.includes('WhatsApp')) {
        const waNumber = bodaInfo.whatsapp;
        respuesta += `<br><a href="https://wa.me/${waNumber}" target="_blank">📱 Abrir WhatsApp 🍋</a>`;
    }
    
    msgsDiv.innerHTML += `<div class="message bot">${respuesta}</div>`;
    msgsDiv.scrollTop = msgsDiv.scrollHeight;
}

// Inicializar chatbot
const toggleBtn = document.getElementById('chatbot-toggle');
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const win = document.getElementById('chatbot-window');
        win.classList.toggle('active');
        if (win.classList.contains('active')) {
            agregarBotonesRapidos();
        }
    });
}

const closeBtn = document.getElementById('chatbot-close');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        document.getElementById('chatbot-window').classList.remove('active');
    });
}

const sendBtn = document.getElementById('chatbot-send');
if (sendBtn) {
    sendBtn.addEventListener('click', enviarMensaje);
}

const chatbotInput = document.getElementById('chatbot-input');
if (chatbotInput) {
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensaje();
    });
}

function scrollToRSVP() {
    document.getElementById('rsvp')?.scrollIntoView({ behavior: 'smooth' });
}

// Iniciar carga de datos
loadPublicData();
// Recargar datos cada 10 segundos para mantener actualizada la información
setInterval(loadPublicData, 10000);

// ========== PARALLAX RAMAS GLOBALES (fix: usa CSS custom property) ==========
(function initParallax() {
    const ramaIzq = document.querySelector('.rama-global-izq');
    const ramaDer = document.querySelector('.rama-global-der');
    if (!ramaIzq || !ramaDer) return;

    let ticking = false;

    // Velocidades distintas para efecto más natural
    const speedIzq = 0.10;
    const speedDer = 0.08;

    function applyParallax() {
        const scrollY = window.scrollY;
        // Usamos CSS custom property --parallax-y para que la animación wave
        // (que usa transform) coexista sin conflicto vía translateY adicional
        ramaIzq.style.setProperty('--parallax-y', `${scrollY * speedIzq}px`);
        ramaDer.style.setProperty('--parallax-y', `${scrollY * speedDer}px`);
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(applyParallax);
            ticking = true;
        }
    }, { passive: true });

    applyParallax();
})();
// ========== MÚSICA CRISTIANA — YouTube IFrame API ==========
const DEFAULT_MUSIC_YT_ID = 'zKNJDdTJQII';

let ytPlayer       = null;
let ytApiLoaded    = false;
let ytPlayerReady  = false;
let musicPlaying   = false;
let ytVideoId      = DEFAULT_MUSIC_YT_ID;
let pendingPlay    = false;

// Cargar la API de YouTube una sola vez
function loadYouTubeAPI() {
    if (ytApiLoaded) return;
    ytApiLoaded = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
}

// Callback global que llama YouTube cuando la API está lista
window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-player', {
        height: '1',
        width: '1',
        videoId: ytVideoId,
        playerVars: {
            autoplay: 0,
            loop: 1,
            playlist: ytVideoId,
            controls: 0,
            showinfo: 0,
            rel: 0,
            iv_load_policy: 3,
            modestbranding: 1
        },
        events: {
            onReady: function(e) {
                ytPlayerReady = true;
                e.target.setVolume(70);
                if (pendingPlay) {
                    e.target.playVideo();
                    pendingPlay = false;
                    setMusicUI(true);
                }
            },
            onStateChange: function(e) {
                // Si el video termina (estado 0) reiniciar
                if (e.data === YT.PlayerState.ENDED) {
                    e.target.playVideo();
                }
            },
            onError: function() {
                setMusicUI(false);
                musicPlaying = false;
                const label = document.getElementById('music-label');
                if (label) label.textContent = 'No disponible';
            }
        }
    });
};

function setMusicUI(playing) {
    const btn   = document.getElementById('music-btn');
    const icon  = document.getElementById('music-icon');
    const label = document.getElementById('music-label');
    if (playing) {
        if (btn)   btn.classList.add('playing');
        if (icon)  icon.textContent = '🎶';
        if (label) label.textContent = 'Pausar';
    } else {
        if (btn)   btn.classList.remove('playing');
        if (icon)  icon.textContent = '🎵';
        if (label) label.textContent = 'Música';
    }
}

function toggleMusic() {
    if (!ytApiLoaded) {
        loadYouTubeAPI();
        pendingPlay = true;
        musicPlaying = true;
        const label = document.getElementById('music-label');
        if (label) label.textContent = 'Cargando...';
        return;
    }

    if (!ytPlayerReady) {
        pendingPlay = true;
        musicPlaying = true;
        return;
    }

    if (!musicPlaying) {
        ytPlayer.playVideo();
        musicPlaying = true;
        setMusicUI(true);
    } else {
        ytPlayer.pauseVideo();
        musicPlaying = false;
        setMusicUI(false);
    }
}

function loadMusicConfig(config) {
    ytVideoId = config?.music_yt_id || DEFAULT_MUSIC_YT_ID;
    const songName = config?.music_song_name || 'Instrumental Cristiana';
    const nameEl = document.getElementById('music-song-name');
    if (nameEl) nameEl.textContent = songName;
    // Si el player ya existe y cambió el video, actualizarlo
    if (ytPlayerReady && ytPlayer) {
        ytPlayer.cueVideoById({ videoId: ytVideoId, suggestedQuality: 'small' });
    }
}
