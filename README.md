# BRANDISBY — Setup & Deployment Guide

## 🗂 Project Structure

```
brandisby/
├── index.html                  ← Public homepage
├── css/
│   ├── main.css                ← Global styles & brand palette
│   ├── brand.css               ← Brand storefront styles
│   ├── product.css             ← Product detail page styles
│   ├── checkout.css            ← Checkout page styles
│   ├── auth.css                ← Login / signup styles
│   └── dashboard.css           ← Creator dashboard styles
├── js/
│   ├── firebase-config.js      ← Firebase init + all helper modules
│   ├── home.js                 ← Homepage logic
│   ├── brand.js                ← Brand storefront logic
│   ├── product.js              ← Product detail logic
│   ├── checkout.js             ← Checkout + Paystack logic
│   ├── creator-signup.js       ← Brand creation flow
│   └── dashboard.js            ← Creator dashboard logic
├── pages/
│   ├── brand.html              ← Brand storefront (Step 1–2)
│   ├── product.html            ← Product detail + customization (Step 3)
│   ├── checkout.html           ← Cart + shipping + payment (Step 4–6)
│   ├── order-confirmation.html ← Post-purchase confirmation (Step 6–7)
│   ├── creator-signup.html     ← Brand creator registration
│   ├── login.html              ← Sign in page
│   └── dashboard.html          ← Brand owner dashboard
├── firestore.rules             ← Firestore security rules
├── storage.rules               ← Firebase Storage rules
└── README.md                   ← This file
```

---

## 🚀 Quick Setup

### 1. Firebase Project
Your Firebase config is already embedded. Ensure these services are enabled in the Firebase Console:
- **Authentication** → Email/Password provider enabled
- **Firestore Database** → Create in production mode
- **Storage** → Enable Firebase Storage

### 2. Deploy Security Rules
In Firebase Console:
- **Firestore** → Rules → paste contents of `firestore.rules`
- **Storage** → Rules → paste contents of `storage.rules`

### 3. Paystack Integration
Each brand owner must add their **Paystack Public Key** in their Dashboard → Brand Settings → Payment Settings.

To get a Paystack key:
1. Sign up at https://paystack.com
2. Dashboard → Settings → API Keys & Webhooks
3. Copy your Public Key (`pk_live_...` or `pk_test_...` for testing)

> **Important:** Replace `'pk_test_your_paystack_public_key'` in `js/checkout.js` with your platform-level key or ensure each brand sets their own in settings.

### 4. Firebase Indexes
Add these composite indexes in Firestore Console → Indexes:
- Collection: `brands` | Fields: `active ASC`, `createdAt DESC`
- Collection: `orders` | Fields: `brandSlug ASC`, `createdAt DESC`
- Collection: `orders` | Fields: `customerEmail ASC`, `createdAt DESC`

---

## 🔗 Brand Link System

Brand links follow this pattern:
```
brandisby.com/pages/brand.html?slug=yourbrandname
```

When a creator registers with handle `FleurDeVie`, their store is:
```
brandisby.com/pages/brand.html?slug=fleurdevie
```

To create cleaner URLs (e.g., `brandisby.com/FleurDeVie`), deploy to a server with URL rewriting configured.

---

## 💡 Customer Flow

| Step | Page | Description |
|------|------|-------------|
| 1 | brand.html | Landing on brand storefront |
| 2 | brand.html | Browsing products with search & filters |
| 3 | product.html | Product detail + customization form |
| 4 | product.html | Add to cart → mini cart slides in |
| 5 | checkout.html | Cart review → shipping details |
| 6 | checkout.html | Paystack payment |
| 7 | order-confirmation.html | Confirmation + order tracking |

---

## 🛠 Creator Dashboard Features
- **Overview**: Revenue, orders, product count stats + recent orders
- **Products**: Add/edit/delete products with images, pricing, categories, custom order options
- **Orders**: View all orders, filter by status, update order status
- **Settings**: Brand profile, logo/banner upload, Paystack key management

---

## 🎨 Brand Color System
Colors are stored per-brand and applied dynamically via CSS custom properties:
```js
document.documentElement.style.setProperty('--brand-brown', brand.brandColor);
```

Default brand palette (in main.css):
- `#5a3c30` — Brand Brown (primary)
- `#1b1513` — Brand Dark
- `#ffffff` — White

---

## 📦 Integrations
The platform is designed to connect with:
- **Paystack** — Payment processing (built-in)
- **Printify** — Print-on-demand products
- **Sellfy** — Digital product sales
- **Shopify** / **BigCartel** — Product catalog sync
- **Beacons** — Creator link-in-bio

These integrations can be extended in the dashboard Settings tab.
