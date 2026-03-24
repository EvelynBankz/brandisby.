// brand.js
document.addEventListener('DOMContentLoaded', async () => {
  const slug = window.getCurrentBrandSlug ? window.getCurrentBrandSlug() : URLUtils.getParam('slug');
  if (!slug) { window.location.href = '../index.html'; return; }

  let allProducts = [], currentBrand = null;

  // Checkout and back links
  document.getElementById('checkout-link').href = (typeof BrandURL!=='undefined') ? BrandURL.checkout(slug) : `checkout.html?slug=${slug}`;

  // Load brand
  try {
    currentBrand = await Brands.getBySlug(slug);
    if (!currentBrand) { showBrandError(); return; }
    renderBrand(currentBrand);
    document.title = `${currentBrand.name} — Brandisby`;
  } catch(e) { showBrandError(); return; }

  // Load products
  try {
    allProducts = await Products.getByBrand(slug);
    renderProducts(allProducts);
  } catch(e) { renderProducts([]); }

  function renderBrand(b) {
    document.getElementById('brand-nav-title').textContent = b.name || '';
    document.getElementById('brand-header-name').textContent = b.name || '';
    document.getElementById('brand-header-tagline').textContent = b.tagline || b.description || '';
    document.getElementById('brand-header-url').textContent = (typeof BrandURL!=='undefined') ? BrandURL.display(b.slug) : `${b.slug}.brandisby.com`;

    const bg = document.getElementById('brand-header-bg');
    if (b.bannerUrl) {
      const img = document.createElement('img');
      img.src = b.bannerUrl; img.alt = b.name;
      bg.appendChild(img);
    } else if (b.brandColor) {
      bg.style.background = `linear-gradient(135deg, ${b.brandColor} 0%, #1b1513 100%)`;
    }

    const logoWrap = document.getElementById('brand-logo-wrap');
    if (b.logoUrl) {
      logoWrap.innerHTML = `<img src="${b.logoUrl}" alt="${b.name}"/>`;
    } else {
      const initials = b.name ? b.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : 'B';
      document.getElementById('brand-logo-initials').textContent = initials;
    }
    if (b.brandColor) document.documentElement.style.setProperty('--brown', b.brandColor);
  }

  function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    const empty = document.getElementById('products-empty');
    grid.innerHTML = '';
    if (!products.length) { empty.classList.remove('hidden'); return; }
    empty.classList.add('hidden');

    products.forEach(p => {
      const url = (typeof BrandURL!=='undefined') ? BrandURL.product(slug, p.id) : `product.html?slug=${slug}&id=${p.id}`;
      const card = document.createElement('a');
      card.href = url; card.className = 'product-card';
      card.innerHTML = `
        <div class="product-card-img">
          ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}" loading="lazy"/>` : '🛍️'}
          <div class="product-card-badges">
            ${p.allowCustom ? '<span class="badge badge-brown">Custom</span>' : ''}
            ${p.stock === 0 ? '<span class="badge badge-red">Sold Out</span>' : ''}
          </div>
        </div>
        <div class="product-card-body">
          <div class="product-card-name">${p.name || 'Product'}</div>
          <div class="product-card-price">₦${Number(p.price||0).toLocaleString()}</div>
          <div class="product-card-meta">
            <span class="badge badge-brown">${p.category || 'General'}</span>
          </div>
        </div>`;
      grid.appendChild(card);
    });
  }

  // Filters
  let searchTerm = '', catFilter = '', sortMode = 'newest';
  function applyFilters() {
    let f = [...allProducts];
    if (searchTerm) f = f.filter(p => (p.name||'').toLowerCase().includes(searchTerm.toLowerCase()) || (p.description||'').toLowerCase().includes(searchTerm.toLowerCase()));
    if (catFilter) f = f.filter(p => p.category === catFilter);
    if (sortMode === 'price-asc') f.sort((a,b) => (a.price||0)-(b.price||0));
    else if (sortMode === 'price-desc') f.sort((a,b) => (b.price||0)-(a.price||0));
    renderProducts(f);
  }

  document.getElementById('search-input').addEventListener('input', e => { searchTerm = e.target.value; applyFilters(); });
  document.getElementById('category-filter').addEventListener('change', e => { catFilter = e.target.value; applyFilters(); });
  document.getElementById('sort-filter').addEventListener('change', e => { sortMode = e.target.value; applyFilters(); });

  // View toggle
  const grid = document.getElementById('products-grid');
  document.getElementById('view-grid-btn').addEventListener('click', () => {
    grid.classList.remove('list-view');
    document.getElementById('view-grid-btn').classList.add('active');
    document.getElementById('view-list-btn').classList.remove('active');
  });
  document.getElementById('view-list-btn').addEventListener('click', () => {
    grid.classList.add('list-view');
    document.getElementById('view-list-btn').classList.add('active');
    document.getElementById('view-grid-btn').classList.remove('active');
  });

  // Mobile filter toggle
  const filterToggle = document.getElementById('filter-toggle-btn');
  if (filterToggle) {
    filterToggle.classList.remove('hidden');
    filterToggle.addEventListener('click', () => {
      document.getElementById('filter-controls').classList.toggle('show');
    });
  }

  // Cart
  function refreshCart() {
    const items = Cart.get(slug);
    const count = Cart.count(slug);
    const total = Cart.total(slug);
    document.getElementById('cart-count').textContent = count;
    document.getElementById('cart-total').textContent = `₦${total.toLocaleString()}`;

    const body = document.getElementById('cart-body');
    const footer = document.getElementById('cart-footer');

    if (!items.length) {
      body.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p>Your cart is empty</p></div>`;
      footer.style.display = 'none'; return;
    }
    footer.style.display = 'block';
    body.innerHTML = items.map((item, i) => `
      <div class="cart-item">
        <div class="cart-item-img">${item.image?`<img src="${item.image}" alt="${item.name}"/>`:'🛍️'}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          ${item.customization ? `<div class="cart-item-custom">${Object.entries(item.customization).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(' · ')}</div>` : ''}
          <div class="cart-item-price">₦${Number(item.price).toLocaleString()}</div>
          <div class="cart-item-actions">
            <div class="qty-ctrl">
              <button class="qty-ctrl-btn" onclick="cartChangeQty(${i},-1)">−</button>
              <span class="qty-ctrl-num">${item.qty}</span>
              <button class="qty-ctrl-btn" onclick="cartChangeQty(${i},1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="cartRemove(${i})">✕ Remove</button>
          </div>
        </div>
      </div>`).join('');
  }

  window.cartChangeQty = (i, d) => { const items = Cart.get(slug); items[i].qty = Math.max(1, items[i].qty + d); Cart.set(slug, items); refreshCart(); };
  window.cartRemove = (i) => { Cart.remove(slug, i); refreshCart(); };

  function openCart() {
    document.getElementById('cart-drawer').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    refreshCart();
  }
  function closeCart() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('cart-open-btn').addEventListener('click', openCart);
  document.getElementById('cart-close-btn').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);
  document.getElementById('cart-continue-btn').addEventListener('click', closeCart);

  refreshCart();

  function showBrandError() {
    document.body.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:DM Sans,sans-serif;text-align:center;padding:2rem;background:#f7f3ef;"><div><div style="font-size:4rem;margin-bottom:1rem">🔍</div><h2 style="font-family:Cormorant Garamond,serif;font-size:2rem;font-weight:300;margin-bottom:0.5rem;">Brand not found</h2><p style="color:#9c8880;margin-bottom:2rem">This brand link doesn't exist or has been removed.</p><a href="../index.html" style="background:#5a3c30;color:#fff;padding:0.85rem 2rem;border-radius:100px;text-decoration:none;font-size:0.95rem;">Back to Brandisby</a></div></div>`;
  }
});
