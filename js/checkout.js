// checkout.js
document.addEventListener('DOMContentLoaded', async () => {
  const slug = URLUtils.getParam('slug');
  if (!slug) { window.location.href = '../index.html'; return; }

  let brand = null;
  let customerInfo = {};
  let PAYSTACK_PUBLIC_KEY = 'pk_test_your_paystack_public_key'; // Set your actual Paystack key

  document.getElementById('back-to-store').href = `brand.html?slug=${slug}`;

  // Load brand
  try {
    brand = await Brands.getBySlug(slug);
    if (brand) {
      document.getElementById('checkout-brand-name').textContent = brand.name || 'Checkout';
      document.getElementById('summary-brand').textContent = `Sold by ${brand.name} on Brandisby`;
      if (brand.brandColor) document.documentElement.style.setProperty('--brand-brown', brand.brandColor);
      if (brand.paystackKey) PAYSTACK_PUBLIC_KEY = brand.paystackKey;
    }
  } catch(e) {}

  const items = Cart.get(slug);
  const subtotal = Cart.total(slug);

  // Render cart review
  renderCartReview();
  renderOrderSummary();
  updateTotals();

  function renderCartReview() {
    const list = document.getElementById('cart-review-list');
    if (!items.length) {
      list.innerHTML = `<div class="empty-cart-msg"><p>Your cart is empty.</p><a href="brand.html?slug=${slug}" class="btn-primary-lg">Browse Products</a></div>`;
      document.getElementById('to-details-btn').style.display = 'none';
      return;
    }
    list.innerHTML = items.map(item => `
      <div class="cart-review-item">
        <div class="cart-review-img">
          ${item.image ? `<img src="${item.image}" />` : '🛍️'}
        </div>
        <div class="cart-review-details">
          <div class="cart-review-name">${item.name}</div>
          ${item.customization ? `<div class="cart-review-custom">
            ${Object.entries(item.customization).filter(([,v])=>v).map(([k,v])=>`${k}: ${v}`).join(' · ')}
          </div>` : ''}
          <div class="cart-review-qty">Qty: ${item.qty}</div>
        </div>
        <div class="cart-review-price">₦${(item.price * item.qty).toLocaleString()}</div>
      </div>
    `).join('');
  }

  function renderOrderSummary() {
    const list = document.getElementById('order-items-list');
    list.innerHTML = items.map(item => `
      <div class="order-summary-item">
        <div class="order-summary-img">${item.image ? `<img src="${item.image}" />` : '🛍️'}</div>
        <div class="order-summary-name">${item.name} × ${item.qty}</div>
        <div class="order-summary-price">₦${(item.price * item.qty).toLocaleString()}</div>
      </div>
    `).join('');
  }

  function updateTotals() {
    document.getElementById('summary-subtotal').textContent = `₦${subtotal.toLocaleString()}`;
    document.getElementById('summary-total').textContent = `₦${subtotal.toLocaleString()}`;
    document.getElementById('pay-now-text').textContent = `Pay ₦${subtotal.toLocaleString()} Now`;
  }

  // ===== STEP NAVIGATION =====
  function showStep(stepId) {
    document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const stepMap = { 'step-cart': 'cart', 'step-details-form': 'details', 'step-payment-form': 'payment' };
    const stepName = stepMap[stepId];
    document.querySelectorAll('.step').forEach(s => {
      if (s.dataset.step === stepName) s.classList.add('active');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.getElementById('to-details-btn').addEventListener('click', () => showStep('step-details-form'));
  document.getElementById('back-to-cart-btn').addEventListener('click', () => showStep('step-cart'));
  document.getElementById('back-to-details-btn').addEventListener('click', () => showStep('step-details-form'));

  document.getElementById('to-payment-btn').addEventListener('click', () => {
    if (!validateDetails()) return;
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
    document.getElementById('payment-customer-info').innerHTML = `
      <strong>${customerInfo.firstName} ${customerInfo.lastName}</strong><br/>
      ${customerInfo.email} · ${customerInfo.phone}<br/>
      ${customerInfo.address}, ${customerInfo.city}, ${customerInfo.state}, ${customerInfo.country}
    `;
    showStep('step-payment-form');
  });

  function validateDetails() {
    const fields = ['fname','lname','email','phone','address','city','state'];
    let valid = true;
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) { el.classList.add('error'); valid = false; }
      else el.classList.remove('error');
    });
    if (!valid) Toast.show('Please fill in all required fields', 'error');
    return valid;
  }

  // ===== PAYSTACK PAYMENT =====
  document.getElementById('pay-now-btn').addEventListener('click', () => {
    if (!items.length) { Toast.show('Your cart is empty', 'error'); return; }

    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: customerInfo.email,
      amount: subtotal * 100, // kobo
      currency: 'NGN',
      ref: `BRANDISBY-${slug.toUpperCase()}-${Date.now()}`,
      metadata: {
        custom_fields: [
          { display_name: 'Brand', variable_name: 'brand', value: brand?.name || slug },
          { display_name: 'Customer Name', variable_name: 'customer_name', value: `${customerInfo.firstName} ${customerInfo.lastName}` }
        ]
      },
      callback: async (response) => {
        // Payment successful
        await createOrder(response.reference);
      },
      onClose: () => {
        Toast.show('Payment window closed', 'info');
      }
    });
    handler.openIframe();
  });

  async function createOrder(paymentRef) {
    const btn = document.getElementById('pay-now-btn');
    btn.disabled = true;
    btn.textContent = 'Processing…';

    try {
      const orderId = await Orders.create({
        brandSlug: slug,
        brandName: brand?.name || slug,
        items: items,
        customer: customerInfo,
        orderNotes: document.getElementById('order-notes').value.trim(),
        subtotal,
        total: subtotal,
        paymentRef,
        paymentMethod: 'paystack',
        status: 'paid',
        customerEmail: customerInfo.email
      });

      // Clear cart
      Cart.clear(slug);

      // Redirect to confirmation
      const confirmUrl = (typeof BrandURL !== 'undefined')
        ? BrandURL.confirmation(slug, orderId)
        : `order-confirmation.html?orderId=${orderId}&slug=${slug}`;
      window.location.href = confirmUrl;
    } catch(e) {
      Toast.show('Order creation failed. Please contact support.', 'error');
      btn.disabled = false;
      btn.textContent = `Pay ₦${subtotal.toLocaleString()} Now`;
    }
  }
});
