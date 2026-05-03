let weddingData = { config: {}, slider_images: [], rsvps: [], photos: [] };
let countdownInterval = null;
let slideInterval = null;
let currentSlide = 0;
const SLIDE_INTERVAL_TIME = 6000;

// ========== BASE DE CONOCIMIENTO DEL CHATBOT ==========
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

function actualizarInfoChatbot(config) {
    if (config.wedding_date) {
        const fecha = new Date(config.wedding_date);
        bodaInfo.fecha = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        const horas = fecha.getHours();
        const minutos = fecha.getMinutes();
        bodaInfo.hora = `${horas}:${minutos.toString().padStart(2, '0')} ${horas >= 12 ? 'PM' : 'AM'}`;
    }
    bodaInfo.lugar = config.venue_name || "Basílica de Guadalupe";
    bodaInfo.direccion = config.venue_address || "Tijuana, Baja California";
    bodaInfo.recepcion = config.reception_name || bodaInfo.lugar;
    bodaInfo.direccionRecepcion = config.reception_address || bodaInfo.direccion;
    bodaInfo.whatsapp = config.whatsapp_number || "5216641117035";
    bodaInfo.confirmacion = `Por favor confirma antes del 20 de enero de ${new Date(config.wedding_date).getFullYear() || '2027'} usando el formulario en nuestra web`;
    console.log('✅ Información del chatbot actualizada:', bodaInfo);
}

const respuestas = {
    saludo: ["hola", "buenas", "hola asistente", "hey", "buenos días", "buenas tardes", "buenas noches", "holi", "hola!"],
    fecha: ["qué día es", "cuándo es", "fecha", "día de la boda", "qué fecha", "cuándo se casa", "que dia"],
    hora: ["a qué hora", "hora", "horario", "qué hora", "cuándo empieza", "a que hora"],
    lugar: ["dónde es", "ubicación", "lugar", "dirección", "cómo llegar", "donde es"],
    vestimenta: ["qué me pongo", "vestimenta", "código", "ropa", "traje", "vestido", "código de vestimenta", "como debo ir"],
    ninos: ["niños", "puedo llevar niños", "familia", "menores", "bebés"],
    regalo: ["regalo", "mesa de regalos", "qué regalar", "presente", "regalos"],
    confirmacion: ["confirmar", "rsvp", "cómo confirmo", "asistencia", "confirmar asistencia"],
    estacionamiento: ["estacionamiento", "parqueadero", "donde parquear", "parqueo", "parking"],
    gracias: ["gracias", "ok", "perfecto", "listo", "excelente", "genial", "muchas gracias"],
    limon: ["limón", "limones", "tematic", "decoración", "limon", "🍋"],
    adios: ["adiós", "chao", "bye", "hasta luego", "nos vemos", "salir"]
};

function obtenerRespuestaInteligente(mensaje) {
    const msg = mensaje.toLowerCase().trim();
    if (respuestas.saludo.some(p => msg.includes(p))) {
        return "🍋 ¡Hola! Soy el asistente de la boda de Michell y Alejandro. ¿En qué puedo ayudarte? ✨";
    }
    if (respuestas.limon.some(p => msg.includes(p))) {
        return "🍋 ¡Sí! Los limones son parte de nuestra temática. ¡Un toque fresco y alegre! 💚💛🤍";
    }
    if (respuestas.adios.some(p => msg.includes(p))) {
        return "🍋 ¡Gracias por visitar nuestra web! 💒";
    }
    if (respuestas.fecha.some(p => msg.includes(p))) {
        return `🍋 La boda será el ${bodaInfo.fecha} a las ${bodaInfo.hora}. 🗓️`;
    }
    if (respuestas.hora.some(p => msg.includes(p))) {
        return `🍋 La ceremonia comienza a las ${bodaInfo.hora}. ⏰`;
    }
    if (respuestas.lugar.some(p => msg.includes(p))) {
        return `🍋 La ceremonia será en ${bodaInfo.lugar}. 📍 Dirección: ${bodaInfo.direccion}.`;
    }
    if (respuestas.vestimenta.some(p => msg.includes(p))) {
        return `🍋 El código de vestimenta es: ${bodaInfo.codigoVestimenta}. 👔👗💛`;
    }
    if (respuestas.ninos.some(p => msg.includes(p))) {
        return `🍋 ${bodaInfo.ninos} 🧸💚`;
    }
    if (respuestas.estacionamiento.some(p => msg.includes(p))) {
        return `🍋 ${bodaInfo.estacionamiento} 🚗`;
    }
    if (respuestas.regalo.some(p => msg.includes(p))) {
        return `🍋 Tu presencia es el mejor regalo. 🎁`;
    }
    if (respuestas.confirmacion.some(p => msg.includes(p))) {
        return `🍋 Para confirmar tu asistencia, usa el formulario en nuestra web. ${bodaInfo.confirmacion} 📝`;
    }
    if (respuestas.gracias.some(p => msg.includes(p))) {
        return `🍋 ¡A ti por ser parte de este día tan especial! 💛💚`;
    }
    return `🍋 Para información más específica, puedes contactarnos por WhatsApp al ${bodaInfo.whatsapp}. 💒`;
}

// ========== SLIDER DE IMÁGENES ==========
function renderSlider() {
    const slidesContainer = document.getElementById('hero-slides');
    const dotsContainer = document.getElementById('slider-dots');
    if (!slidesContainer) return;
    
    slidesContainer.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';
    
    const images = weddingData.slider_images || [];
    if (images.length === 0) return;
    
    images.forEach((img, index) => {
        const slide = document.createElement('div');
        slide.className = `hero-slide ${index === currentSlide ? 'active' : ''}`;
        slide.style.backgroundImage = `url('${img.url}')`;
        slide.innerHTML = '<div class="hero-overlay"></div>';
        slidesContainer.appendChild(slide);
        
        if (dotsContainer) {
            const dot = document.createElement('button');
            dot.className = `slider-dot ${index === currentSlide ? 'active' : ''}`;
            dot.setAttribute('data-index', index);
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        }
    });
}

function goToSlide(index) {
    const images = weddingData.slider_images || [];
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    currentSlide = index;
    
    const slides = document.querySelectorAll('.hero-slide');
    slides.forEach((slide, i) => {
        if (i === currentSlide) slide.classList.add('active');
        else slide.classList.remove('active');
    });
    
    const dots = document.querySelectorAll('.slider-dot');
    dots.forEach((dot, i) => {
        if (i === currentSlide) dot.classList.add('active');
        else dot.classList.remove('active');
    });
    
    resetSlideInterval();
}

function nextSlide() { goToSlide(currentSlide + 1); }
function prevSlide() { goToSlide(currentSlide - 1); }

function startSlideShow() {
    if (slideInterval) clearInterval(slideInterval);
    const images = weddingData.slider_images || [];
    if (images.length > 1) {
        slideInterval = setInterval(() => nextSlide(), SLIDE_INTERVAL_TIME);
    }
}

function resetSlideInterval() {
    if (slideInterval) {
        clearInterval(slideInterval);
        const images = weddingData.slider_images || [];
        if (images.length > 1) {
            slideInterval = setInterval(() => nextSlide(), SLIDE_INTERVAL_TIME);
        }
    }
}

// ========== FUNCIÓN PARA ACTUALIZAR EL MAPA ==========
function actualizarMapa(lat, lng, direccion) {
    const mapIframe = document.getElementById('map-iframe');
    const mapAddress = document.getElementById('map-address');
    if (mapAddress && direccion) mapAddress.innerHTML = `📍 ${direccion} 🍋`;
    if (mapIframe && !isNaN(lat) && !isNaN(lng)) {
        const delta = 0.025;
        const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
        mapIframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}&hl=es`;
    }
}

// ========== FUNCIONES PRINCIPALES ==========
async function loadPublicData() {
    try {
        const res = await fetch('/get-data?_=' + Date.now());
        weddingData = await res.json();
        
        document.getElementById('couple-name').innerText = weddingData.config?.couple_name || 'Michell & Alejandro';
        const weddingDate = weddingData.config?.wedding_date;
        if (weddingDate) {
            const fecha = new Date(weddingDate);
            document.getElementById('wedding-date').innerText = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        
        const venueName = weddingData.config?.venue_name || 'Iglesia en Tijuana';
        const venueAddress = weddingData.config?.venue_address || 'Tijuana, Baja California';
        const receptionName = weddingData.config?.reception_name || venueName;
        const receptionAddress = weddingData.config?.reception_address || venueAddress;
        
        document.getElementById('venue-name').innerText = venueName;
        document.getElementById('ceremony-name').innerHTML = `<strong>${venueName}</strong>`;
        document.getElementById('ceremony-address').innerHTML = venueAddress;
        document.getElementById('reception-name').innerHTML = `<strong>${receptionName}</strong>`;
        document.getElementById('reception-address').innerHTML = receptionAddress;
        
        actualizarInfoChatbot(weddingData.config);
        
        const coordinates = weddingData.config?.coordinates || '32.0979, -116.5660';
        const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
        actualizarMapa(lat, lng, venueAddress);
        
        document.getElementById('verse-text').innerText = weddingData.config?.verse_text || 'El amor es paciente...';
        document.getElementById('verse-ref').innerText = weddingData.config?.verse_reference || '1 Corintios 13:4-8';
        document.getElementById('story-text').innerText = weddingData.config?.story_text || 'Nos conocimos en Tijuana en el 2019...';
        
        const galleryMsg = document.getElementById('gallery-message');
        if (galleryMsg && weddingData.config?.gallery_message) {
            galleryMsg.innerHTML = weddingData.config.gallery_message;
        }
        
        renderGallery();
        renderSlider();
        startSlideShow();
        startCountdown();
        
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
        document.getElementById('hours').innerText = Math.floor((diff % 86400000) / 3600000);
        document.getElementById('minutes').innerText = Math.floor((diff % 3600000) / 60000);
        document.getElementById('seconds').innerText = Math.floor((diff % 60000) / 1000);
    }, 1000);
}

// RSVP Form
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
        await fetch('/save-rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rsvps: weddingData.rsvps }) });
        const msgDiv = document.getElementById('rsvp-message');
        msgDiv.innerHTML = '<div style="background:#d4edda;padding:1rem;border-radius:8px;margin-top:1rem;text-align:center;">✅ ¡Gracias por confirmar, te esperamos! 🍋</div>';
        rsvpForm.reset();
        setTimeout(() => msgDiv.innerHTML = '', 5000);
    });
}

// Chatbot
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
        respuesta += `<br><a href="https://wa.me/${bodaInfo.whatsapp}" target="_blank">📱 Abrir WhatsApp 🍋</a>`;
    }
    msgsDiv.innerHTML += `<div class="message bot">${respuesta}</div>`;
    msgsDiv.scrollTop = msgsDiv.scrollHeight;
}

const toggleBtn = document.getElementById('chatbot-toggle');
if (toggleBtn) toggleBtn.addEventListener('click', () => {
    const win = document.getElementById('chatbot-window');
    win.classList.toggle('active');
    if (win.classList.contains('active')) agregarBotonesRapidos();
});
const closeBtn = document.getElementById('chatbot-close');
if (closeBtn) closeBtn.addEventListener('click', () => document.getElementById('chatbot-window').classList.remove('active'));
const sendBtn = document.getElementById('chatbot-send');
if (sendBtn) sendBtn.addEventListener('click', enviarMensaje);
const chatbotInput = document.getElementById('chatbot-input');
if (chatbotInput) chatbotInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') enviarMensaje(); });

const sliderPrev = document.getElementById('slider-prev');
const sliderNext = document.getElementById('slider-next');
if (sliderPrev) sliderPrev.addEventListener('click', prevSlide);
if (sliderNext) sliderNext.addEventListener('click', nextSlide);

function scrollToRSVP() { document.getElementById('rsvp')?.scrollIntoView({ behavior: 'smooth' }); }

loadPublicData();
setInterval(loadPublicData, 10000);

// Parallax ramas
(function initParallax() {
    const ramaIzq = document.querySelector('.rama-global-izq');
    const ramaDer = document.querySelector('.rama-global-der');
    if (!ramaIzq || !ramaDer) return;
    let ticking = false;
    function applyParallax() {
        const scrollY = window.scrollY;
        ramaIzq.style.top = `${-20 + scrollY * 0.15}px`;
        ramaDer.style.top = `${-20 + scrollY * 0.12}px`;
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(applyParallax); ticking = true; }
    }, { passive: true });
    applyParallax();
})();