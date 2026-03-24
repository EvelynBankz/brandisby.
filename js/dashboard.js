// dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  let currentUser = null, brandSlug = null, brandData = null;
  let allOrders = [], allProducts = [];

  // ── Auth guard ──────────────────────────────────────────────
  Auth.onAuthChange(async (user) => {
    if (!user) { window.location.href = 'login.html'; return; }
    currentUser = user;

    const initials = (user.displayName || user.email)
      .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('dash-avatar').textContent = initials;
    document.getElementById('dash-user-name').textContent = user.displayName || 'Creator';
    document.getElementById('dash-user-email').textContent = user.email;
    document.getElementById('welcome-name').textContent =
      (user.displayName || 'Creator').split(' ')[0];

    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists && userDoc.data().brandSlug) {
        brandSlug = userDoc.data().brandSlug;
        await Promise.all([loadBrand(), loadOrders(), loadProducts()]);
      } else {
        window.location.href = 'creator-signup.html';
      }
    } catch(e) { console.error('Dashboard load error', e); }
  });

  // ── Load brand ──────────────────────────────────────────────
  async function loadBrand() {
    brandData = await Brands.getBySlug(brandSlug);
    if (!brandData) return;

    const storeUrl = (typeof BrandURL !== 'undefined')
      ? BrandURL.store(brandSlug) : `brand.html?slug=${brandSlug}`;
    const displayLink = (typeof BrandURL !== 'undefined')
      ? BrandURL.display(brandSlug) : `${brandSlug}.brandisby.com`;

    document.getElementById('dash-view-store').href = storeUrl;
    document.getElementById('dash-store-link').textContent = displayLink;
    document.getElementById('stat-link').textContent = displayLink;
    document.title = `${brandData.name} — Dashboard`;

    // Pre-fill settings
    document.getElementById('set-name').value    = brandData.name        || '';
    document.getElementById('set-tagline').value = brandData.tagline     || '';
    document.getElementById('set-desc').value    = brandData.description || '';
    document.getElementById('set-color').value   = brandData.brandColor  || '#5a3c30';
    document.getElementById('set-color-label').textContent = brandData.brandColor || '#5a3c30';
    document.getElementById('set-paystack').value = brandData.paystackKey || '';

    if (brandData.logoUrl) {
      document.getElementById('set-logo-placeholder').style.display = 'none';
      const lp = document.getElementById('set-logo-preview');
      lp.src = brandData.logoUrl; lp.style.display = 'block';
    }
    if (brandData.bannerUrl) {
      document.getElementById('set-banner-placeholder').style.display = 'none';
      const bp = document.getElementById('set-banner-preview');
      bp.src = brandData.bannerUrl; bp.style.display = 'block';
    }
  }

  // ── Load orders ─────────────────────────────────────────────
  async function loadOrders() {
    try { allOrders = await Orders.getByBrand(brandSlug); }
    catch(e) { allOrders = []; }

    const revenue = allOrders
      .filter(o => o.status === 'paid' || o.status === 'delivered')
      .reduce((s, o) => s + (o.total || 0), 0);

    document.getElementById('stat-revenue').textContent = `₦${revenue.toLocaleString()}`;
    document.getElementById('stat-orders').textContent = allOrders.length;

    renderOrdersTable('recent-orders-body', allOrders.slice(0, 6), false);
    renderOrdersTable('all-orders-body', allOrders, true);
  }

  function renderOrdersTable(tbodyId, orders, withActions) {
    const tbody = document.getElementById(tbodyId);
    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="${withActions?7:6}" class="table-empty">No orders yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = orders.map(o => {
      const date = o.createdAt?.toDate
        ? o.createdAt.toDate().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
        : '—';
      const actionsCell = withActions ? `
        <td>
          <select class="input" style="font-size:0.75rem;padding:0.3rem 0.6rem;width:auto;"
            onchange="updateOrderStatus('${o.id}',this.value)">
            ${['pending','paid','processing','shipped','delivered','cancelled']
              .map(s=>`<option value="${s}"${o.status===s?' selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`).join('')}
          </select>
        </td>` : '';
      return `
        <tr>
          <td><code style="font-size:0.72rem;color:var(--brown);">${o.id.slice(0,10).toUpperCase()}</code></td>
          <td>
            <div style="font-weight:500;">${o.customer?.firstName||''} ${o.customer?.lastName||''}</div>
            <div style="font-size:0.72rem;color:var(--muted);">${o.customer?.email||''}</div>
          </td>
          <td>${o.items?.length||0} item(s)</td>
          <td style="font-weight:600;">₦${Number(o.total||0).toLocaleString()}</td>
          <td><span class="badge badge-${statusColor(o.status)}">${o.status||'pending'}</span></td>
          <td style="font-size:0.82rem;color:var(--muted);">${date}</td>
          ${actionsCell}
        </tr>`;
    }).join('');
  }

  function statusColor(s) {
    return { paid:'green', delivered:'green', pending:'amber', processing:'blue', shipped:'blue', cancelled:'red' }[s] || 'brown';
  }

  window.updateOrderStatus = async (orderId, status) => {
    try {
      await Orders.updateStatus(orderId, status);
      Toast.show('Order status updated', 'success');
      await loadOrders();
    } catch(e) { Toast.show('Failed to update status', 'error'); }
  };

  // ── Load products ────────────────────────────────────────────
  async function loadProducts() {
    try { allProducts = await Products.getByBrand(brandSlug); }
    catch(e) { allProducts = []; }

    document.getElementById('stat-products').textContent = allProducts.length;
    renderProductsTable(allProducts);
  }

  function renderProductsTable(products) {
    const tbody = document.getElementById('products-body');
    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No products yet. Add your first one!</td></tr>`;
      return;
    }
    tbody.innerHTML = products.map(p => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div style="width:40px;height:40px;border-radius:8px;overflow:hidden;background:linear-gradient(135deg,rgba(90,60,48,0.15),rgba(90,60,48,0.3));flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.1rem;">
              ${p.images?.[0] ? `<img src="${p.images[0]}" style="width:100%;height:100%;object-fit:cover;"/>` : '🛍️'}
            </div>
            <span style="font-weight:500;">${p.name}</span>
          </div>
        </td>
        <td><span class="badge badge-brown">${p.category||'General'}</span></td>
        <td style="font-weight:600;color:var(--brown);">₦${Number(p.price||0).toLocaleString()}</td>
        <td>${p.stock !== null && p.stock !== undefined ? p.stock : '∞'}</td>
        <td>${p.allowCustom ? '<span class="badge badge-green">Yes</span>' : '<span style="color:var(--muted)">—</span>'}</td>
        <td>
          <button class="table-action" onclick="editProduct('${p.id}')">Edit</button>
          <button class="table-action danger" onclick="deleteProduct('${p.id}')">Delete</button>
        </td>
      </tr>`).join('');
  }

  // ── Product Modal ────────────────────────────────────────────
  let pendingImages = [];

  function openModal() {
    document.getElementById('product-modal-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    document.getElementById('product-modal-backdrop').classList.remove('open');
    document.body.style.overflow = '';
    resetModal();
  }
  function resetModal() {
    document.getElementById('edit-product-id').value = '';
    document.getElementById('modal-title').textContent = 'Add Product';
    ['p-name','p-price','p-desc','p-stock'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    document.getElementById('p-category').value = 'clothing';
    document.getElementById('p-allow-custom').checked = false;
    document.getElementById('p-custom-text').checked = false;
    document.getElementById('p-custom-font').checked = false;
    document.getElementById('p-custom-upload').checked = false;
    document.getElementById('custom-opts-panel').classList.add('hidden');
    document.getElementById('p-images-preview').innerHTML = '';
    document.getElementById('p-images-placeholder').style.display = 'block';
    pendingImages = [];
  }

  document.getElementById('add-product-btn').addEventListener('click', () => { resetModal(); openModal(); });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('product-modal-backdrop').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('p-allow-custom').addEventListener('change', function() {
    document.getElementById('custom-opts-panel').classList.toggle('hidden', !this.checked);
  });

  // Image upload
  const imagesArea = document.getElementById('p-images-area');
  const imagesFile = document.getElementById('p-images-file');
  imagesArea.addEventListener('click', () => imagesFile.click());
  imagesFile.addEventListener('change', () => {
    pendingImages = Array.from(imagesFile.files);
    const preview = document.getElementById('p-images-preview');
    document.getElementById('p-images-placeholder').style.display = 'none';
    preview.innerHTML = '';
    pendingImages.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = document.createElement('img');
        img.src = e.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });

  window.editProduct = (productId) => {
    const p = allProducts.find(p => p.id === productId);
    if (!p) return;
    document.getElementById('modal-title').textContent = 'Edit Product';
    document.getElementById('edit-product-id').value = productId;
    document.getElementById('p-name').value     = p.name        || '';
    document.getElementById('p-price').value    = p.price       || '';
    document.getElementById('p-desc').value     = p.description || '';
    document.getElementById('p-stock').value    = p.stock != null ? p.stock : '';
    document.getElementById('p-category').value = p.category    || 'other';
    document.getElementById('p-allow-custom').checked = !!p.allowCustom;
    if (p.allowCustom) {
      document.getElementById('custom-opts-panel').classList.remove('hidden');
      document.getElementById('p-custom-text').checked   = !!p.customOptions?.text;
      document.getElementById('p-custom-font').checked   = !!p.customOptions?.font;
      document.getElementById('p-custom-upload').checked = !!p.customOptions?.upload;
    }
    if (p.images?.length) {
      document.getElementById('p-images-placeholder').style.display = 'none';
      document.getElementById('p-images-preview').innerHTML =
        p.images.map(url => `<img src="${url}" />`).join('');
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

  document.getElementById('modal-save').addEventListener('click', async () => {
    const name  = document.getElementById('p-name').value.trim();
    const price = parseFloat(document.getElementById('p-price').value);
    if (!name || isNaN(price)) { Toast.show('Product name and price are required', 'error'); return; }

    const btn = document.getElementById('modal-save');
    btn.disabled = true; btn.textContent = 'Saving…';

    try {
      let imageUrls = [];
      if (pendingImages.length) {
        for (const file of pendingImages) {
          const url = await StorageHelper.uploadImage(
            `products/${brandSlug}/${Date.now()}_${file.name}`, file
          );
          imageUrls.push(url);
        }
      } else {
        const editId = document.getElementById('edit-product-id').value;
        if (editId) imageUrls = allProducts.find(p=>p.id===editId)?.images || [];
      }

      const productData = {
        name, price,
        description: document.getElementById('p-desc').value.trim(),
        category:    document.getElementById('p-category').value,
        stock: document.getElementById('p-stock').value !== ''
          ? parseInt(document.getElementById('p-stock').value) : null,
        allowCustom: document.getElementById('p-allow-custom').checked,
        customOptions: {
          text:   document.getElementById('p-custom-text').checked,
          font:   document.getElementById('p-custom-font').checked,
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

  // ── Settings ─────────────────────────────────────────────────
  document.getElementById('set-color').addEventListener('input', e => {
    document.getElementById('set-color-label').textContent = e.target.value;
  });

  document.getElementById('save-profile-btn').addEventListener('click', async () => {
    try {
      await Brands.update(brandSlug, {
        name:        document.getElementById('set-name').value.trim(),
        tagline:     document.getElementById('set-tagline').value.trim(),
        description: document.getElementById('set-desc').value.trim(),
        brandColor:  document.getElementById('set-color').value,
      });
      Toast.show('Profile saved!', 'success');
    } catch(e) { Toast.show('Failed to save', 'error'); }
  });

  document.getElementById('save-payment-btn').addEventListener('click', async () => {
    try {
      await Brands.update(brandSlug, { paystackKey: document.getElementById('set-paystack').value.trim() });
      Toast.show('Payment settings saved!', 'success');
    } catch(e) { Toast.show('Failed to save', 'error'); }
  });

  // Media uploads
  ['logo','banner'].forEach(type => {
    const area  = document.getElementById(`set-${type}-area`);
    const input = document.getElementById(`set-${type}-file`);
    area.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const file = input.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById(`set-${type}-placeholder`).style.display = 'none';
        const preview = document.getElementById(`set-${type}-preview`);
        preview.src = e.target.result; preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  });

  document.getElementById('save-media-btn').addEventListener('click', async () => {
    const logoFile   = document.getElementById('set-logo-file').files[0];
    const bannerFile = document.getElementById('set-banner-file').files[0];
    const updates = {};
    const btn = document.getElementById('save-media-btn');
    btn.disabled = true; btn.textContent = 'Uploading…';
    try {
      if (logoFile)   updates.logoUrl   = await StorageHelper.uploadImage(`brand-logos/${brandSlug}/${Date.now()}_${logoFile.name}`, logoFile);
      if (bannerFile) updates.bannerUrl = await StorageHelper.uploadImage(`brand-banners/${brandSlug}/${Date.now()}_${bannerFile.name}`, bannerFile);
      if (Object.keys(updates).length) {
        await Brands.update(brandSlug, updates);
        Toast.show('Media uploaded!', 'success');
      } else {
        Toast.show('No new files selected', 'info');
      }
    } catch(e) { Toast.show('Upload failed', 'error'); }
    btn.disabled = false; btn.textContent = 'Upload Media';
  });

  // ── Orders filter ────────────────────────────────────────────
  document.getElementById('order-status-filter').addEventListener('change', function() {
    const filtered = this.value ? allOrders.filter(o => o.status === this.value) : allOrders;
    renderOrdersTable('all-orders-body', filtered, true);
  });

  // ── Tab navigation ───────────────────────────────────────────
  const TAB_TITLES = { overview:'Overview', products:'Products', orders:'Orders', settings:'Brand Settings' };

  document.querySelectorAll('.dash-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      document.querySelectorAll('.dash-nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
      item.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
      document.getElementById('dash-topbar-title').textContent = TAB_TITLES[tab] || tab;
      closeSidebar();
    });
  });

  // ── Mobile sidebar ───────────────────────────────────────────
  const sidebar  = document.getElementById('dash-sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('dash-hamburger');

  function openSidebar()  { sidebar.classList.add('open'); overlay.style.display='block'; document.body.style.overflow='hidden'; }
  function closeSidebar() { sidebar.classList.remove('open'); overlay.style.display='none'; document.body.style.overflow=''; }

  hamburger.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
  overlay.addEventListener('click', closeSidebar);

  // ── Sign out ──────────────────────────────────────────────────
  document.getElementById('dash-signout').addEventListener('click', () => Auth.signOut());
});
