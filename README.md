# Levush — Faith, Worn.

Premium scripture streetwear storefront. **Levush** (Hebrew לְבוּשׁ, "garment") is a faith-based clothing brand. This repo is the full website: a React storefront and an Express + Firebase backend.

![palette](https://img.shields.io/badge/theme-deep%20blue%20%2B%20gold%20on%20dark-002147)

## Stack

| Part        | Tech                                                            |
| ----------- | --------------------------------------------------------------- |
| `client/`   | React 18 · TypeScript · Vite · Tailwind CSS v3 · React Router   |
| `server/`   | Node · Express · TypeScript · Firebase Admin (Firestore + Auth) |
| Auth & DB   | Firebase Authentication (email/password + Google), Firestore    |

Currency is **Ghana Cedi (GH₵)**. Palette: Raisin Black base, Magnolia text, Oxford / Imperial blue accents, muted gold highlight.

## Pages

**Buyer side:** `/` Home · `/shop` grid + filter/sort · `/shop/:slug` product detail · `/about` · `/contact` · `/cart` bag · `/checkout` order completion (coupons + Mobile Money / Card) · `/account` member dashboard + order history · `/settings` profile settings.

**Admin side (role-gated):** `/admin` dashboard · `/admin/products` add/edit/delete shirts · `/admin/orders` view + update status · `/admin/coupons` create & manage discount codes.

## Roles & Admin Access

The app is **role-based**: customers see the buyer side; admins also get `/admin`, where edits to products, orders, and coupons are the source of truth the buyer side reads from. Admin is granted by email allowlist.

- **Set admins:** add emails to `ADMIN_EMAILS` in `server/.env` (comma-separated).
- **With Firebase:** the client sends a real ID token; the server verifies it and checks the email against the allowlist.
- **Demo mode (no Firebase):** sign in on `/account` or `/signin` with any email. Use `admin@levush.test` to get the admin role and try the panel. (Dev tokens are automatically rejected once real Firebase credentials are configured.)

## Quick Start

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

Open http://localhost:5173. The site is fully browsable, the cart works (localStorage), orders post to the backend, and promo codes apply — **all without any Firebase setup**, thanks to in-memory fallbacks.

## Enabling Firebase (Auth + Persistence)

### Client (Auth)

1. Create a Firebase project → add a **Web app** → copy the config.
2. In the console, enable **Authentication → Email/Password** and **Google**.
3. Copy `client/.env.example` → `client/.env` and fill in the `VITE_FIREBASE_*` values.

When a real `VITE_FIREBASE_API_KEY` is present, auth turns on automatically (otherwise the sign-in page shows a "demo mode" banner).

### Server (Firestore Persistence)

1. Firebase console → **Project settings → Service accounts → Generate new private key**.
2. Either point to the file or inline the JSON in `server/.env`:

   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
   # or
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account", ... }
   ```

## API Endpoints

| Method | Route                       | Notes                                            |
| ------ | --------------------------- | ------------------------------------------------ |
| GET    | `/api/health`               | Status + storage mode                            |
| GET    | `/api/me`                   | Caller identity + role                           |
| GET    | `/api/products`             | Catalogue (also `/:slug`)                        |
| POST/PUT/DELETE | `/api/products[/:id]` | **Admin** — create / update / delete shirts      |
| POST   | `/api/orders`               | Total **recomputed server-side**; applies coupon |
| GET    | `/api/orders/mine`          | Requires auth                                    |
| GET / PATCH | `/api/orders[/:id]`    | **Admin** — list all / update status             |
| POST   | `/api/coupons/validate`     | Check a coupon code                              |
| GET / POST / DELETE | `/api/coupons[/:code]` | **Admin** — manage promotional coupons           |

## Build

```bash
cd client && npm run build      # tsc --noEmit + vite build → dist/
cd server && npm run build      # tsc → dist/, then `npm start`
```

— Wear the Word.
