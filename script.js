let weddingData = { config: {}, rsvps: [], photos: [] };
let countdownInterval = null;

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
    azulFe: { bg: '#002344', text: '#FFFFFF', gold: '#C5A02E', terra: '#B09020', sectionBg: '#001A33' },
    vinoTinto: { bg: '#FBF9F6', text: '#4A4A4A', gold: '#60100B', terra: '#500E09', sectionBg: '#F8F5F0' },
    negroOroRosa: { bg: '#1A1A1A', text: '#FFFFFF', gold: '#E2B4B4', terra: '#D2A4A4', sectionBg: '#252525' }
};

function applyTheme(themeName) {
    const theme = themes[themeName] || themes.blancoDorado;
    
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
    
    // Eliminar estilos anteriores y agregar nuevos
    const oldStyle = document.getElementById('dynamic-theme-style');
    if (oldStyle) oldStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'dynamic-theme-style';
    style.textContent = `.section-title:after { background: ${theme.gold} !important; }`;
    document.head.appendChild(style);
}

async function loadPublicData() {
    try {
        const res = await fetch('/get-data?_=' + Date.now());
        weddingData = await res.json();
        
        document.getElementById('couple-name').innerText = weddingData.config?.couple_name || 'Alejandro & Michell';
        const weddingDate = weddingData.config?.wedding_date;
        if (weddingDate) {
            document.getElementById('wedding-date').innerText = new Date(weddingDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        
        const venueName = weddingData.config?.venue_name || 'Basílica de Guadalupe';
        const venueAddress = weddingData.config?.venue_address || 'Fray Juan de Zumárraga No. 1, Villa Gustavo A. Madero, 07050 Ciudad de México, CDMX';
        const receptionName = weddingData.config?.reception_name || venueName;
        
        document.getElementById('venue-name').innerText = venueName;
        
        const ceremonyNameEl = document.getElementById('ceremony-name');
        const ceremonyAddressEl = document.getElementById('ceremony-address');
        const receptionNameEl = document.getElementById('reception-name');
        const receptionAddressEl = document.getElementById('reception-address');
        
        if (ceremonyNameEl) ceremonyNameEl.innerHTML = `<strong>${venueName}</strong>`;
        if (ceremonyAddressEl) ceremonyAddressEl.innerHTML = venueAddress;
        if (receptionNameEl) receptionNameEl.innerHTML = `<strong>${receptionName}</strong>`;
        if (receptionAddressEl) {
            if (weddingData.config?.reception_address) {
                receptionAddressEl.innerHTML = weddingData.config.reception_address;
            } else {
                receptionAddressEl.innerHTML = venueAddress;
            }
        }
        
        const coordinates = weddingData.config?.coordinates || '19.432608, -99.133209';
        const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
        
        if (!isNaN(lat) && !isNaN(lng)) {
            const mapIframe = document.getElementById('map-iframe');
            if (mapIframe) {
                const bbox = `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`;
                mapIframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
            }
            const mapAddress = document.getElementById('map-address');
            if (mapAddress) mapAddress.innerHTML = `📍 ${venueAddress}`;
        }
        
        document.getElementById('verse-text').innerText = weddingData.config?.verse_text || 'El amor es paciente, es bondadoso...';
        document.getElementById('verse-ref').innerText = weddingData.config?.verse_reference || '1 Corintios 13:4-8';
        document.getElementById('story-text').innerText = weddingData.config?.story_text || 'Nos conocimos en la Ciudad de México en el 2019, compartiendo sueños y construyendo amor. Hoy, gracias a Dios, celebramos nuestra unión.';
        
        renderGallery();
        startCountdown();
        
        const savedTheme = weddingData.config?.selected_theme || 'blancoDorado';
        applyTheme(savedTheme);
        
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
        msgDiv.innerHTML = '<div style="background:#d4edda;padding:1rem;border-radius:8px;margin-top:1rem;text-align:center;">✅ ¡Gracias por confirmar, te esperamos!</div>';
        rsvpForm.reset();
        setTimeout(() => msgDiv.innerHTML = '', 5000);
    });
}

const toggleBtn = document.getElementById('chatbot-toggle');
if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        document.getElementById('chatbot-window').classList.toggle('active');
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
    sendBtn.addEventListener('click', async () => {
        const input = document.getElementById('chatbot-input');
        const msg = input.value.trim();
        if (!msg) return;
        
        const msgsDiv = document.getElementById('chatbot-messages');
        msgsDiv.innerHTML += `<div class="message user">${msg}</div>`;
        input.value = '';
        msgsDiv.scrollTop = msgsDiv.scrollHeight;
        
        let waNumber = weddingData.config?.whatsapp_number;
        
        if (waNumber) {
            waNumber = waNumber.toString().replace(/[\s\-\(\)\+]/g, '');
        }
        
        if (waNumber && waNumber.length >= 10) {
            msgsDiv.innerHTML += `<div class="message bot">Gracias por tu mensaje. Un asistente te contactará por WhatsApp.</div>`;
            window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
        } else {
            msgsDiv.innerHTML += `<div class="message bot">⚠️ Lo siento, el número de contacto aún no está configurado. Por favor escribe a los novios directamente en WhatsApp: wa.me/5216641117035</div>`;
        }
        msgsDiv.scrollTop = msgsDiv.scrollHeight;
    });
}

function scrollToRSVP() {
    document.getElementById('rsvp')?.scrollIntoView({ behavior: 'smooth' });
}

loadPublicData();
setInterval(loadPublicData, 10000);