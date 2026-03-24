// creator-signup.js
document.addEventListener('DOMContentLoaded', () => {
  let createdUserUid = null;
  let logoFile = null;
  let handleTimeout = null;

  // Also reuse checkout.css form-group styles
  function showStep(n) {
    document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`auth-step-${n}`).classList.add('active');
  }

  // STEP 1: Create Account
  document.getElementById('create-account-btn').addEventListener('click', async () => {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass = document.getElementById('signup-password').value;

    if (!name || !email || !pass) { Toast.show('Please fill in all fields', 'error'); return; }
    if (pass.length < 8) { Toast.show('Password must be at least 8 characters', 'error'); return; }

    const btn = document.getElementById('create-account-btn');
    btn.disabled = true; btn.textContent = 'Creating account…';

    try {
      const user = await Auth.signUp(email, pass, name);
      createdUserUid = user.uid;
      // Create user doc
      await db.collection('users').doc(user.uid).set({
        displayName: name, email, createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showStep(2);
    } catch(e) {
      Toast.show(e.message || 'Signup failed', 'error');
    }
    btn.disabled = false; btn.textContent = 'Continue →';
  });

  // Handle availability check
  document.getElementById('brand-handle').addEventListener('input', () => {
    clearTimeout(handleTimeout);
    const val = document.getElementById('brand-handle').value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    document.getElementById('brand-handle').value = val;
    const statusEl = document.getElementById('handle-status');
    if (!val) { statusEl.textContent = ''; return; }
    statusEl.textContent = 'Checking availability…'; statusEl.className = 'handle-status checking';
    handleTimeout = setTimeout(async () => {
      try {
        const doc = await db.collection('brands').doc(val).get();
        if (doc.exists) {
          statusEl.textContent = '✕ Handle taken'; statusEl.className = 'handle-status taken';
        } else {
          statusEl.textContent = '✓ Available!'; statusEl.className = 'handle-status available';
        }
      } catch(e) { statusEl.textContent = ''; }
    }, 600);
  });

  // Color picker
  document.getElementById('brand-color').addEventListener('input', (e) => {
    document.getElementById('color-label').textContent = e.target.value;
  });
  document.querySelectorAll('.swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      document.getElementById('brand-color').value = sw.dataset.color;
      document.getElementById('color-label').textContent = sw.dataset.color;
    });
  });

  // Logo upload
  const logoArea = document.getElementById('logo-upload-area');
  const logoFile_input = document.getElementById('logo-file');
  logoArea.addEventListener('click', () => logoFile_input.click());
  logoFile_input.addEventListener('change', () => {
    const file = logoFile_input.files[0];
    if (!file) return;
    logoFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('logo-placeholder').style.display = 'none';
      const preview = document.getElementById('logo-preview');
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('back-to-account-btn').addEventListener('click', () => showStep(1));

  // STEP 2: Create Brand
  document.getElementById('create-brand-btn').addEventListener('click', async () => {
    const brandName = document.getElementById('brand-name-input').value.trim();
    const handle = document.getElementById('brand-handle').value.trim();
    const description = document.getElementById('brand-desc').value.trim();
    const tagline = document.getElementById('brand-tagline').value.trim();
    const brandColor = document.getElementById('brand-color').value;
    const paystackKey = document.getElementById('paystack-key').value.trim();

    if (!brandName || !handle) { Toast.show('Brand name and handle are required', 'error'); return; }

    const handleStatus = document.getElementById('handle-status');
    if (handleStatus.classList.contains('taken')) { Toast.show('Please choose a different handle', 'error'); return; }

    const btn = document.getElementById('create-brand-btn');
    btn.disabled = true; btn.textContent = 'Creating brand…';

    try {
      let logoUrl = null;
      if (logoFile) {
        logoUrl = await StorageHelper.uploadImage(`brand-logos/${handle}/${Date.now()}_${logoFile.name}`, logoFile);
      }

      const uid = createdUserUid || Auth.currentUser()?.uid;
      if (!uid) { Toast.show('Not authenticated. Please go back.', 'error'); return; }

      const slug = await Brands.create(uid, {
        name: brandName,
        handle,
        description,
        tagline,
        brandColor,
        logoUrl,
        paystackKey
      });

      document.getElementById('brand-link-reveal').textContent = (typeof BrandURL !== 'undefined') ? BrandURL.display(slug) : `${slug}.brandisby.com`;
      document.getElementById('visit-store-btn').href = (typeof BrandURL !== 'undefined') ? BrandURL.store(slug) : `brand.html?slug=${slug}`;
      document.getElementById('success-msg').textContent = `${brandName} is live on Brandisby!`;
      showStep(3);
    } catch(e) {
      Toast.show(e.message || 'Brand creation failed', 'error');
    }
    btn.disabled = false; btn.textContent = 'Launch My Brand 🚀';
  });
});
