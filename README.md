# Levush — Faith, Worn.

Premium scripture streetwear storefront. **Levush** (Hebrew לְבוּשׁ, "garment") is a
faith-based clothing brand. This repo is the full website: a React storefront and an
Express + Firebase backend.

![palette](https://img.shields.io/badge/theme-deep%20blue%20%2B%20gold%20on%20dark-002147)

## Stack

| Part        | Tech                                                            |
| ----------- | --------------------------------------------------------------- |
| `client/`   | React 18 · TypeScript · Vite · Tailwind CSS v3 · React Router   |
| `server/`   | Node · Express · TypeScript · Firebase Admin (Firestore + Auth) |
| Auth & DB   | Firebase Authentication (email/password + Google), Firestore    |

Currency is **Ghana Cedi (GH₵)**. Palette: Raisin Black base, Magnolia text,
Oxford / Imperial blue accents, muted gold highlight.

## Pages

**Buyer side:** `/` Home · `/shop` grid + filter/sort · `/shop/:slug` product detail ·
`/customize` live tee designer · `/lookbook` · `/story` · `/cart` cart + checkout (coupons) ·
`/account` auth dashboard + order history · `/community` prayer wall + testimonials ·
`/rewards` Levush Rewards hub (spin-to-win + coupons) · `/rewards/quiz` Scripture Quiz.

**Admin side (role-gated):** `/admin` dashboard · `/admin/products` add/edit/delete shirts ·
`/admin/orders` view + update status · `/admin/prayers` moderate the wall.

## Roles & admin access

The app is **role-based**: customers see the buyer side; admins also get `/admin`,
where edits to products, orders, and the prayer wall are the source of truth the
buyer side reads from. Admin is granted by email allowlist.

- **Set admins:** add emails to `ADMIN_EMAILS` in `server/.env` (comma-separated).
- **With Firebase:** the client sends a real ID token; the server verifies it and
  checks the email against the allowlist.
- **Demo mode (no Firebase):** sign in on `/account` with any email. Use
  `admin@levush.test` to get the admin role and try the panel. (Dev tokens are
  automatically rejected once real Firebase credentials are configured.)

## Engagement / Levush Rewards

- **Spin-to-Win** — one spin per day awards a discount coupon (`SPIN-XXXXX`) + points.
- **Scripture Quiz** — daily Bible trivia; 10 points per correct answer.
- **Loyalty points** — shown on `/account` and `/rewards`; earned from spins & quizzes.
- **Coupons** apply at checkout; totals (and coupon redemption) are validated server-side.

## Quick start

Two terminals (the client proxies `/api` → `:4000`).

```bash
# 1. Backend  (runs in in-memory dev mode without Firebase)
cd server
npm install
npm run dev          # http://localhost:4000

# 2. Frontend
cd client
npm install
npm run dev          # http://localhost:5173
```

Open http://localhost:5173. The site is fully browsable, the cart works
(localStorage), orders post to the backend, and the prayer wall is live —
**all without any Firebase setup**, thanks to in-memory fallbacks.

## Enabling Firebase (auth + persistence)

Everything works in demo mode, but to enable real sign-in and persistent data:

### Client (auth)

1. Create a Firebase project → add a **Web app** → copy the config.
2. In the console, enable **Authentication → Email/Password** and **Google**.
3. Copy `client/.env.example` → `client/.env` and fill in the `VITE_FIREBASE_*` values.

When a real `VITE_FIREBASE_API_KEY` is present, auth turns on automatically
(otherwise the Account page shows a "demo mode" banner).

### Server (Firestore persistence)

1. Firebase console → **Project settings → Service accounts → Generate new private key**.
2. Either point to the file or inline the JSON in `server/.env`
   (copy from `server/.env.example`):

   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
   # or
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account", ... }
   ```

With credentials present, prayers and orders persist to Firestore and order
endpoints verify the caller's ID token. Without them, the server logs
`memory mode` and keeps everything in RAM (resets on restart).

## API

| Method | Route                       | Notes                                            |
| ------ | --------------------------- | ------------------------------------------------ |
| GET    | `/api/health`               | Status + storage mode                            |
| GET    | `/api/me`                   | Caller identity + role                           |
| GET    | `/api/products`             | Catalogue (also `/:slug`)                        |
| POST/PUT/DELETE | `/api/products[/:id]` | **Admin** — create / update / delete shirts      |
| GET    | `/api/prayers`              | Prayer wall                                      |
| POST   | `/api/prayers`              | `{ name?, message }`                             |
| POST   | `/api/prayers/:id/pray`     | Increment "praying" count                        |
| DELETE | `/api/prayers/:id`          | **Admin** — moderate                             |
| POST   | `/api/orders`               | Total **recomputed server-side**; applies coupon |
| GET    | `/api/orders/mine`          | Requires auth                                    |
| GET / PATCH | `/api/orders[/:id]`    | **Admin** — list all / update status             |
| GET    | `/api/rewards/me`           | Points + coupons (auth)                           |
| POST   | `/api/rewards/spin`         | Daily spin → coupon + points (auth)              |
| POST   | `/api/rewards/quiz`         | Award quiz points (auth)                         |
| POST   | `/api/rewards/coupon/validate` | Check a coupon code                           |

Admin/authed routes take `Authorization: Bearer <idToken>` (or `Bearer dev:<email>` in demo mode).

## Build

```bash
cd client && npm run build      # tsc --noEmit + vite build → dist/
cd server && npm run build      # tsc → dist/, then `npm start`
```

## Project layout

```
client/src
  components/         Logo, Navbar, Footer, CartDrawer, ProductCard, Reveal, icons
  context/           CartContext (localStorage), AuthContext (Firebase)
  data/products.ts   Catalogue mapped from the 8 product photos
  lib/               firebase.ts, api.ts, format.ts (GH₵)
  pages/             Home, Shop, ProductDetail, Customize, Lookbook, Story,
                     Cart, Account, Community, NotFound
server/src
  data/products.ts   Server-side catalogue (price source of truth)
  lib/firebaseAdmin  Admin init w/ graceful in-memory fallback
  store/             prayerStore, orderStore (Firestore or memory)
  routes/            products, prayers, orders
```

— Wear the Word.
