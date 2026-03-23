// ===== BRANDISBY FIREBASE CONFIG =====
const firebaseConfig = {
  apiKey: "AIzaSyCuiZXHFYl1fVKnGwojavRvbekSBpkipJg",
  authDomain: "brandisby.firebaseapp.com",
  projectId: "brandisby",
  storageBucket: "brandisby.firebasestorage.app",
  messagingSenderId: "87213267039",
  appId: "1:87213267039:web:339e9fd49e3ad31f7423ea"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ===== AUTH HELPERS =====
const Auth = {
  async signUp(email, password, displayName) {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName });
    return cred.user;
  },

  async signIn(email, password) {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  },

  async signOut() {
    await auth.signOut();
    window.location.href = '/brandisby/index.html';
  },

  onAuthChange(callback) {
    return auth.onAuthStateChanged(callback);
  },

  currentUser() {
    return auth.currentUser;
  }
};

// ===== BRAND HELPERS =====
const Brands = {
  async create(uid, brandData) {
    const slug = brandData.handle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const brandRef = db.collection('brands').doc(slug);
    const exists = await brandRef.get();
    if (exists.exists) throw new Error('Brand handle already taken');
    await brandRef.set({
      ...brandData,
      slug,
      ownerId: uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      productCount: 0,
      active: true
    });
    // Also store brand ref on user doc
    await db.collection('users').doc(uid).set({ brandSlug: slug }, { merge: true });
    return slug;
  },

  async getBySlug(slug) {
    const doc = await db.collection('brands').doc(slug).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async getAll(limitN = 12) {
    const snap = await db.collection('brands')
      .where('active', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(limitN)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async update(slug, data) {
    await db.collection('brands').doc(slug).update(data);
  }
};

// ===== PRODUCT HELPERS =====
const Products = {
  async create(brandSlug, productData) {
    const ref = await db.collection('brands').doc(brandSlug)
      .collection('products').add({
        ...productData,
        brandSlug,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        active: true
      });
    await db.collection('brands').doc(brandSlug).update({
      productCount: firebase.firestore.FieldValue.increment(1)
    });
    return ref.id;
  },

  async getByBrand(brandSlug) {
    const snap = await db.collection('brands').doc(brandSlug)
      .collection('products')
      .where('active', '==', true)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getById(brandSlug, productId) {
    const doc = await db.collection('brands').doc(brandSlug)
      .collection('products').doc(productId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async update(brandSlug, productId, data) {
    await db.collection('brands').doc(brandSlug)
      .collection('products').doc(productId).update(data);
  },

  async delete(brandSlug, productId) {
    await db.collection('brands').doc(brandSlug)
      .collection('products').doc(productId).update({ active: false });
    await db.collection('brands').doc(brandSlug).update({
      productCount: firebase.firestore.FieldValue.increment(-1)
    });
  }
};

// ===== ORDER HELPERS =====
const Orders = {
  async create(orderData) {
    const ref = await db.collection('orders').add({
      ...orderData,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return ref.id;
  },

  async getByBrand(brandSlug) {
    const snap = await db.collection('orders')
      .where('brandSlug', '==', brandSlug)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getByUser(email) {
    const snap = await db.collection('orders')
      .where('customerEmail', '==', email)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getById(orderId) {
    const doc = await db.collection('orders').doc(orderId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  async updateStatus(orderId, status) {
    await db.collection('orders').doc(orderId).update({ status, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  }
};

// ===== STORAGE HELPERS =====
const StorageHelper = {
  async uploadImage(path, file) {
    const ref = storage.ref(path);
    await ref.put(file);
    return await ref.getDownloadURL();
  }
};

// ===== CART (localStorage) =====
const Cart = {
  key: 'brandisby_cart',

  get(brandSlug) {
    const all = JSON.parse(localStorage.getItem(this.key) || '{}');
    return all[brandSlug] || [];
  },

  set(brandSlug, items) {
    const all = JSON.parse(localStorage.getItem(this.key) || '{}');
    all[brandSlug] = items;
    localStorage.setItem(this.key, JSON.stringify(all));
  },

  add(brandSlug, item) {
    const items = this.get(brandSlug);
    const idx = items.findIndex(i => i.productId === item.productId && JSON.stringify(i.customization) === JSON.stringify(item.customization));
    if (idx > -1) {
      items[idx].qty += item.qty || 1;
    } else {
      items.push({ ...item, qty: item.qty || 1 });
    }
    this.set(brandSlug, items);
    return items;
  },

  remove(brandSlug, index) {
    const items = this.get(brandSlug);
    items.splice(index, 1);
    this.set(brandSlug, items);
    return items;
  },

  clear(brandSlug) {
    this.set(brandSlug, []);
  },

  total(brandSlug) {
    return this.get(brandSlug).reduce((sum, i) => sum + (i.price * i.qty), 0);
  },

  count(brandSlug) {
    return this.get(brandSlug).reduce((sum, i) => sum + i.qty, 0);
  }
};

// ===== URL UTILS =====
const URLUtils = {
  getBrandSlug() {
    // 1. Subdomain-based: fleurdevie.brandisby.com
    if (typeof window.getCurrentBrandSlug === 'function') {
      const fromSubdomain = window.getCurrentBrandSlug();
      if (fromSubdomain) return fromSubdomain;
    }
    // 2. Query param fallback: ?slug=fleurdevie
    return new URLSearchParams(window.location.search).get('slug');
  },

  getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
};

// ===== TOAST NOTIFICATIONS =====
const Toast = {
  show(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `position:fixed;bottom:2rem;right:2rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;`;
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = `
      padding:0.85rem 1.5rem;
      background:${type === 'error' ? '#c0392b' : type === 'success' ? '#27ae60' : '#1b1513'};
      color:#fff;border-radius:8px;font-size:0.875rem;
      font-family:'DM Sans',sans-serif;
      animation:slideInRight 0.3s ease;
      box-shadow:0 4px 20px rgba(0,0,0,0.2);
    `;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
  }
};

// Inject toast animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
`;
document.head.appendChild(style);
