# Viralzaps – Tech Stack

Single reference for frontend, backend, authentication, payments, and third-party services used in this project.

---

## Overview

| Layer | Technologies |
|-------|--------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Google Fonts |
| **Backend** | Node.js, Express, Razorpay SDK |
| **Authentication** | Firebase (Auth: Email/Password + Google) |
| **Payments** | Razorpay (Checkout.js + Node SDK) |
| **APIs** | YouTube Data API v3 |
| **Client storage** | Browser `localStorage` (no server DB) |
| **Hosting** | Static host (Vercel/Netlify/GitHub Pages) + Node host (Railway/Render/Fly.io) |

---

## Frontend

### Structure & files
- **Landing page:** `index.html`, `styles.css`, `script.js`  
  - Marketing site: hero, features, pricing, FAQ, theme toggle, smooth scroll, mobile menu.
- **App (dashboard):** `dashboard.html`, `dashboard.css`, `dashboard.js`  
  - SPA-like dashboard: sidebar nav, Home (YouTube-style tabs + grid), Channels (Shorts/Longform), Viral, Similar Channels, Trending Topics, Recommended Ideas, YouTube Scraper, Find Channel, Analytics, Settings (Account, Notifications, Subscription, Usage), logout.

### Tech
- **HTML5** – Semantic markup, `data-theme`, `data-page`, `data-nav`, ARIA where used.
- **CSS3** – Custom properties (variables), responsive layout, light/dark theme, Flexbox/Grid.
- **Vanilla JavaScript** – No React/Vue; IIFE-based structure in `dashboard.js`, event delegation, `fetch` for API calls.
- **Fonts** – [Google Fonts](https://fonts.google.com): Inter (landing + dashboard), Plus Jakarta Sans (dashboard).

### Scripts loaded (dashboard)
| Script | Purpose |
|--------|---------|
| Firebase App (compat) | `https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js` |
| Firebase Auth (compat) | `https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js` |
| `firebase-config.js` | Init + auth helpers (Email/Password, Google) |
| `razorpay-config.js` | Key ID + `apiBaseUrl` (backend URL) |
| Razorpay Checkout | `https://checkout.razorpay.com/v1/checkout.js` |
| `youtube-config.js` | YouTube Data API v3 API key |
| Tesseract.js | `https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js` (OCR) |
| `dashboard.js` | All dashboard logic (views, nav, credits, billing, payments) |

### Client-side storage (localStorage)
- Auth: handled by Firebase; app may store user refs.
- `subscription_plan` – Active plan (starter/professional/ultimate) and renewal.
- `viralzaps_credits_purchased` – Purchased credit pack total.
- `viralzaps_credits_used` – Used credits count.
- `viralzaps_billing_history` – Billing entries (plans + credit packs).
- `viralzaps_recent_searches` – Recent Viralzaps searches.
- `viralzaps_trial_start` – Trial period start (ISO date).
- `theme` – Light/dark preference (landing).

---

## Backend

### Stack
- **Runtime:** Node.js  
- **Framework:** Express  
- **Dependencies:** `cors`, `dotenv`, `express`, `razorpay`  
- **Location:** `backend/`  
- **Entry:** `server.js`  
- **Port:** `process.env.PORT` or `4000`

### API endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Service info + list of endpoints |
| GET | `/api/health` | Health check + Razorpay configured flag |
| POST | `/api/create-order` | Create Razorpay order (credit packs, one-time) |
| POST | `/api/verify-payment` | Verify order payment signature |
| POST | `/api/create-subscription` | Create Razorpay subscription (starter/professional/ultimate) |
| POST | `/api/verify-subscription-payment` | Verify subscription payment signature |

### Environment variables (backend)
- `RAZORPAY_KEY_ID` – Razorpay key ID  
- `RAZORPAY_KEY_SECRET` – Razorpay key secret  
- `RAZORPAY_CURRENCY` – e.g. `INR`  
- `RAZORPAY_PLAN_STARTER` – Razorpay plan ID (Starter)  
- `RAZORPAY_PLAN_PROFESSIONAL` – Razorpay plan ID (Professional)  
- `RAZORPAY_PLAN_ULTIMATE` – Razorpay plan ID (Ultimate)  
- `PORT` – Server port (optional)

---

## Authentication

- **Provider:** Firebase Authentication  
- **Config:** `firebase-config.js` (project config: apiKey, authDomain, projectId, etc.)  
- **Methods:**  
  - Email/Password  
  - Google (OAuth, with account picker in production)  
- **SDK:** Firebase JS SDK v10 (compat: `firebase-app-compat`, `firebase-auth-compat`)  
- **Behavior:** Auth works over `http://`, `https://`, or `chrome-extension://` (not `file://`).  
- **Dashboard:** Redirect to login if not authenticated; logout clears session and redirects.

---

## Payments (Razorpay)

### Frontend
- **Config:** `razorpay-config.js` – `keyId`, `apiBaseUrl` (localhost vs production backend URL).  
- **Checkout:** Razorpay Checkout script; orders created via backend `POST /api/create-order`; on success, payment verified with `POST /api/verify-payment`.  
- **Use cases:**  
  - **Credit packs** – One-time orders (e.g. 45 / 100 credits, INR).  
  - **Subscription plans** – Starter, Professional, Ultimate (monthly, INR); create via `POST /api/create-subscription`, verify via `POST /api/verify-subscription-payment`.

### Backend
- **SDK:** `razorpay` (Node).  
- **Actions:** Create orders, create subscriptions, verify payment/subscription signatures (HMAC-SHA256).  
- **Secrets:** Key ID + Key Secret from [Razorpay Dashboard](https://dashboard.razorpay.com); Secret only on backend.

---

## External APIs & services

| Service | Config / usage |
|--------|----------------|
| **YouTube Data API v3** | API key in `youtube-config.js`; used for home feed, search, channel/video data. |
| **Firebase** | Project config in `firebase-config.js`; Auth only (no Firestore/Realtime DB in this doc). |
| **Razorpay** | Key + backend URL in `razorpay-config.js`; backend uses env for secret and plan IDs. |

---

## Build & run

- **No build step** – Static frontend; backend is plain Node.  
- **Local frontend:** e.g. `npx serve . -l 3000` or open `index.html`/`dashboard.html` (auth needs http/https).  
- **Local backend:** `cd backend && npm install && npm start` (set env vars or `.env`).  
- **Production:** Deploy frontend to a static host and backend to a Node host; set backend URL in `razorpay-config.js` (or via `RAZORPAY_API_BASE_URL` if supported). See `HOSTING.md`.

---

## Summary table

| Category | Technology |
|----------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JS, Google Fonts (Inter, Plus Jakarta Sans) |
| **Backend** | Node.js, Express, CORS, dotenv, Razorpay SDK |
| **Auth** | Firebase Authentication (Email/Password, Google) |
| **Payments** | Razorpay (Checkout.js frontend, Razorpay Node backend) |
| **APIs** | YouTube Data API v3 |
| **OCR** | Tesseract.js (client-side) |
| **Storage** | localStorage (subscription, credits, billing, theme, recent searches) |
| **Hosting** | Static: Vercel, Netlify, GitHub Pages; Backend: Railway, Render, Fly.io |
