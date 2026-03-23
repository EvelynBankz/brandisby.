// product.js
document.addEventListener('DOMContentLoaded', async () => {
  const slug = URLUtils.getParam('slug');
  const productId = URLUtils.getParam('id');
  if (!slug || !productId) { window.location.href = '../index.html'; return; }

  let product = null;
  let selectedFont = 'Classic';
  let uploadedImageUrl = null;

  // Breadcrumb + back link
  document.getElementById('back-to-store').href = `brand.html?slug=${slug}`;
  document.getElementById('checkout-btn').href = (typeof BrandURL !== 'undefined') ? BrandURL.checkout(slug) : `checkout.html?slug=${slug}`;

  // Load brand name
  try {
    const brand = await Brands.getBySlug(slug);
    if (brand) {
      document.getElementById('brand-nav-logo').textContent = brand.name || '';
      if (brand.brandColor) document.documentElement.style.setProperty('--brand-brown', brand.brandColor);
      document.getElementById('product-breadcrumb').innerHTML = `<a href="brand.html?slug=${slug}">${brand.name}</a> / Product`;
    }
  } catch(e) {}

  // Load product
  try {
    product = await Products.getById(slug, productId);
    if (!product) { showError(); return; }
    renderProduct(product);
    document.title = `${product.name} — Brandisby`;
  } catch(e) {
    showError(); return;
  }

  function renderProduct(p) {
    document.getElementById('product-title').textContent = p.name || 'Untitled Product';
    document.getElementById('product-price').textContent = `₦${Number(p.price||0).toLocaleString()}`;
    document.getElementById('product-category').textContent = p.category || 'General';
    document.getElementById('product-description').textContent = p.description || '';

    // Stock
    const stockEl = document.getElementById('product-stock');
    if (p.stock === undefined || p.stock === null || p.stock > 5) {
      stockEl.textContent = 'In Stock'; stockEl.className = 'product-stock';
    } else if (p.stock > 0) {
      stockEl.textContent = `Only ${p.stock} left`; stockEl.className = 'product-stock low';
    } else {
      stockEl.textContent = 'Out of Stock'; stockEl.className = 'product-stock out';
    }

    // Gallery
    const mainGallery = document.getElementById('gallery-main');
    const thumbsEl = document.getElementById('gallery-thumbs');
    const images = p.images && p.images.length ? p.images : [];

    if (images.length) {
      mainGallery.innerHTML = `<img src="${images[0]}" alt="${p.name}" />`;
      images.forEach((img, i) => {
        const thumb = document.createElement('div');
        thumb.className = `gallery-thumb${i===0?' active':''}`;
        thumb.innerHTML = `<img src="${img}" alt="img ${i+1}" />`;
        thumb.addEventListener('click', () => {
          mainGallery.innerHTML = `<img src="${img}" alt="${p.name}" />`;
          document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
        });
        thumbsEl.appendChild(thumb);
      });
    }

    // Customization
    if (p.allowCustom) {
      document.getElementById('custom-section').style.display = 'block';
      if (p.customOptions?.text) document.getElementById('custom-text-wrap').style.display = 'block';
      if (p.customOptions?.font) document.getElementById('custom-font-wrap').style.display = 'block';
      if (p.customOptions?.upload) document.getElementById('custom-upload-wrap').style.display = 'block';
    }
  }

  // Font selection
  document.querySelectorAll('.font-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.font-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedFont = btn.dataset.font;
    });
  });

  // Image upload
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('custom-image-upload');
  const preview = document.getElementById('upload-preview');

  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.style.borderColor = 'var(--brand-brown)'; });
  uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = ''; });
  uploadArea.addEventListener('drop', e => {
    e.preventDefault(); uploadArea.style.borderColor = '';
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

  async function handleFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('upload-placeholder').style.display = 'none';
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
    // Upload to Firebase Storage
    try {
      const path = `custom-uploads/${slug}/${Date.now()}_${file.name}`;
      uploadedImageUrl = await StorageHelper.uploadImage(path, file);
    } catch(e) {
      uploadedImageUrl = null;
    }
  }

  // Qty
  const qtyInput = document.getElementById('qty-input');
  document.getElementById('qty-minus').addEventListener('click', () => {
    qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    qtyInput.value = parseInt(qtyInput.value) + 1;
  });

  // Add to Cart
  document.getElementById('add-to-cart').addEventListener('click', () => {
    if (!product) return;
    const qty = parseInt(qtyInput.value) || 1;
    const customization = {};
    if (product.customOptions?.text) customization.text = document.getElementById('custom-text').value;
    if (product.customOptions?.font) customization.font = selectedFont;
    if (product.customOptions?.upload && uploadedImageUrl) customization.uploadedImage = uploadedImageUrl;

    Cart.add(slug, {
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || null,
      qty,
      customization: Object.keys(customization).length ? customization : null
    });

    refreshCart();
    openCart();
    Toast.show(`${product.name} added to cart!`, 'success');
  });

  // Cart
  function refreshCart() {
    const items = Cart.get(slug);
    document.getElementById('cart-count').textContent = Cart.count(slug);
    document.getElementById('cart-total-price').textContent = `₦${Cart.total(slug).toLocaleString()}`;

    const cartItemsEl = document.getElementById('cart-items');
    if (!items.length) {
      cartItemsEl.innerHTML = `<div class="cart-empty-msg"><div class="empty-icon">🛒</div><p>Your cart is empty</p></div>`;
      document.getElementById('cart-footer').style.display = 'none';
      return;
    }
    document.getElementById('cart-footer').style.display = 'block';
    cartItemsEl.innerHTML = items.map((item, i) => `
      <div class="cart-item">
        <div class="cart-item-img">${item.image ? `<img src="${item.image}" />` : '🛍️'}</div>
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₦${Number(item.price).toLocaleString()} × ${item.qty}</div>
          <button class="cart-remove" onclick="removeItem(${i})">✕ Remove</button>
        </div>
      </div>`).join('');
  }

  window.removeItem = (idx) => { Cart.remove(slug, idx); refreshCart(); };

  function openCart() {
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
    refreshCart();
  }
  function closeCart() {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-overlay').classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('cart-badge').addEventListener('click', openCart);
  document.getElementById('cart-close').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', closeCart);
  document.getElementById('continue-shopping').addEventListener('click', closeCart);

  refreshCart();

  function showError() {
    document.querySelector('.product-detail').innerHTML = `
      <div style="text-align:center;padding:6rem 2rem;">
        <div style="font-size:4rem;margin-bottom:1rem;">🔍</div>
        <h2 style="font-family:var(--font-display);font-size:2rem;font-weight:300;">Product not found</h2>
        <a href="brand.html?slug=${slug}" style="color:var(--brand-brown);">← Back to store</a>
      </div>`;
  }
});
