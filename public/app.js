const API = '';
const state = {
  token: localStorage.getItem('ku_token') || null,
  user: null,
  coords: { lat: 29.6857, lng: 76.9905 }, // default: Karnal, Haryana
  map: null,
  markers: [],
  currentLang: 'en', // default language
};

// State-to-Language Mapping Table
const REGIONAL_LANGUAGES = {
  'Haryana': 'hi',       // Hindi
  'Punjab': 'pa',        // Punjabi
  'West Bengal': 'bn',   // Bengali
  'Maharashtra': 'mr',   // Marathi
  'Gujarat': 'gu',       // Gujarati
  'Tamil Nadu': 'ta'     // Tamil
};

// ------------------------------------------------------------------ helpers
function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong.'), { code: data.code, status: res.status });
  return data;
}

function initials(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

// ------------------------------------------------------------------ auth modal
const authBackdrop = document.getElementById('authBackdrop');
if (authBackdrop) {
  document.querySelectorAll('[data-open-auth]').forEach((btn) => {
    btn.addEventListener('click', () => openAuth(btn.dataset.openAuth));
  });
  document.getElementById('authClose').addEventListener('click', closeAuth);
  authBackdrop.addEventListener('click', (e) => { if (e.target === authBackdrop) closeAuth(); });
}

function openAuth(tab) {
  authBackdrop.classList.remove('hidden');
  switchTab(tab);
}
function closeAuth() {
  authBackdrop.classList.add('hidden');
}
function switchTab(tab) {
  document.querySelectorAll('.modal__tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === tab));
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('signupForm').classList.toggle('hidden', tab !== 'signup');
}
document.querySelectorAll('.modal__tab').forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  try {
    const data = await api('/api/auth/login', { method: 'POST', body: { email: form.get('email'), password: form.get('password') } });
    onAuthed(data);
    closeAuth();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const errEl = document.getElementById('signupError');
  errEl.textContent = '';
  try {
    const data = await api('/api/auth/signup', {
      method: 'POST',
      body: {
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
        location: form.get('location'),
        primaryCrops: form.get('primaryCrops'),
      },
    });
    onAuthed(data);
    closeAuth();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

function onAuthed({ token, user }) {
  state.token = token;
  state.user = user;
  localStorage.setItem('ku_token', token);
  renderAuthedUI();
}

document.getElementById('signOutBtn')?.addEventListener('click', () => {
  state.token = null;
  state.user = null;
  localStorage.removeItem('ku_token');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('landing').classList.remove('hidden');
  document.getElementById('authActions').classList.remove('hidden');
  document.getElementById('userActions').classList.add('hidden');
});

// ------------------------------------------------------------------ render dashboard
function renderAuthedUI() {
  document.getElementById('authActions').classList.add('hidden');
  document.getElementById('userActions').classList.remove('hidden');
  document.getElementById('userChip').textContent = state.user.name;
  document.getElementById('landing').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');

  document.getElementById('avatarInitial').textContent = initials(state.user.name);
  document.getElementById('profileName').textContent = state.user.name;
  document.getElementById('profileMeta').textContent = `${state.user.location} · ${state.user.primaryCrops}`;

  const badge = document.getElementById('subBadge');
  const paywall = document.getElementById('paywallCard');
  if (state.user.isSubscribed) {
    badge.textContent = 'Krishak Plus';
    badge.classList.add('is-active');
    paywall.classList.add('hidden');
  } else {
    badge.textContent = 'Free plan';
    badge.classList.remove('is-active');
    paywall.classList.remove('hidden');
  }

  // Pre-fill crop in booking form
  const bookCropInput = document.getElementById('bookCrop');
  if (bookCropInput && state.user.primaryCrops) {
    bookCropInput.value = state.user.primaryCrops.split(',')[0].trim();
  }

  // Set default booking date to today
  const bookDateInput = document.getElementById('bookDate');
  if (bookDateInput) {
    bookDateInput.value = new Date().toISOString().split('T')[0];
  }

  loadMandiDropdown();
  loadQueueStatus();
}

// ------------------------------------------------------------------ dashboard nav
document.querySelectorAll('.dash-nav__item').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.dash-nav__item').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    document.querySelectorAll('.panel').forEach((p) => p.classList.add('hidden'));
    
    const panelId = btn.dataset.panel;
    document.getElementById(`panel-${panelId}`).classList.remove('hidden');

    if (panelId === 'markets') {
      initMap();
      loadBestMarkets();
    } else if (panelId === 'queue-tracker') {
      loadQueueStatus();
    }
  });
});

// ------------------------------------------------------------------ Mandi Dropdown & Booking
async function loadMandiDropdown() {
  const select = document.getElementById('bookMandi');
  if (!select) return;

  try {
    const mandis = await api('/api/mandis');
    select.innerHTML = mandis
      .map((m) => `<option value="${m.id}">${m.name} (₹${m.pricePerQuintal}/qtl)</option>`)
      .join('');
  } catch (err) {
    select.innerHTML = '<option value="">Could not load mandis</option>';
  }
}

document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Show Verification Modal before proceeding with booking
  openVerificationModal();
});

// Verification Modal Flow
function openVerificationModal() {
  const modal = document.getElementById('verificationModal');
  if (modal) modal.classList.remove('hidden');
}

document.getElementById('closeModalBtn')?.addEventListener('click', () => {
  document.getElementById('verificationModal').classList.add('hidden');
});

document.getElementById('verifyBtn')?.addEventListener('click', async () => {
  const idInput = document.getElementById('idInput').value.trim();
  if (idInput.length !== 12 || isNaN(idInput)) {
    alert('Please enter a valid 12-digit ID number.');
    return;
  }

  try {
    // Proceed with booking call once ID format is validated
    const resultEl = document.getElementById('bookingResult');
    resultEl.classList.add('hidden');

    const payload = {
      mandiId: document.getElementById('bookMandi').value,
      date: document.getElementById('bookDate').value,
      timeSlot: document.getElementById('bookSlot').value,
      crop: document.getElementById('bookCrop').value,
      quantityQuintals: document.getElementById('bookQty').value,
      identityNumber: idInput
    };

    const data = await api('/api/bookings/book', { method: 'POST', body: payload });
    
    document.getElementById('verificationModal').classList.add('hidden');
    resultEl.classList.remove('hidden');
    resultEl.className = 'booking-result booking-result--success';
    resultEl.innerHTML = `
      <h4>🎉 Slot Booked Successfully!</h4>
      <p><strong>Token Number:</strong> ${data.booking.token}</p>
      <p><strong>Mandi:</strong> ${data.booking.mandiName}</p>
      <p><strong>Date & Slot:</strong> ${data.booking.date} | ${data.booking.timeSlot}</p>
    `;

    setTimeout(() => {
      document.querySelector('[data-panel="queue-tracker"]').click();
    }, 1800);
  } catch (err) {
    alert('Verification/Booking Error: ' + err.message);
  }
});

// ------------------------------------------------------------------ Live Queue Management
document.getElementById('refreshQueueBtn')?.addEventListener('click', loadQueueStatus);

async function loadQueueStatus() {
  const container = document.getElementById('queueList');
  if (!container) return;

  try {
    const { bookings } = await api('/api/bookings/my-queue');
    if (!bookings || bookings.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>No active slot bookings found. Click "Book Slot" to reserve your spot at a mandi.</p></div>`;
      return;
    }

    container.innerHTML = bookings
      .map((b) => {
        const { liveQueue } = b;
        return `
          <div class="token-card">
            <div class="token-card__header">
              <div>
                <span class="token-badge">${b.token}</span>
                <span class="queue-status-pill queue-status-pill--${liveQueue.queueStatus.replace(/\s+/g, '-').toLowerCase()}">
                  ${liveQueue.queueStatus}
                </span>
              </div>
              <small class="muted">Booked on ${new Date(b.createdAt).toLocaleDateString()}</small>
            </div>

            <div class="token-card__body">
              <div><strong>Mandi:</strong> ${b.mandiName}</div>
              <div><strong>Scheduled Slot:</strong> ${b.date} (${b.timeSlot})</div>
              <div><strong>Crop Details:</strong> ${b.quantityQuintals} Quintals of ${b.crop}</div>
            </div>

            <div class="token-card__queue-info">
              <div class="queue-stat">
                <span class="queue-stat__label">Currently Serving Gate Token</span>
                <span class="queue-stat__val">${liveQueue.currentServingToken}</span>
              </div>
              <div class="queue-stat">
                <span class="queue-stat__label">Vehicles Ahead</span>
                <span class="queue-stat__val">${liveQueue.tokensAhead}</span>
              </div>
              <div class="queue-stat">
                <span class="queue-stat__label">Est. Wait Time</span>
                <span class="queue-stat__val">~${liveQueue.estimatedWaitMins} mins</span>
              </div>
            </div>

            <div class="token-card__actions">
              <button class="btn btn--ghost btn--sm" onclick="triggerSmsAlert('${b.id}')">Simulate SMS Notification</button>
            </div>
          </div>
        `;
      })
      .join('');
  } catch (err) {
    container.innerHTML = `<p class="form-error">Could not fetch queue details: ${err.message}</p>`;
  }
}

async function triggerSmsAlert(bookingId) {
  try {
    const res = await api('/api/bookings/send-sms', { method: 'POST', body: { bookingId } });
    alert(res.smsText);
  } catch (err) {
    alert('SMS Trigger Error: ' + err.message);
  }
}
window.triggerSmsAlert = triggerSmsAlert;

// ------------------------------------------------------------------ map + best markets
function initMap() {
  if (state.map) return;
  state.map = L.map('map').setView([state.coords.lat, state.coords.lng], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(state.map);
}

function clearMarkers() {
  state.markers.forEach((m) => state.map.removeLayer(m));
  state.markers = [];
}

const farmerIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#1F4D2C;border:3px solid #fff;box-shadow:0 0 0 2px #1F4D2C;"></div>',
  iconSize: [16, 16],
});
const mandiIcon = (rank) => L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:50%;background:#D98C2B;color:#fff;display:flex;align-items:center;justify-content:center;font:700 12px Manrope,sans-serif;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);">${rank}</div>`,
  iconSize: [26, 26],
});

document.getElementById('locateBtn')?.addEventListener('click', () => {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      loadBestMarkets();
    },
    () => { /* fallback */ },
    { timeout: 6000 }
  );
});

async function loadBestMarkets() {
  const listEl = document.getElementById('marketList');

  if (!state.user.isSubscribed) {
    listEl.innerHTML = '<li class="muted">Ranked best-market analytics is part of Krishak Plus. Upgrade from the sidebar.</li>';
    if (state.map) {
      initMap();
      clearMarkers();
      const me = L.marker([state.coords.lat, state.coords.lng], { icon: farmerIcon }).addTo(state.map).bindPopup('You');
      state.markers.push(me);
    }
    return;
  }

  try {
    const { results, origin } = await api(`/api/mandis/best?lat=${state.coords.lat}&lng=${state.coords.lng}`);
    listEl.innerHTML = '';
    results.forEach((m, i) => {
      const li = document.createElement('li');
      if (i === 0) li.classList.add('is-top');
      li.innerHTML = `
        <span class="market-rank">${i + 1}</span>
        <div style="flex:1">
          <div class="market-name">${m.name}</div>
          <div class="market-sub">${m.distanceKm} km away · ₹${m.pricePerQuintal}/quintal</div>
        </div>
        <div class="market-net">₹${m.netPerQuintal}<small>net / quintal</small></div>
      `;
      listEl.appendChild(li);
    });

    initMap();
    clearMarkers();
    state.map.setView([origin.lat, origin.lng], 10);
    const me = L.marker([origin.lat, origin.lng], { icon: farmerIcon }).addTo(state.map).bindPopup('You');
    state.markers.push(me);
    results.forEach((m, i) => {
      const marker = L.marker([m.lat, m.lng], { icon: mandiIcon(i + 1) })
        .addTo(state.map)
        .bindPopup(`<strong>${m.name}</strong><br>₹${m.pricePerQuintal}/quintal · ${m.distanceKm} km`);
      state.markers.push(marker);
    });
  } catch (err) {
    listEl.innerHTML = `<li class="form-error">${err.message}</li>`;
  }
}

// ------------------------------------------------------------------ AI chat & Speech Recognition
const chatWindow = document.getElementById('chatWindow');
const micBtn = document.getElementById('micBtn');
const chatInput = document.getElementById('chatInput');
const langToggleBtn = document.getElementById('langToggleBtn');

// Language Toggle Control
langToggleBtn?.addEventListener('click', () => {
  const userState = state.user?.location?.split(',')[1]?.trim() || 'Haryana';
  const localLang = REGIONAL_LANGUAGES[userState] || 'hi';
  
  state.currentLang = state.currentLang === 'en' ? localLang : 'en';
  langToggleBtn.textContent = state.currentLang === 'en' ? 'En ⇄ Regional' : `Lang: ${state.currentLang.toUpperCase()}`;
});

// Web Speech API Integration
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn.addEventListener('click', () => {
    recognition.lang = state.currentLang === 'hi' ? 'hi-IN' : 'en-US';
    recognition.start();
    micBtn.classList.add('listening');
  });

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    micBtn.classList.remove('listening');
    document.getElementById('chatForm').dispatchEvent(new Event('submit'));
  };

  recognition.onerror = () => {
    micBtn.classList.remove('listening');
  };
} else if (micBtn) {
  micBtn.style.display = 'none';
}

function formatAIResponse(text) {
  if (!text) return '';
  return text
    .replace(/#/g, '')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/(\d+\.\s+)/g, '<br><br>$1')
    .replace(/^(<br>)+/, '');
}

function addMsg(text, who) {
  const div = document.createElement('div');
  div.className = `chat-msg chat-msg--${who}`;
  
  if (who === 'ai') {
    div.innerHTML = formatAIResponse(text);
  } else {
    div.textContent = text;
  }

  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

document.getElementById('chatForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  if (!state.user?.isSubscribed) {
    addMsg("The AI advisor is part of Krishak Plus — upgrade from the sidebar to start chatting.", 'ai');
    input.value = '';
    return;
  }

  addMsg(text, 'user');
  input.value = '';

  try {
    const { reply } = await api('/api/chat', {
      method: 'POST',
      body: { 
        userPrompt: text, 
        lat: state.coords.lat, 
        lng: state.coords.lng,
        targetLanguage: state.currentLang 
      },
    });
    addMsg(reply, 'ai');
  } catch (err) {
    addMsg(err.message, 'ai');
  }
});

// ------------------------------------------------------------------ Razorpay subscription
document.getElementById('upgradeBtn')?.addEventListener('click', async () => {
  try {
    const data = await api('/api/payments/create-order', { method: 'POST' });
    if (!data || !data.order) throw new Error(data.error || 'Failed to create payment order.');

    const { order, keyId } = data;

    const rzp = new Razorpay({
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,
      name: 'Krishak Unnayan',
      description: 'Krishak Plus — monthly subscription',
      theme: { color: '#1F4D2C' },
      handler: async (response) => {
        try {
          const { user } = await api('/api/payments/verify', { method: 'POST', body: response });
          state.user = user;
          renderAuthedUI();
        } catch (err) {
          alert(err.message || 'Payment verification failed.');
        }
      },
      prefill: { name: state.user?.name || '', email: state.user?.email || '' },
    });

    rzp.on('payment.failed', function (response) {
      alert(`Payment failed: ${response.error.description}`);
    });

    rzp.open();
  } catch (err) {
    console.error('Payment Error:', err);
    alert(err.message || 'Could not start the payment.');
  }
});

// ------------------------------------------------------------------ boot
(async function boot() {
  if (!state.token) return;
  try {
    const { user } = await api('/api/auth/me');
    state.user = user;
    renderAuthedUI();
  } catch {
    localStorage.removeItem('ku_token');
    state.token = null;
  }
})();
