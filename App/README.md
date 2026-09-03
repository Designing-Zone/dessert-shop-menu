# 🍔 Burger House — Restaurant Ordering App

A lightweight, mobile-first ordering app for a burger restaurant: a customer app
(browse menu → cart → order → track status) and a separate admin dashboard
(orders, products, categories, customers, stats), backed by a real database.

Built for **speed and simplicity**: no heavy UI frameworks, no ORM, no CSS
framework — just Express, the Node.js built-in SQLite database, and a small
React SPA (~67 KB gzipped total).

---

## Quick start

```bash
npm install
npm start          # builds the frontend, then serves app + API on one port
```

Open **http://localhost:3001**

| Mode           | Command        | URL                        |
| -------------- | -------------- | -------------------------- |
| Production     | `npm start`    | http://localhost:3001      |
| Development    | `npm run dev`  | app http://localhost:5173 (API proxied automatically) |

### Demo accounts

| Role     | Email               | Password      |
| -------- | ------------------- | ------------- |
| Admin    | `admin@burger.app`  | `admin123`    |
| Customer | `customer@demo.app` | `customer123` |

- Customer app: `http://localhost:3001/`
- Admin dashboard: `http://localhost:3001/admin` (customers cannot access it)

> Change the admin password from **Admin → Settings** on first real use.
> The database is created and seeded automatically on first run at `data/burger.db`.
> Delete the `data/` folder to reset to a fresh seeded state.

---

## Features

### Customer app (`/`)

- Register / login (email + password)
- Home with hero, categories, hot deals and popular picks
- Menu with category filter chips, product cards (image, name, category, price)
- Sold-out products are shown grayed out and cannot be ordered
- Product bottom-sheet: description, quantity stepper, add to cart
- Cart: quantity +/-, remove items, kitchen note, live totals (persisted in localStorage)
- Checkout requires login; orders are priced **server-side**
- My orders with live status updates (auto-refresh) and a status timeline:
  `pending → preparing → ready → delivered` (or `cancelled`)
- Account page: profile, change password, logout

### Admin dashboard (`/admin`)

- **Dashboard** — today's orders, pending, completed, today's sales, product & customer counts, latest orders
- **Orders** — filter by status, view details (customer info, items, note), one-tap status changes
- **Products** — search + category filter, availability switch (instantly reflected in the customer menu), add/edit/delete
- **Product form** — image upload (auto-resized to ≤900px JPEG in the browser before upload), price, description, category, availability
- **Categories** — add / rename / delete (protected while products are inside)
- **Customers** — contact info, order count, total spent, last order
- **Settings** — restaurant name/phone/address (shown in the customer app), admin password change

### Security

- Passwords hashed with bcrypt, sessions via signed JWTs (30 days)
- Role-based access: every `/api/admin/*` route requires the admin role (verified: customers get 403)
- Customers can only read their own orders; order totals/prices are computed on the server
- Product images are validated (image MIME only, size limit) and stored locally

---

## Project structure

```
├── server/                 # Express + node:sqlite backend (no native deps)
│   ├── index.js            # app entry: API + /uploads + built SPA
│   ├── db.js               # schema, seed data (admin, 7 categories, 15 products)
│   ├── auth.js             # JWT sign/verify, authRequired, adminRequired
│   ├── secret.js           # JWT secret (env JWT_SECRET or auto-generated file)
│   ├── upload.js           # multer image uploads
│   ├── routes/             # auth, catalog, orders, admin routes
│   └── uploads/            # product images (seed SVGs + uploaded photos)
├── src/                    # React SPA (Vite)
│   ├── store.jsx           # auth / catalog / cart contexts
│   ├── api.js              # fetch wrapper + formatters
│   ├── styles.css          # design system (dark + flame orange, hand-written CSS)
│   ├── customer/           # home, menu, cart, orders, account, login, register
│   └── admin/              # dashboard, orders, products, categories, customers, settings
├── scripts/seed-images.mjs# regenerates the SVG seed images
└── data/                   # SQLite database (gitignored, auto-created)
```

## API overview

| Method | Route                        | Access    |
| ------ | ---------------------------- | --------- |
| POST   | `/api/auth/register`         | public    |
| POST   | `/api/auth/login`            | public    |
| GET    | `/api/auth/me`               | auth      |
| POST   | `/api/auth/password`         | auth      |
| GET    | `/api/catalog`               | public    |
| GET    | `/api/info`                  | public    |
| GET    | `/api/orders`                | auth      |
| POST   | `/api/orders`                | auth      |
| GET    | `/api/orders/:id`            | auth (own)|
| GET    | `/api/admin/stats`           | admin     |
| GET    | `/api/admin/orders`          | admin     |
| PATCH  | `/api/admin/orders/:id/status` | admin   |
| GET/POST | `/api/admin/products`      | admin     |
| PATCH/DELETE | `/api/admin/products/:id` | admin  |
| GET/POST | `/api/admin/categories`    | admin     |
| PATCH/DELETE | `/api/admin/categories/:id` | admin |
| GET    | `/api/admin/customers`       | admin     |
| GET/PUT | `/api/admin/settings`       | admin     |
| POST   | `/api/admin/upload`          | admin     |

## Performance notes

- Single bundled SPA: **~68 KB gzipped JS + 5.5 KB CSS**, zero web fonts, zero icon libraries (inline SVG)
- Menu fetched once and cached (stale-while-revalidate); cart lives in localStorage
- Product images are lazy-loaded; uploads are client-side resized before sending
- SQLite in WAL mode; requests are synchronous and fast — no connection pool overhead
- Only purposeful micro-animations (sheet slide-up, toasts); respects `prefers-reduced-motion`

## Configuration

- `PORT` — server port (default 3001)
- `JWT_SECRET` — token signing secret (otherwise auto-generated once and stored in `data/.jwt_secret`)
