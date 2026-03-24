// =====================================================
// subdomain-router.js — Brandisby Subdomain Engine
// Pattern:  goodies.brandisby.com
// Hosting:  Vercel (wildcard subdomain) + GitHub source
// Dev:      localhost fallback via ?slug=goodies
// =====================================================

(function () {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  // Reserved subdomains that are NOT brand stores
  const RESERVED = ['www', 'app', 'dashboard', 'api', 'admin', 'mail', 'help'];

  // Is this brandisby.com or a subdomain of it?
  const isOnBrandisby =
    (parts[parts.length - 2] === 'brandisby' && parts[parts.length - 1] === 'com');

  // Is it specifically a BRAND subdomain? e.g. goodies.brandisby.com
  const isSubdomain =
    isOnBrandisby &&
    parts.length >= 3 &&
    !RESERVED.includes(parts[0]);

  // Active brand slug — from subdomain OR ?slug= param (dev fallback)
  const slugFromSubdomain = isSubdomain ? parts[0].toLowerCase() : null;
  const slugFromParam = params.get('slug');
  const activeBrandSlug = slugFromSubdomain || slugFromParam || null;

  // Expose slug globally for all JS files to use
  window.getCurrentBrandSlug = function () {
    return activeBrandSlug;
  };

  // Auto-route when on a brand subdomain
  if (isSubdomain) {
    const slug = slugFromSubdomain;
    const currentSlugInParam = params.get('slug');

    // Already hydrated correctly — do nothing
    if (currentSlugInParam === slug) return;

    // goodies.brandisby.com/ → brand storefront
    if (path === '/' || path === '' || path === '/index.html') {
      window.location.replace('/pages/brand.html?slug=' + slug);
      return;
    }

    if (path.includes('product.html') && !currentSlugInParam) {
      const id = params.get('id') || '';
      window.location.replace('/pages/product.html?slug=' + slug + (id ? '&id=' + id : ''));
      return;
    }

    if (path.includes('checkout.html') && !currentSlugInParam) {
      window.location.replace('/pages/checkout.html?slug=' + slug);
      return;
    }

    if (path.includes('order-confirmation.html') && !currentSlugInParam) {
      const orderId = params.get('orderId') || '';
      window.location.replace('/pages/order-confirmation.html?slug=' + slug + (orderId ? '&orderId=' + orderId : ''));
      return;
    }
  }

  // BrandURL — generates the correct link for each environment
  //
  // Vercel production (brandisby.com):
  //   BrandURL.store('goodies')       → https://goodies.brandisby.com
  //   BrandURL.product('goodies', id) → https://goodies.brandisby.com/pages/product.html?id=xxx
  //   BrandURL.checkout('goodies')    → https://goodies.brandisby.com/pages/checkout.html
  //
  // Localhost / dev:
  //   BrandURL.store('goodies')       → /pages/brand.html?slug=goodies
  //   BrandURL.product('goodies', id) → /pages/product.html?slug=goodies&id=xxx
  //   BrandURL.checkout('goodies')    → /pages/checkout.html?slug=goodies

  window.BrandURL = {

    store(slug) {
      if (isOnBrandisby) return 'https://' + slug + '.brandisby.com';
      return '/pages/brand.html?slug=' + slug;
    },

    product(slug, productId) {
      if (isOnBrandisby) return 'https://' + slug + '.brandisby.com/pages/product.html?id=' + productId;
      return '/pages/product.html?slug=' + slug + '&id=' + productId;
    },

    checkout(slug) {
      if (isOnBrandisby) return 'https://' + slug + '.brandisby.com/pages/checkout.html';
      return '/pages/checkout.html?slug=' + slug;
    },

    confirmation(slug, orderId) {
      if (isOnBrandisby) return 'https://' + slug + '.brandisby.com/pages/order-confirmation.html?orderId=' + orderId;
      return '/pages/order-confirmation.html?slug=' + slug + '&orderId=' + orderId;
    },

    // For displaying the brand link in the UI — always subdomain style
    display(slug) {
      return slug + '.brandisby.com';
    }

  };

})();
