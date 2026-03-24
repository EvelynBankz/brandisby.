// brand.js — Brand Storefront Logic
document.addEventListener('DOMContentLoaded', async () => {
  const slug = URLUtils.getParam('slug');
  if (!slug) { window.location.href = '../index.html'; return; }

  let allProducts = [];
  let currentBrand = null;

  // ===== LOAD BRAND =====
  try {
    currentBrand = await Brands.getBySlug(slug);
    if (!currentBrand) { showError('Brand not found'); return; }
    renderBrandHeader(currentBrand);
    document.title = `${currentBrand.name} — Brandisby`;
  } catch (e) {
    showError('Failed to load brand');
    return;
  }

  // ===== LOAD PRODUCTS =====
  try {
    allProducts = await Products.getByBrand(slug);
    renderProducts(allProducts);
  } catch (e) {
    renderProducts([]);
  }

  // ===== RENDER BRAND HEADER =====
  function renderBrandHeader(brand) {
    document.getElementById('brand-nav-logo').textContent = brand.name || '';
    document.getElementById('brand-name').textContent = brand.name || '';
    document.getElementById('brand-tagline').textContent = brand.tagline || brand.description || '';
    document.getElementById('brand-link-badge').textContent = (typeof BrandURL !== 'undefined') ? BrandURL.display(brand.slug) : `${brand.slug}.brandisby.com`;

    const bg = document.getElementById('brand-header-bg');
    if (brand.bannerUrl) {
      bg.style.backgroundImage = `url(${brand.bannerUrl})`;
      bg.style.backgroundSize = 'cover';
      bg.style.backgroundPosition = 'center';
    } else if (brand.brandColor) {
      bg.style.background = `linear-gradient(135deg, ${brand.brandColor} 0%, #1b1513 100%)`;
    }

    const logoWrap = document.getElementById('brand-logo-wrap');
    if (brand.logoUrl) {
      logoWrap.innerHTML = `<img src="${brand.logoUrl}" alt="${brand.name} logo" />`;
    } else {
      const initials = brand.name ? brand.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : 'B';
      document.getElementById('brand-logo-initials').textContent = initials;
    }

    // Apply brand color to nav and accents
    if (brand.brandColor) {
      document.documentElement.style.setProperty('--brand-brown', brand.brandColor);
    }
  }

  // ===== RENDER PRODUCTS =====
  function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    const empty = document.getElementById('products-empty');
    grid.innerHTML = '';

    if (!products.length) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    products.forEach(product => {
      const card = document.createElement('a');
      card.href = (typeof BrandURL !== 'undefined') ? BrandURL.product(slug, product.id) : `product.html?slug=${slug}&id=${product.id}`;
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-card-img">
          ${product.images && product.images[0]
            ? `<img src="${product.images[0]}" alt="${product.name}" />`
            : '🛍️'}
        </div>
        <div class="product-card-info">
          <div class="product-card-name">${product.name || 'Untitled Product'}</div>
          <div class="product-card-price">₦${Number(product.price || 0).toLocaleString()}</div>
          <span class="product-card-category">${product.category || 'General'}</span>
          ${product.allowCustom ? '<span class="product-card-custom-badge">Custom</span>' : ''}
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // ===== FILTERS =====
  let searchTerm = '', categoryFilter = '', sortMode = 'newest';

  function applyFilters() {
    let filtered = [...allProducts];
    if (searchTerm) filtered = filtered.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (categoryFilter) filtered = filtered.filter(p => p.category === categoryFilter);
    if (sortMode === 'price-asc') filtered.sort((a,b) => (a.price||0) - (b.price||0));
    else if (sortMode === 'price-desc') filtered.sort((a,b) => (b.price||0) - (a.price||0));
    renderProducts(filtered);
  }

  document.getElementById('search-input').addEventListener('input', e => { searchTerm = e.target.value; applyFilters(); });
  document.getElementById('category-filter').addEventListener('change', e => { categoryFilter = e.target.value; applyFilters(); });
  document.getElementById('sort-filter').addEventListener('change', e => { sortMode = e.target.value; applyFilters(); });

  // View toggle
  document.getElementById('view-grid').addEventListener('click', () => {
    document.getElementById('products-grid').classList.remove('list-view');
    document.getElementById('view-grid').classList.add('active');
    document.getElementById('view-list').classList.remove('active');
  });
  document.getElementById('view-list').addEventListener('click', () => {
    document.getElementById('products-grid').classList.add('list-view');
    document.getElementById('view-list').classList.add('active');
    document.getElementById('view-grid').classList.remove('active');
  });

  // ===== CART =====
  function refreshCart() {
    const items = Cart.get(slug);
    const count = Cart.count(slug);
    document.getElementById('cart-count').textContent = count;
    const total = Cart.total(slug);
    document.getElementById('cart-total-price').textContent = `₦${total.toLocaleString()}`;

    const cartItemsEl = document.getElementById('cart-items');
    if (!items.length) {
      cartItemsEl.innerHTML = `<div class="cart-empty-msg"><div class="empty-icon">🛒</div><p>Your cart is empty</p></div>`;
      document.getElementById('cart-footer').style.display = 'none';
      return;
    }
    document.getElementById('cart-footer').style.display = 'block';

    cartItemsEl.innerHTML = items.map((item, i) => `
      <div class="cart-item">
        <div class="cart-item-img">
          ${item.image ? `<img src="${item.image}" />` : '🛍️'}
        </div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          ${item.customization ? `<div class="cart-item-custom">Custom: ${Object.entries(item.customization).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(', ')}</div>` : ''}
          <div class="cart-item-price">₦${Number(item.price).toLocaleString()}</div>
          <div class="cart-item-actions">
            <button class="cart-qty-btn" onclick="changeQty(${i}, -1)">−</button>
            <span class="cart-qty-num">${item.qty}</span>
            <button class="cart-qty-btn" onclick="changeQty(${i}, 1)">+</button>
            <button class="cart-remove" onclick="removeItem(${i})">✕ Remove</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.changeQty = (idx, delta) => {
    const items = Cart.get(slug);
    items[idx].qty = Math.max(1, items[idx].qty + delta);
    Cart.set(slug, items);
    refreshCart();
  };

  window.removeItem = (idx) => {
    Cart.remove(slug, idx);
    refreshCart();
  };

  // Cart open/close
  const cartSidebar = document.getElementById('cart-sidebar');
  const cartOverlay = document.getElementById('cart-overlay');

  function openCart() {
    cartSidebar.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    refreshCart();
  }
  function closeCart() {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('cart-toggle').addEventListener('click', openCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);
  document.getElementById('continue-shopping').addEventListener('click', closeCart);

  document.getElementById('checkout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = (typeof BrandURL !== 'undefined') ? BrandURL.checkout(slug) : `checkout.html?slug=${slug}`;
  });

  refreshCart();

  // ===== ERROR =====
  function showError(msg) {
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;text-align:center;padding:2rem;">
        <div>
          <div style="font-size:4rem;margin-bottom:1rem;">🔍</div>
          <h2 style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:300;margin-bottom:0.5rem;">${msg}</h2>
          <p style="color:#6b5a52;margin-bottom:2rem;">The brand you're looking for doesn't exist or has been removed.</p>
          <a href="../index.html" style="background:#5a3c30;color:#fff;padding:0.85rem 2rem;border-radius:100px;text-decoration:none;font-size:0.95rem;">Back to Brandisby</a>
        </div>
      </div>`;
  }
});
