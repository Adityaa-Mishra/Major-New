const API_BASE = 'https://major-new-2ck4.onrender.com/api';

const api = {
  getToken() { return localStorage.getItem('mhw_token'); },
  getUser() { const u = localStorage.getItem('mhw_user'); return u ? JSON.parse(u) : null; },
  setAuth(token, user) { localStorage.setItem('mhw_token', token); localStorage.setItem('mhw_user', JSON.stringify(user)); },
  clearAuth() { localStorage.removeItem('mhw_token'); localStorage.removeItem('mhw_user'); },
  isLoggedIn() { return !!this.getToken(); },

  async req(method, path, body, auth = true) {
    const headers = {};
    if (auth && this.getToken()) headers['Authorization'] = `Bearer ${this.getToken()}`;
    const opts = { method, headers };

    if (body instanceof FormData) {
      opts.body = body;
    } else if (body) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else if (method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  get(path, auth) { return this.req('GET', path, null, auth); },
  post(path, body, auth) { return this.req('POST', path, body, auth); },
  put(path, body, auth) { return this.req('PUT', path, body, auth); },
  patch(path, body, auth) { return this.req('PATCH', path, body, auth); },

  // Auth
  register(data) { return this.post('/auth/register', data, false); },
  login(data) { return this.post('/auth/login', data, false); },
  me() { return this.get('/auth/me'); },
  updateProfile(data) { return this.patch('/auth/profile', data); },

  // Providers
  getProviders(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/providers?${q}`, false);
  },
  getProvider(id) { return this.get(`/providers/${id}`, false); },
  getMyProviderProfile() { return this.get('/providers/profile/me'); },
  updateProviderProfile(data) { return this.put('/providers/profile', data); },
  createWorkPost(formData) { return this.post('/providers/profile/work', formData); },
  deleteWorkPost(workId) { return this.req('DELETE', `/providers/profile/work/${workId}`); },

  // Bookings
  createBooking(data) { return this.post('/bookings', data); },
  getMyBookings() { return this.get('/bookings/my'); },
  updateBookingStatus(id, status) { return this.patch(`/bookings/${id}/status`, { status }); },

  // Chat
  getConversations() { return this.get('/chat/conversations'); },
  getMessages(userId) { return this.get(`/chat/${userId}`); },
  sendMessage(userId, content, file = null) {
    if (file) {
      const form = new FormData();
      form.append('content', content || '');
      form.append('media', file);
      return this.post(`/chat/${userId}`, form);
    }
    return this.post(`/chat/${userId}`, { content });
  },
};

// Toast notification system
function toast(msg, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || '💬'}</span> ${msg}`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(100px)';
    el.style.transition = 'all 0.3s';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

function showLoading() {
  let el = document.getElementById('loadingOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loadingOverlay';
    el.className = 'loading-overlay';
    el.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(el);
  }
  el.style.display = 'flex';
}

function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'none';
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(d) {
  const now = new Date();
  const then = new Date(d);
  const diff = now - then;

  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;

  const days = Math.floor(hr / 24);
  return `${days}d`;
}

function categoryLabel(cat) {
  const map = {
    electrician: 'Electrician',
    plumber: 'Plumber',
    cleaner: 'Cleaner',
    carpenter: 'Carpenter',
    painter: 'Painter',
    ac_repair: 'AC Repair',
    appliance_repair: 'Appliance Repair',
    gardener: 'Gardener',
    security: 'Security',
    other: 'Other'
  };
  return map[cat] || cat;
}

function categoryIcon(cat) {
  const map = {
    electrician: '⚡',
    plumber: '🔧',
    cleaner: '🧹',
    carpenter: '🪚',
    painter: '🖌️',
    ac_repair: '❄️',
    appliance_repair: '🔌',
    gardener: '🌿',
    security: '🔒',
    other: '🛠️'
  };
  return map[cat] || '🛠️';
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const empty = 5 - full;
  return '★'.repeat(full) + '☆'.repeat(empty);
}

function requireAuth(role) {
  if (!api.isLoggedIn()) {
    window.location.href = './pages/login.html';
    return false;
  }
  if (role) {
    const u = api.getUser();
    if (u.role !== role) {
      toast('Access denied', 'error');
      window.location.href = './pages/login.html';
      return false;
    }
  }
  return true;
}

function logout() {
  api.clearAuth();
  window.location.href = './';
}

function setupMobileNav() {
  const nav = document.querySelector('.navbar');
  const navInner = nav?.querySelector('.nav-inner');
  if (!nav || !navInner || navInner.dataset.mobileReady === 'true') return;

  const navLinks = navInner.querySelector('.nav-links');
  const navActions = navInner.querySelector('.nav-actions');
  const hasNavContent = Boolean((navLinks && navLinks.children.length) || (navActions && navActions.children.length));
  if (!hasNavContent) return;

  nav.classList.add('navbar-mobile-ready');
  navInner.dataset.mobileReady = 'true';

  let hamburger = navInner.querySelector('.hamburger');
  if (!hamburger) {
    hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    hamburger.type = 'button';
    hamburger.setAttribute('aria-label', 'Open menu');
    hamburger.innerHTML = '<span></span><span></span><span></span>';
    navInner.appendChild(hamburger);
  }

  const overlay = document.createElement('div');
  overlay.className = 'mobile-nav-overlay';
  overlay.innerHTML = '<aside class="mobile-nav-drawer"><div class="mobile-nav-links"></div><div class="mobile-nav-actions"></div></aside>';
  document.body.appendChild(overlay);

  const drawerLinks = overlay.querySelector('.mobile-nav-links');
  const drawerActions = overlay.querySelector('.mobile-nav-actions');

  const syncDrawer = () => {
    drawerLinks.innerHTML = navLinks ? navLinks.innerHTML : '';
    drawerActions.innerHTML = navActions ? navActions.innerHTML : '';
  };

  syncDrawer();

  const closeMenu = () => overlay.classList.remove('open');
  const openMenu = () => {
    syncDrawer();
    overlay.classList.add('open');
  };

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (overlay.classList.contains('open')) closeMenu();
    else openMenu();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMenu();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) {
      setTimeout(closeMenu, 80);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupMobileNav();
});

window.api = api;
window.toast = toast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.timeAgo = timeAgo;
window.categoryLabel = categoryLabel;
window.categoryIcon = categoryIcon;
window.renderStars = renderStars;
window.requireAuth = requireAuth;
window.logout = logout;
