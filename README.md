# BRANDISBY — Setup & Deployment Guide

## ⚠️ Two live sites run from this repository's root

The root of this repo (everything below except `apps/`, `docs/`, `.github/`)
is the **live, deployed code for two real merchant sites** (Sérac and Fleur
de Vie), backed by the Firebase project `brandisby` in Firestore. Do not
modify, move, or delete anything under `index.html`, `pages/`, `css/`, `js/`,
`api/`, the root `package.json`, or `vercel.json` as part of the V1 rebuild
below — see `docs/roadmap.md` ("Standing constraint") and
`docs/decisions/001-single-app-before-packages.md` for why.

## 🚀 V1 rebuild: `apps/web`

The next-generation Brandisby platform (Next.js/TypeScript/Tailwind/Prisma/
PostgreSQL, per `docs/architecture-audit.md` and `docs/roadmap.md`) is being
built from scratch under `apps/web`, entirely separate from the legacy site
below — its own `package.json`, its own database, its own provider
credentials. It does not touch Firestore or the `brandisby` Firebase project
at all.

```bash
cd apps/web
npm install
cp .env.example .env   # fill in DATABASE_URL — a local/throwaway Postgres for now
npm run db:migrate:deploy
npm run dev             # http://localhost:3000
npm run typecheck
npm run lint
npm run test
npm run build
```

**Next step (blocking M0.3):** a real Neon Postgres project needs to be
provisioned at https://neon.tech and its connection string set as
`DATABASE_URL` (in `.env` locally, and in Vercel's project env vars once
`apps/web` is deployed) — nobody has done this yet, so right now the app only
runs against a local or CI throwaway database. Do not point `DATABASE_URL` at
the existing Firebase project under any circumstances.

See `docs/architecture-audit.md` for the audit of the legacy site below and
`docs/roadmap.md` for the milestone-by-milestone rebuild plan.

---

## 🗂 Legacy site — Project Structure

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
