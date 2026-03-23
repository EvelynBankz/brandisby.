// subdomain-router.js
// Place this script in ALL pages (index.html, brand.html, product.html, etc.)
// It detects subdomains like fleurdevie.brandisby.com and routes correctly.

(function () {
  const hostname = window.location.hostname; // e.g. fleurdevie.brandisby.com
  const parts = hostname.split('.');

  // Detect if we're on a brand subdomain
  // Matches: fleurdevie.brandisby.com  (parts = ['fleurdevie', 'brandisby', 'com'])
  // Does NOT match: brandisby.com or www.brandisby.com
  const isSubdomain =
    parts.length >= 3 &&
    parts[parts.length - 2] === 'brandisby' &&
    parts[0] !== 'www' &&
    parts[0] !== 'app' &&
    parts[0] !== 'dashboard';

  if (isSubdomain) {
    const brandSlug = parts[0].toLowerCase();
    const path = window.location.pathname; // e.g. /  or /product?id=xxx

    // Already on the brand page with the correct slug — do nothing
    const currentSlug = new URLSearchParams(window.location.search).get('slug');
    if (currentSlug === brandSlug) return;

    // Determine which page we're on and inject slug if missing
    if (path === '/' || path === '/index.html' || path === '') {
      // Root of subdomain → go to brand storefront
      window.location.replace(`/pages/brand.html?slug=${brandSlug}`);
      return;
    }

    if (path.includes('product.html')) {
      const productId = new URLSearchParams(window.location.search).get('id');
      if (!currentSlug && productId) {
        window.location.replace(`/pages/product.html?slug=${brandSlug}&id=${productId}`);
      }
      return;
    }

    if (path.includes('checkout.html')) {
      if (!currentSlug) {
        window.location.replace(`/pages/checkout.html?slug=${brandSlug}`);
      }
      return;
    }

    if (path.includes('order-confirmation.html')) {
      const orderId = new URLSearchParams(window.location.search).get('orderId');
      if (!currentSlug && orderId) {
        window.location.replace(`/pages/order-confirmation.html?slug=${brandSlug}&orderId=${orderId}`);
      }
      return;
    }
  }

  // Helper: generate a brand URL respecting subdomain or slug style
  // Usage: BrandURL.store('fleurdevie') → https://fleurdevie.brandisby.com  OR  /pages/brand.html?slug=fleurdevie
  window.BrandURL = {
    store(slug) {
      if (hostname.includes('brandisby.com')) {
        return `https://${slug}.brandisby.com`;
      }
      return `/pages/brand.html?slug=${slug}`;
    },
    product(slug, productId) {
      if (hostname.includes('brandisby.com')) {
        return `https://${slug}.brandisby.com/pages/product.html?id=${productId}`;
      }
      return `/pages/product.html?slug=${slug}&id=${productId}`;
    },
    checkout(slug) {
      if (hostname.includes('brandisby.com')) {
        return `https://${slug}.brandisby.com/pages/checkout.html`;
      }
      return `/pages/checkout.html?slug=${slug}`;
    },
    confirmation(slug, orderId) {
      if (hostname.includes('brandisby.com')) {
        return `https://${slug}.brandisby.com/pages/order-confirmation.html?orderId=${orderId}`;
      }
      return `/pages/order-confirmation.html?slug=${slug}&orderId=${orderId}`;
    }
  };

  // Also expose current brand slug globally (works for both subdomain and ?slug= param)
  window.getCurrentBrandSlug = function () {
    if (isSubdomain) return parts[0].toLowerCase();
    return new URLSearchParams(window.location.search).get('slug');
  };

})();
