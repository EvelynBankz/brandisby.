// checkout.js
document.addEventListener('DOMContentLoaded', async () => {
  const slug = window.getCurrentBrandSlug ? window.getCurrentBrandSlug() : URLUtils.getParam('slug');
  if (!slug) { window.location.href = '../index.html'; return; }

  let brand = null, customerInfo = {}, PAYSTACK_KEY = 'pk_test_your_key_here';
  const items = Cart.get(slug);
  const subtotal = Cart.total(slug);

  document.getElementById('back-to-store').href = (typeof BrandURL!=='undefined') ? BrandURL.store(slug) : `brand.html?slug=${slug}`;
  document.getElementById('empty-back-link').href = (typeof BrandURL!=='undefined') ? BrandURL.store(slug) : `brand.html?slug=${slug}`;

  // Load brand
  try {
    brand = await Brands.getBySlug(slug);
    if (brand) {
      document.getElementById('checkout-brand-name').textContent = brand.name || 'Checkout';
      document.getElementById('summary-brand-note').textContent = `Sold by ${brand.name} via Brandisby`;
      if (brand.brandColor) document.documentElement.style.setProperty('--brown', brand.brandColor);
      if (brand.paystackKey) PAYSTACK_KEY = brand.paystackKey;
    }
  } catch(e) {}

  renderCartReview();
  renderSummary();
  updateTotals();

  function renderCartReview() {
    const list = document.getElementById('cart-review-list');
    const step1Actions = document.getElementById('step1-actions');
    if (!items.length) {
      list.innerHTML = '';
      document.getElementById('cart-empty-msg').classList.remove('hidden');
      step1Actions.style.display = 'none'; return;
    }
    list.innerHTML = items.map(item => `
      <div class="review-item">
        <div class="review-item-img">${item.image?`<img src="${item.image}"/>`:'🛍️'}</div>
        <div class="review-item-info">
          <div class="review-item-name">${item.name}</div>
          ${item.customization?`<div class="review-item-custom">${Object.entries(item.customization).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(' · ')}</div>`:''}
          <div class="review-item-qty">Qty: ${item.qty}</div>
        </div>
        <div class="review-item-price">₦${(item.price*item.qty).toLocaleString()}</div>
      </div>`).join('');
  }

  function renderSummary() {
    document.getElementById('summary-items').innerHTML = items.map(item => `
      <div class="summary-item">
        <div class="summary-item-img">${item.image?`<img src="${item.image}"/>`:'🛍️'}</div>
        <div class="summary-item-name">${item.name} × ${item.qty}</div>
        <div class="summary-item-price">₦${(item.price*item.qty).toLocaleString()}</div>
      </div>`).join('');
  }

  function updateTotals() {
    const fmt = `₦${subtotal.toLocaleString()}`;
    document.getElementById('s-subtotal').textContent = fmt;
    document.getElementById('s-total').textContent = fmt;
    document.getElementById('pay-amount').textContent = fmt;
  }

  // Step navigation
  function goToStep(step) {
    ['cart','details','payment'].forEach(s => {
      document.getElementById(`panel-${s}`).classList.toggle('active', s===step);
      const lbl = document.getElementById(`step-lbl-${s}`);
      if (lbl) lbl.classList.toggle('active', s===step);
    });
    window.scrollTo({top:0,behavior:'smooth'});
  }

  document.getElementById('to-details-btn').addEventListener('click', () => goToStep('details'));
  document.getElementById('back-to-cart-btn').addEventListener('click', () => goToStep('cart'));
  document.getElementById('back-to-details-btn').addEventListener('click', () => goToStep('details'));

  document.getElementById('to-payment-btn').addEventListener('click', () => {
    const required = ['fname','lname','email','phone','address','city','state'];
    let valid = true;
    required.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) { el.classList.add('error'); valid = false; }
      else el.classList.remove('error');
    });
    if (!valid) { Toast.show('Please fill in all required fields', 'error'); return; }

    customerInfo = {
      firstName: document.getElementById('fname').value.trim(),
      lastName: document.getElementById('lname').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      address: document.getElementById('address').value.trim(),
      city: document.getElementById('city').value.trim(),
      state: document.getElementById('state').value.trim(),
      country: document.getElementById('country').value
    };
    document.getElementById('payment-customer-summary').innerHTML = `
      <strong>${customerInfo.firstName} ${customerInfo.lastName}</strong><br/>
      📧 ${customerInfo.email} &nbsp; 📱 ${customerInfo.phone}<br/>
      📍 ${customerInfo.address}, ${customerInfo.city}, ${customerInfo.state}, ${customerInfo.country}
    `;
    goToStep('payment');
  });

  // Paystack
  document.getElementById('pay-now-btn').addEventListener('click', () => {
    if (!items.length) { Toast.show('Your cart is empty', 'error'); return; }
    const handler = PaystackPop.setup({
      key: PAYSTACK_KEY,
      email: customerInfo.email,
      amount: subtotal * 100,
      currency: 'NGN',
      ref: `BRANDISBY-${slug.toUpperCase()}-${Date.now()}`,
      metadata: { custom_fields: [
        { display_name: 'Brand', variable_name: 'brand', value: brand?.name || slug },
        { display_name: 'Customer', variable_name: 'customer', value: `${customerInfo.firstName} ${customerInfo.lastName}` }
      ]},
      callback: async (res) => { await createOrder(res.reference); },
      onClose: () => Toast.show('Payment window closed', 'info')
    });
    handler.openIframe();
  });

  async function createOrder(payRef) {
    const btn = document.getElementById('pay-now-btn');
    btn.disabled = true; btn.textContent = 'Processing…';
    try {
      const orderId = await Orders.create({
        brandSlug: slug, brandName: brand?.name || slug,
        items, customer: customerInfo,
        orderNotes: document.getElementById('order-notes').value.trim(),
        subtotal, total: subtotal,
        paymentRef: payRef, paymentMethod: 'paystack',
        status: 'paid', customerEmail: customerInfo.email
      });
      Cart.clear(slug);
      const confirmUrl = (typeof BrandURL!=='undefined')
        ? BrandURL.confirmation(slug, orderId)
        : `order-confirmation.html?slug=${slug}&orderId=${orderId}`;
      window.location.href = confirmUrl;
    } catch(e) {
      Toast.show('Order creation failed. Please contact support.', 'error');
      btn.disabled = false;
      btn.innerHTML = `Pay <span id="pay-amount">₦${subtotal.toLocaleString()}</span> Now`;
    }
  }
});
