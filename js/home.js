// home.js
document.addEventListener('DOMContentLoaded', async () => {
  // Typing animation
  const slugs = ['goodies', 'fleurdevie', 'novacraft', 'zenthreads', 'luminastudio'];
  let idx = 0, charIdx = 0, deleting = false;
  const typed = document.getElementById('typed-slug');
  if (typed) {
    function typeLoop() {
      const current = slugs[idx];
      if (!deleting) {
        typed.textContent = current.slice(0, ++charIdx);
        if (charIdx === current.length) { deleting = true; setTimeout(typeLoop, 2000); return; }
      } else {
        typed.textContent = current.slice(0, --charIdx);
        if (charIdx === 0) { deleting = false; idx = (idx + 1) % slugs.length; }
      }
      setTimeout(typeLoop, deleting ? 55 : 100);
    }
    typeLoop();
  }

  // Nav auth state
  Auth.onAuthChange(user => {
    const btn = document.getElementById('nav-signin');
    const mobileBtn = document.getElementById('mobile-signin');
    if (user) {
      if (btn) { btn.textContent = 'Dashboard'; btn.href = 'pages/dashboard.html'; }
      if (mobileBtn) { mobileBtn.textContent = 'Dashboard'; mobileBtn.href = 'pages/dashboard.html'; }
    }
  });

  // Load brands
  const grid = document.getElementById('brands-grid');
  const empty = document.getElementById('brands-empty');
  if (!grid) return;

  try {
    const brands = await Brands.getAll(12);
    grid.innerHTML = '';
    if (!brands.length) { empty.classList.remove('hidden'); return; }

    brands.forEach(brand => {
      const initials = brand.name ? brand.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : 'B';
      const storeUrl = (typeof BrandURL !== 'undefined') ? BrandURL.store(brand.slug) : `pages/brand.html?slug=${brand.slug}`;
      const displayUrl = (typeof BrandURL !== 'undefined') ? BrandURL.display(brand.slug) : `${brand.slug}.brandisby.com`;

      const card = document.createElement('a');
      card.href = storeUrl;
      card.className = 'brand-card';
      card.innerHTML = `
        <div class="brand-card-banner" style="background:${brand.brandColor ? `linear-gradient(135deg,${brand.brandColor},#1b1513)` : 'linear-gradient(135deg,#5a3c30,#1b1513)'};">
          ${brand.bannerUrl ? `<img src="${brand.bannerUrl}" alt="${brand.name}" loading="lazy"/>` : ''}
          <div class="brand-card-logo-wrap">
            ${brand.logoUrl ? `<img src="${brand.logoUrl}" alt="${brand.name}"/>` : `<span class="brand-card-logo-initials">${initials}</span>`}
          </div>
        </div>
        <div class="brand-card-body">
          <div class="brand-card-name">${brand.name || 'Unnamed Brand'}</div>
          <div class="brand-card-url">${displayUrl}</div>
          <div class="brand-card-desc">${brand.description || 'A unique brand on Brandisby.'}</div>
          <div class="brand-card-footer">
            <span class="brand-card-count">🛍 ${brand.productCount || 0} products</span>
            <span class="badge badge-brown">Visit →</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch(e) {
    console.error(e);
    grid.innerHTML = '';
    empty.classList.remove('hidden');
  }
});
