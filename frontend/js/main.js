// ===== SCROLL REVEAL (lightweight) =====
document.querySelectorAll('.reveal, .reveal-right, .reveal-left').forEach(el => {
  el.classList.add('visible');
});

// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ===== AUTH NAVBAR UPDATE =====
function updateNavAuth() {
  const actions = document.getElementById('navActions');
  if (!actions || typeof api === 'undefined') return;
  const user = api.getUser();
  if (!user) return;
  const dashUrl = user.role === 'provider' ? '/pages/provider-dashboard.html' : '/pages/user-dashboard.html';
  actions.innerHTML = `
    <a href="${dashUrl}" class="btn-ghost">Dashboard</a>
    <button onclick="logout()" class="btn-primary">Logout</button>
  `;
}

// ===== FEATURED PROVIDERS ON LANDING =====
async function loadFeaturedProviders() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  try {
    const data = await api.getProviders({ limit: 3 });
    grid.innerHTML = '';
    if (!data.providers?.length) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">👷</div><p>No providers yet. Be the first!</p></div>';
      return;
    }
    data.providers.slice(0, 3).forEach(p => {
      const card = createProviderCard(p);
      card.classList.add('visible');
      grid.appendChild(card);
    });
  } catch (e) {
    grid.innerHTML = '<div class="empty-state"><p>Could not load providers.</p></div>';
  }
}

function createProviderCard(p) {
  const card = document.createElement('div');
  card.className = 'provider-card';
  const user = p.user || {};
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  card.innerHTML = `
    <div class="provider-card-top">
      <div class="provider-avatar">
        ${user.avatar ? `<img src="${user.avatar}" alt="${user.name}" />` : `<span>${initials}</span>`}
        <span class="online-dot ${user.isOnline ? 'online' : 'offline'}"></span>
      </div>
      <div class="provider-meta">
        <strong>${user.name || 'Provider'}</strong>
        <span class="category-badge">${categoryIcon(p.category)} ${categoryLabel(p.category)}</span>
        <div class="location">📍 ${p.location || user.location || 'Location not set'}</div>
        <div class="rating-row">
          <span class="stars">${renderStars(p.avgRating || 0)}</span>
          <span class="rating-count">${p.avgRating || '—'} (${p.reviews?.length || 0})</span>
        </div>
      </div>
    </div>
    <div class="provider-footer">
      <div class="provider-price">₹${p.hourlyRate || 0}<span>/hr</span></div>
      <span class="availability-badge ${p.availability ? 'avail' : 'busy'}">${p.availability ? '✓ Available' : '✗ Busy'}</span>
    </div>
  `;
  card.onclick = () => window.location.href = `/pages/provider-profile.html?id=${user._id}`;
  return card;
}

window.createProviderCard = createProviderCard;

document.addEventListener('DOMContentLoaded', () => {
  updateNavAuth();
  loadFeaturedProviders();
});
