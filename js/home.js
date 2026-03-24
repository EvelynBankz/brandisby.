// home.js
document.addEventListener('DOMContentLoaded', async () => {
  // Typing animation
  const brandNames = ['FleurDeVie', 'NovaCraft', 'ZenThreads', 'LuminaStudio', 'UrbanRoot'];
  let idx = 0, charIdx = 0, deleting = false;
  const typed = document.getElementById('typed-demo');

  function typeLoop() {
    const current = brandNames[idx];
    if (!deleting) {
      typed.textContent = current.slice(0, ++charIdx);
      if (charIdx === current.length) { deleting = true; setTimeout(typeLoop, 1800); return; }
    } else {
      typed.textContent = current.slice(0, --charIdx);
      if (charIdx === 0) { deleting = false; idx = (idx + 1) % brandNames.length; }
    }
    setTimeout(typeLoop, deleting ? 60 : 110);
  }
  typeLoop();

  // Load brands
  const grid = document.getElementById('brands-grid');
  const empty = document.getElementById('brands-empty');

  try {
    const brands = await Brands.getAll(12);
    grid.innerHTML = '';

    if (brands.length === 0) {
      empty.classList.remove('hidden');
      return;
    }

    brands.forEach(brand => {
      const initials = brand.name ? brand.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : 'B';
      const storeUrl = (typeof BrandURL !== 'undefined') ? BrandURL.store(brand.slug) : `pages/brand.html?slug=${brand.slug}`;
      const displayLink = (typeof BrandURL !== 'undefined') ? BrandURL.display(brand.slug) : `${brand.slug}.brandisby.com`;
      const card = document.createElement('a');
      card.href = storeUrl;
      card.className = 'brand-card';
      card.innerHTML = `
        <div class="brand-card-banner" style="background:${brand.bannerColor || 'linear-gradient(135deg,#5a3c30,#1b1513)'}">
          ${brand.bannerUrl ? `<img src="${brand.bannerUrl}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" />` : ''}
          <div class="brand-card-logo">
            ${brand.logoUrl ? `<img src="${brand.logoUrl}" />` : initials}
          </div>
        </div>
        <div class="brand-card-info">
          <div class="brand-card-name">${brand.name || 'Unnamed Brand'}</div>
          <div class="brand-card-handle">${displayLink}</div>
          <div class="brand-card-desc">${brand.description || 'A unique brand on Brandisby.'}</div>
          <div class="brand-card-meta">
            <span>🛍 ${brand.productCount || 0} products</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (e) {
    console.error(e);
    grid.innerHTML = '';
    empty.classList.remove('hidden');
  }

  // Nav auth state
  Auth.onAuthChange(user => {
    const loginBtn = document.getElementById('nav-login-btn');
    if (user && loginBtn) {
      loginBtn.textContent = 'Dashboard';
      loginBtn.href = 'pages/dashboard.html';
    }
  });
});
