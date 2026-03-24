// product.js
document.addEventListener('DOMContentLoaded', async () => {
  const slug = window.getCurrentBrandSlug ? window.getCurrentBrandSlug() : URLUtils.getParam('slug');
  const productId = URLUtils.getParam('id');
  if (!slug || !productId) { window.location.href = '../index.html'; return; }

  let product = null, selectedFont = 'Classic', uploadedImageUrl = null;

  document.getElementById('back-link').href = (typeof BrandURL!=='undefined') ? BrandURL.store(slug) : `brand.html?slug=${slug}`;
  document.getElementById('checkout-link').href = (typeof BrandURL!=='undefined') ? BrandURL.checkout(slug) : `checkout.html?slug=${slug}`;
  document.getElementById('breadcrumb-brand').href = (typeof BrandURL!=='undefined') ? BrandURL.store(slug) : `brand.html?slug=${slug}`;

  // Load brand
  try {
    const brand = await Brands.getBySlug(slug);
    if (brand) {
      document.getElementById('brand-nav-title').textContent = brand.name || '';
      document.getElementById('breadcrumb-brand').textContent = brand.name || 'Store';
      if (brand.brandColor) document.documentElement.style.setProperty('--brown', brand.brandColor);
    }
  } catch(e) {}

  // Load product
  try {
    product = await Products.getById(slug, productId);
    if (!product) { showError(); return; }
    renderProduct(product);
    document.title = `${product.name} — Brandisby`;
  } catch(e) { showError(); return; }

  function renderProduct(p) {
    document.getElementById('product-title').textContent = p.name || 'Product';
    document.getElementById('product-price').textContent = `₦${Number(p.price||0).toLocaleString()}`;
    document.getElementById('product-desc').textContent = p.description || '';
    document.getElementById('product-category').innerHTML = `<span class="badge badge-brown">${p.category||'General'}</span>`;

    // Stock
    const stockBadge = document.getElementById('stock-badge');
    if (!p.stock || p.stock > 5) { stockBadge.textContent = 'In Stock'; stockBadge.className = 'badge badge-green stock-badge'; }
    else if (p.stock > 0) { stockBadge.textContent = `Only ${p.stock} left`; stockBadge.className = 'badge badge-amber stock-badge'; }
    else { stockBadge.textContent = 'Out of Stock'; stockBadge.className = 'badge badge-red stock-badge'; }

    // Gallery
    const mainEl = document.getElementById('gallery-main');
    const thumbsEl = document.getElementById('gallery-thumbs');
    const images = p.images?.length ? p.images : [];
    if (images.length) {
      document.getElementById('gallery-placeholder').remove();
      mainEl.innerHTML = `<img src="${images[0]}" alt="${p.name}"/>`;
      images.forEach((src, i) => {
        const t = document.createElement('div');
        t.className = `gallery-thumb${i===0?' active':''}`;
        t.innerHTML = `<img src="${src}" alt="view ${i+1}" loading="lazy"/>`;
        t.addEventListener('click', () => {
          mainEl.innerHTML = `<img src="${src}" alt="${p.name}"/>`;
          document.querySelectorAll('.gallery-thumb').forEach(x=>x.classList.remove('active'));
          t.classList.add('active');
        });
        thumbsEl.appendChild(t);
      });
    }

    // Customization
    if (p.allowCustom) {
      document.getElementById('customize-section').classList.remove('hidden');
      if (p.customOptions?.text) document.getElementById('custom-text-field').classList.remove('hidden');
      if (p.customOptions?.font) document.getElementById('custom-font-field').classList.remove('hidden');
      if (p.customOptions?.upload) document.getElementById('custom-upload-field').classList.remove('hidden');
    }
  }

  // Font picker
  document.querySelectorAll('.font-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.font-opt').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      selectedFont = btn.dataset.font;
    });
  });

  // Upload zone
  const uploadZone = document.getElementById('upload-zone');
  const uploadInput = document.getElementById('custom-upload-input');
  const uploadPreview = document.getElementById('upload-preview');

  uploadZone.addEventListener('click', () => uploadInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor='var(--brown)'; });
  uploadZone.addEventListener('dragleave', () => { uploadZone.style.borderColor=''; });
  uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.style.borderColor=''; if(e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]); });
  uploadInput.addEventListener('change', () => { if(uploadInput.files[0]) handleUpload(uploadInput.files[0]); });

  async function handleUpload(file) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('upload-zone-content').style.display = 'none';
      uploadPreview.src = e.target.result;
      uploadPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
    try {
      uploadedImageUrl = await StorageHelper.uploadImage(`custom-uploads/${slug}/${Date.now()}_${file.name}`, file);
    } catch(e) { uploadedImageUrl = null; }
  }

  // Qty
  const qtyInput = document.getElementById('qty-input');
  document.getElementById('qty-minus').addEventListener('click', () => { qtyInput.value = Math.max(1, parseInt(qtyInput.value)-1); });
  document.getElementById('qty-plus').addEventListener('click', () => { qtyInput.value = parseInt(qtyInput.value)+1; });

  // Add to cart
  document.getElementById('add-to-cart').addEventListener('click', () => {
    if (!product) return;
    if (product.stock === 0) { Toast.show('This product is out of stock', 'error'); return; }
    const qty = parseInt(qtyInput.value) || 1;
    const customization = {};
    if (product.customOptions?.text) { const v = document.getElementById('custom-text').value; if(v) customization.text = v; }
    if (product.customOptions?.font) customization.font = selectedFont;
    if (product.customOptions?.upload && uploadedImageUrl) customization.uploadedImage = uploadedImageUrl;

    Cart.add(slug, {
      productId: product.id, name: product.name, price: product.price,
      image: product.images?.[0] || null, qty,
      customization: Object.keys(customization).length ? customization : null
    });
    refreshCart(); openCart();
    Toast.show(`${product.name} added to cart!`, 'success');
  });

  // Cart
  function refreshCart() {
    const items = Cart.get(slug);
    document.getElementById('cart-count').textContent = Cart.count(slug);
    document.getElementById('cart-total').textContent = `₦${Cart.total(slug).toLocaleString()}`;
    const body = document.getElementById('cart-body');
    const footer = document.getElementById('cart-footer');
    if (!items.length) {
      body.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p>Your cart is empty</p></div>`;
      footer.style.display = 'none'; return;
    }
    footer.style.display = 'block';
    body.innerHTML = items.map((item,i) => `
      <div class="cart-item">
        <div class="cart-item-img">${item.image?`<img src="${item.image}"/>`:'🛍️'}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₦${Number(item.price).toLocaleString()} × ${item.qty}</div>
          <button class="cart-item-remove" onclick="cartRemove(${i})">✕ Remove</button>
        </div>
      </div>`).join('');
  }
  window.cartRemove = (i) => { Cart.remove(slug,i); refreshCart(); };

  function openCart() {
    document.getElementById('cart-drawer').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
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

  function showError() {
    document.querySelector('.product-layout').innerHTML = `<div style="text-align:center;padding:6rem 2rem;"><div style="font-size:4rem;margin-bottom:1rem">🔍</div><h2 style="font-family:Cormorant Garamond,serif;font-size:2rem;font-weight:300;">Product not found</h2><a href="brand.html?slug=${slug}" style="color:var(--brown);">← Back to store</a></div>`;
  }
});
