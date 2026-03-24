// dashboard.js
document.addEventListener('DOMContentLoaded', () => {

  let currentUser = null;
  let brandSlug = null;
  let brandData = null;
  let allOrders = [];
  let allProducts = [];

  // ===== AUTH GUARD =====
  Auth.onAuthChange(async (user) => {
    if (!user) { window.location.href = 'login.html'; return; }
    currentUser = user;

    // Update user display
    const initials = user.displayName ? user.displayName.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : user.email[0].toUpperCase();
    document.getElementById('dash-avatar').textContent = initials;
    document.getElementById('dash-user-name').textContent = user.displayName || 'Creator';
    document.getElementById('dash-user-email').textContent = user.email;
    document.getElementById('welcome-name').textContent = (user.displayName || 'Creator').split(' ')[0];

    // Load user's brand
    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists && userDoc.data().brandSlug) {
        brandSlug = userDoc.data().brandSlug;
        await loadBrand();
        await loadOrders();
        await loadProducts();
      } else {
        // No brand yet — redirect to create
        window.location.href = 'creator-signup.html';
      }
    } catch(e) {
      console.error('Failed to load brand', e);
    }
  });

  // ===== LOAD BRAND =====
  async function loadBrand() {
    brandData = await Brands.getBySlug(brandSlug);
    if (!brandData) return;

    const storeUrl = (typeof BrandURL !== 'undefined') ? BrandURL.store(brandSlug) : `brand.html?slug=${brandSlug}`;
    const displayLink = (typeof BrandURL !== 'undefined') ? BrandURL.display(brandSlug) : `${brandSlug}.brandisby.com`;
    document.getElementById('dash-view-store-btn').href = storeUrl;
    document.getElementById('dash-store-link').textContent = displayLink;
    document.getElementById('stat-link').textContent = displayLink;

    // Settings tab
    document.getElementById('set-brand-name').value = brandData.name || '';
    document.getElementById('set-tagline').value = brandData.tagline || '';
    document.getElementById('set-desc').value = brandData.description || '';
    document.getElementById('set-color').value = brandData.brandColor || '#5a3c30';
    document.getElementById('set-color-label').textContent = brandData.brandColor || '#5a3c30';
    document.getElementById('set-paystack-key').value = brandData.paystackKey || '';

    if (brandData.logoUrl) {
      document.getElementById('settings-logo-placeholder').style.display = 'none';
      document.getElementById('settings-logo-preview').src = brandData.logoUrl;
      document.getElementById('settings-logo-preview').style.display = 'block';
    }
    if (brandData.bannerUrl) {
      document.getElementById('settings-banner-placeholder').style.display = 'none';
      document.getElementById('settings-banner-preview').src = brandData.bannerUrl;
      document.getElementById('settings-banner-preview').style.display = 'block';
    }

    document.title = `${brandData.name} — Dashboard`;
  }

  // ===== LOAD ORDERS =====
  async function loadOrders() {
    try {
      allOrders = await Orders.getByBrand(brandSlug);
    } catch(e) { allOrders = []; }

    const revenue = allOrders.filter(o => o.status === 'paid' || o.status === 'delivered').reduce((s, o) => s + (o.total || 0), 0);
    document.getElementById('stat-revenue').textContent = `₦${revenue.toLocaleString()}`;
    document.getElementById('stat-orders').textContent = allOrders.length;

    renderOrdersTable('overview-orders-body', allOrders.slice(0, 6), false);
    renderOrdersTable('all-orders-body', allOrders, true);
  }

  function renderOrdersTable(tbodyId, orders, showActions) {
    const tbody = document.getElementById(tbodyId);
    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="${showActions?7:6}" class="table-loading">No orders yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = orders.map(order => {
      const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : '—';
      const statusClass = order.status || 'pending';
      const actionsHtml = showActions ? `
        <td>
          <select class="filter-select" style="font-size:0.75rem;padding:0.3rem 0.5rem;border-radius:6px;" onchange="updateOrderStatus('${order.id}', this.value)">
            <option value="pending" ${order.status==='pending'?'selected':''}>Pending</option>
            <option value="paid" ${order.status==='paid'?'selected':''}>Paid</option>
            <option value="processing" ${order.status==='processing'?'selected':''}>Processing</option>
            <option value="shipped" ${order.status==='shipped'?'selected':''}>Shipped</option>
            <option value="delivered" ${order.status==='delivered'?'selected':''}>Delivered</option>
            <option value="cancelled" ${order.status==='cancelled'?'selected':''}>Cancelled</option>
          </select>
        </td>` : '';
      return `
        <tr>
          <td><code style="font-size:0.72rem">${order.id.slice(0,10).toUpperCase()}</code></td>
          <td>${order.customer?.firstName || ''} ${order.customer?.lastName || ''}<br/><span style="font-size:0.72rem;color:var(--brand-muted)">${order.customer?.email || ''}</span></td>
          <td>${order.items?.length || 0} item(s)</td>
          <td style="font-weight:500;">₦${Number(order.total || 0).toLocaleString()}</td>
          <td><span class="status-pill ${statusClass}">${statusClass}</span></td>
          <td style="color:var(--brand-muted);font-size:0.82rem;">${date}</td>
          ${actionsHtml}
        </tr>`;
    }).join('');
  }

  window.updateOrderStatus = async (orderId, status) => {
    try {
      await Orders.updateStatus(orderId, status);
      Toast.show('Order status updated', 'success');
    } catch(e) {
      Toast.show('Failed to update status', 'error');
    }
  };

  // ===== LOAD PRODUCTS =====
  async function loadProducts() {
    try {
      allProducts = await Products.getByBrand(brandSlug);
    } catch(e) { allProducts = []; }

    document.getElementById('stat-products').textContent = allProducts.length;
    renderProductsTable(allProducts);
  }

  function renderProductsTable(products) {
    const tbody = document.getElementById('products-table-body');
    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-loading">No products yet. Add your first product!</td></tr>`;
      return;
    }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div style="width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,var(--brand-light-brown),var(--brand-brown));overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1rem;">
              ${p.images?.[0] ? `<img src="${p.images[0]}" style="width:100%;height:100%;object-fit:cover;" />` : '🛍️'}
            </div>
            <span style="font-weight:500;">${p.name}</span>
          </div>
        </td>
        <td><span style="text-transform:capitalize;">${p.category || 'General'}</span></td>
        <td style="font-weight:500;color:var(--brand-brown);">₦${Number(p.price||0).toLocaleString()}</td>
        <td>${p.stock !== undefined && p.stock !== null ? p.stock : '∞'}</td>
        <td>${p.allowCustom ? '<span class="status-pill paid">Yes</span>' : '—'}</td>
        <td>
          <button class="table-action-btn" onclick="openEditProduct('${p.id}')">Edit</button>
          <button class="table-action-btn danger" onclick="deleteProduct('${p.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  // ===== PRODUCT MODAL =====
  function openModal() {
    document.getElementById('product-modal-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    document.getElementById('product-modal-overlay').classList.remove('open');
    document.body.style.overflow = '';
    resetModal();
  }

  function resetModal() {
    document.getElementById('edit-product-id').value = '';
    document.getElementById('modal-title').textContent = 'Add Product';
    ['p-name','p-price','p-desc','p-stock'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
    document.getElementById('p-category').value = 'clothing';
    document.getElementById('p-allow-custom').checked = false;
    document.getElementById('p-custom-text').checked = false;
    document.getElementById('p-custom-font').checked = false;
    document.getElementById('p-custom-upload').checked = false;
    document.getElementById('custom-options-panel').style.display = 'none';
    document.getElementById('p-images-preview').innerHTML = '';
    document.getElementById('p-images-placeholder').style.display = 'flex';
    window._pendingImages = [];
  }

  window._pendingImages = [];

  document.getElementById('add-product-btn').addEventListener('click', () => { resetModal(); openModal(); });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('product-modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Allow custom toggle
  document.getElementById('p-allow-custom').addEventListener('change', function() {
    document.getElementById('custom-options-panel').style.display = this.checked ? 'block' : 'none';
  });

  // Image upload in modal
  const pImagesArea = document.getElementById('product-images-area');
  const pImagesFile = document.getElementById('p-images-file');
  pImagesArea.addEventListener('click', () => pImagesFile.click());
  pImagesFile.addEventListener('change', () => {
    const files = Array.from(pImagesFile.files);
    window._pendingImages = files;
    const preview = document.getElementById('p-images-preview');
    document.getElementById('p-images-placeholder').style.display = 'none';
    preview.innerHTML = '';
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = document.createElement('img');
        img.src = e.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });

  window.openEditProduct = (productId) => {
    const p = allProducts.find(p => p.id === productId);
    if (!p) return;
    document.getElementById('modal-title').textContent = 'Edit Product';
    document.getElementById('edit-product-id').value = productId;
    document.getElementById('p-name').value = p.name || '';
    document.getElementById('p-price').value = p.price || '';
    document.getElementById('p-desc').value = p.description || '';
    document.getElementById('p-stock').value = p.stock !== undefined ? p.stock : '';
    document.getElementById('p-category').value = p.category || 'other';
    document.getElementById('p-allow-custom').checked = !!p.allowCustom;
    if (p.allowCustom) {
      document.getElementById('custom-options-panel').style.display = 'block';
      document.getElementById('p-custom-text').checked = !!p.customOptions?.text;
      document.getElementById('p-custom-font').checked = !!p.customOptions?.font;
      document.getElementById('p-custom-upload').checked = !!p.customOptions?.upload;
    }
    if (p.images?.length) {
      const preview = document.getElementById('p-images-preview');
      document.getElementById('p-images-placeholder').style.display = 'none';
      preview.innerHTML = p.images.map(url => `<img src="${url}" />`).join('');
    }
    openModal();
  };

  window.deleteProduct = async (productId) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await Products.delete(brandSlug, productId);
      Toast.show('Product deleted', 'success');
      await loadProducts();
    } catch(e) { Toast.show('Failed to delete product', 'error'); }
  };

  // Save product
  document.getElementById('modal-save').addEventListener('click', async () => {
    const name = document.getElementById('p-name').value.trim();
    const price = parseFloat(document.getElementById('p-price').value);
    if (!name || !price) { Toast.show('Name and price are required', 'error'); return; }

    const btn = document.getElementById('modal-save');
    btn.disabled = true; btn.textContent = 'Saving…';

    try {
      // Upload images
      let imageUrls = [];
      if (window._pendingImages && window._pendingImages.length) {
        for (const file of window._pendingImages) {
          const url = await StorageHelper.uploadImage(`products/${brandSlug}/${Date.now()}_${file.name}`, file);
          imageUrls.push(url);
        }
      } else {
        // Keep existing images on edit
        const editId = document.getElementById('edit-product-id').value;
        if (editId) {
          const existing = allProducts.find(p => p.id === editId);
          imageUrls = existing?.images || [];
        }
      }

      const productData = {
        name,
        price,
        description: document.getElementById('p-desc').value.trim(),
        category: document.getElementById('p-category').value,
        stock: document.getElementById('p-stock').value ? parseInt(document.getElementById('p-stock').value) : null,
        allowCustom: document.getElementById('p-allow-custom').checked,
        customOptions: {
          text: document.getElementById('p-custom-text').checked,
          font: document.getElementById('p-custom-font').checked,
          upload: document.getElementById('p-custom-upload').checked,
        },
        images: imageUrls
      };

      const editId = document.getElementById('edit-product-id').value;
      if (editId) {
        await Products.update(brandSlug, editId, productData);
        Toast.show('Product updated!', 'success');
      } else {
        await Products.create(brandSlug, productData);
        Toast.show('Product added!', 'success');
      }

      closeModal();
      await loadProducts();
    } catch(e) {
      Toast.show(e.message || 'Failed to save product', 'error');
    }
    btn.disabled = false; btn.textContent = 'Save Product';
  });

  // ===== SETTINGS =====
  document.getElementById('set-color').addEventListener('input', (e) => {
    document.getElementById('set-color-label').textContent = e.target.value;
  });

  document.getElementById('save-brand-btn').addEventListener('click', async () => {
    try {
      await Brands.update(brandSlug, {
        name: document.getElementById('set-brand-name').value.trim(),
        tagline: document.getElementById('set-tagline').value.trim(),
        description: document.getElementById('set-desc').value.trim(),
        brandColor: document.getElementById('set-color').value,
      });
      Toast.show('Brand profile saved!', 'success');
    } catch(e) { Toast.show('Failed to save', 'error'); }
  });

  document.getElementById('save-payment-btn').addEventListener('click', async () => {
    try {
      await Brands.update(brandSlug, { paystackKey: document.getElementById('set-paystack-key').value.trim() });
      Toast.show('Payment settings saved!', 'success');
    } catch(e) { Toast.show('Failed to save', 'error'); }
  });

  // Media uploads
  ['logo', 'banner'].forEach(type => {
    const area = document.getElementById(`settings-${type}-area`);
    const fileInput = document.getElementById(`settings-${type}-file`);
    area.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById(`settings-${type}-placeholder`).style.display = 'none';
        const preview = document.getElementById(`settings-${type}-preview`);
        preview.src = e.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  });

  document.getElementById('save-media-btn').addEventListener('click', async () => {
    const logoFile = document.getElementById('settings-logo-file').files[0];
    const bannerFile = document.getElementById('settings-banner-file').files[0];
    const updates = {};
    const btn = document.getElementById('save-media-btn');
    btn.disabled = true; btn.textContent = 'Uploading…';
    try {
      if (logoFile) {
        updates.logoUrl = await StorageHelper.uploadImage(`brand-logos/${brandSlug}/${Date.now()}_${logoFile.name}`, logoFile);
      }
      if (bannerFile) {
        updates.bannerUrl = await StorageHelper.uploadImage(`brand-banners/${brandSlug}/${Date.now()}_${bannerFile.name}`, bannerFile);
      }
      if (Object.keys(updates).length) {
        await Brands.update(brandSlug, updates);
        Toast.show('Media uploaded!', 'success');
      } else {
        Toast.show('No new files selected', 'info');
      }
    } catch(e) { Toast.show('Upload failed', 'error'); }
    btn.disabled = false; btn.textContent = 'Upload Media';
  });

  // ===== ORDER FILTER =====
  document.getElementById('order-status-filter').addEventListener('change', function() {
    const filtered = this.value ? allOrders.filter(o => o.status === this.value) : allOrders;
    renderOrdersTable('all-orders-body', filtered, true);
  });

  // ===== TAB NAVIGATION =====
  document.querySelectorAll('.dash-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.dataset.tab;
      document.querySelectorAll('.dash-nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
      item.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
      document.getElementById('dash-topbar-title').textContent = item.textContent.trim();
      // Close sidebar on mobile
      if (window.innerWidth <= 900) document.getElementById('dash-sidebar').classList.remove('open');
    });
  });

  // Mobile menu
  document.getElementById('dash-menu-btn').addEventListener('click', () => {
    document.getElementById('dash-sidebar').classList.toggle('open');
  });

  // Sign out
  document.getElementById('dash-signout').addEventListener('click', () => Auth.signOut());
});
