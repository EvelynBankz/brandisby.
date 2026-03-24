// creator-signup.js
document.addEventListener('DOMContentLoaded', () => {
  let createdUserUid = null;
  let logoFile = null;
  let handleTimeout = null;

  function showStep(n) {
    document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step-${n}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── STEP 1: Create Account ──────────────────────────────────
  document.getElementById('step1-btn').addEventListener('click', async () => {
    const name  = document.getElementById('s-name').value.trim();
    const email = document.getElementById('s-email').value.trim();
    const pass  = document.getElementById('s-password').value;

    if (!name || !email || !pass) { Toast.show('Please fill in all fields', 'error'); return; }
    if (pass.length < 8) { Toast.show('Password must be at least 8 characters', 'error'); return; }

    const btn = document.getElementById('step1-btn');
    btn.disabled = true; btn.textContent = 'Creating account…';

    try {
      const user = await Auth.signUp(email, pass, name);
      createdUserUid = user.uid;
      await db.collection('users').doc(user.uid).set({
        displayName: name, email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showStep(2);
    } catch(e) {
      Toast.show(e.message || 'Signup failed. Try again.', 'error');
    }
    btn.disabled = false; btn.textContent = 'Continue →';
  });

  // ── Handle availability check ───────────────────────────────
  document.getElementById('b-handle').addEventListener('input', () => {
    clearTimeout(handleTimeout);
    let val = document.getElementById('b-handle').value
      .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    document.getElementById('b-handle').value = val;
    const statusEl = document.getElementById('handle-status');
    if (!val) { statusEl.textContent = ''; return; }
    statusEl.textContent = 'Checking availability…';
    statusEl.className = 'handle-status checking';
    handleTimeout = setTimeout(async () => {
      try {
        const doc = await db.collection('brands').doc(val).get();
        if (doc.exists) {
          statusEl.textContent = '✕ Handle already taken';
          statusEl.className = 'handle-status taken';
        } else {
          statusEl.textContent = '✓ Available!';
          statusEl.className = 'handle-status ok';
        }
      } catch(e) { statusEl.textContent = ''; }
    }, 600);
  });

  // ── Color picker ────────────────────────────────────────────
  document.getElementById('b-color').addEventListener('input', e => {
    document.getElementById('b-color-label').textContent = e.target.value;
  });
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      document.getElementById('b-color').value = sw.dataset.color;
      document.getElementById('b-color-label').textContent = sw.dataset.color;
    });
  });

  // ── Logo upload ─────────────────────────────────────────────
  const logoArea = document.getElementById('logo-upload-area');
  const logoInput = document.getElementById('logo-file');
  logoArea.addEventListener('click', () => logoInput.click());
  logoInput.addEventListener('change', () => {
    const file = logoInput.files[0];
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

  document.getElementById('step2-back-btn').addEventListener('click', () => showStep(1));

  // ── STEP 2: Create Brand ────────────────────────────────────
  document.getElementById('step2-btn').addEventListener('click', async () => {
    const brandName   = document.getElementById('b-name').value.trim();
    const handle      = document.getElementById('b-handle').value.trim();
    const tagline     = document.getElementById('b-tagline').value.trim();
    const description = document.getElementById('b-desc').value.trim();
    const brandColor  = document.getElementById('b-color').value;
    const paystackKey = document.getElementById('b-paystack').value.trim();

    if (!brandName) { Toast.show('Brand name is required', 'error'); return; }
    if (!handle)    { Toast.show('Brand handle is required', 'error'); return; }

    const statusEl = document.getElementById('handle-status');
    if (statusEl.classList.contains('taken')) {
      Toast.show('Please choose a different handle', 'error'); return;
    }

    const btn = document.getElementById('step2-btn');
    btn.disabled = true; btn.textContent = 'Launching brand…';

    try {
      // Upload logo if selected
      let logoUrl = null;
      if (logoFile) {
        logoUrl = await StorageHelper.uploadImage(
          `brand-logos/${handle}/${Date.now()}_${logoFile.name}`, logoFile
        );
      }

      const uid = createdUserUid || Auth.currentUser()?.uid;
      if (!uid) { Toast.show('Not authenticated. Please go back.', 'error'); return; }

      const slug = await Brands.create(uid, {
        name: brandName, handle, tagline, description,
        brandColor, logoUrl, paystackKey
      });

      // Show success
      const displayLink = (typeof BrandURL !== 'undefined')
        ? BrandURL.display(slug) : `${slug}.brandisby.com`;
      document.getElementById('brand-link-box').textContent = displayLink;
      document.getElementById('success-msg').textContent = `${brandName} is now live on Brandisby!`;
      document.getElementById('visit-store-btn').href = (typeof BrandURL !== 'undefined')
        ? BrandURL.store(slug) : `brand.html?slug=${slug}`;
      showStep(3);

    } catch(e) {
      Toast.show(e.message || 'Brand creation failed. Try again.', 'error');
    }
    btn.disabled = false; btn.textContent = 'Launch My Brand 🚀';
  });
});
