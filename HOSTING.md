# Hosting Viralzap on the Web

Your app has two parts:
1. **Frontend** – static files (HTML, CSS, JS) served on port 3000
2. **Backend** – Node/Express API (Razorpay) on port 4000

To make it public, deploy both and point the frontend to the live backend URL.

---

## Quick overview

| Step | What to do |
|------|------------|
| 1 | Deploy **backend** to a Node host (Railway, Render, Fly.io, etc.) |
| 2 | Deploy **frontend** to a static host (Vercel, Netlify, GitHub Pages, etc.) |
| 3 | Set **environment variables** on the backend (Razorpay keys, etc.) |
| 4 | Set **apiBaseUrl** in the frontend to your live backend URL |

---

## Step 1: Deploy the backend

The backend is in the `backend/` folder and runs with `node server.js`.

### Option A: Railway (recommended, free tier)

1. Go to [railway.app](https://railway.app) and sign in (e.g. with GitHub).
2. **New Project** → **Deploy from GitHub repo**. Connect your repo and select the **backend** folder (or the whole repo and set root to `backend`).
3. In **Variables**, add:
   - `RAZORPAY_KEY_ID` = your Razorpay Key ID  
   - `RAZORPAY_KEY_SECRET` = your Razorpay Key Secret  
   - `RAZORPAY_CURRENCY` = `INR`  
   - `PORT` = `4000` (optional; Railway sets one for you)
4. Deploy. After deploy, open **Settings** → **Networking** → **Generate Domain**. You’ll get a URL like `https://your-app.up.railway.app`.
5. **Copy this URL** – this is your **backend URL** for the next step.

### Option B: Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**.
2. Connect the repo, set **Root Directory** to `backend`.
3. **Build**: `npm install`  
   **Start**: `npm start`
4. In **Environment**, add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_CURRENCY=INR`.
5. Deploy and copy the service URL (e.g. `https://your-app.onrender.com`).

### Option C: Fly.io

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/) and run `fly auth login`.
2. From the project root: `cd backend && fly launch` (follow prompts, don’t add a database).
3. Set secrets:  
   `fly secrets set RAZORPAY_KEY_ID=xxx RAZORPAY_KEY_SECRET=xxx RAZORPAY_CURRENCY=INR`
4. Deploy: `fly deploy`. Your backend URL will be like `https://your-app.fly.dev`.

---

## Step 2: Deploy the frontend

Your frontend is static (no build step unless you add one). You need to serve the **project root** (where `index.html`, `dashboard.html`, `dashboard.js`, etc. live).

### Option A: Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo.
2. **Root Directory**: leave as `.` (repo root).
3. **Build Command**: leave empty (static site).
4. **Output Directory**: leave as `.` or leave default.
5. Before deploying, set the backend URL (see Step 4 below) in `razorpay-config.js` or via env (see “Production config” below).
6. Deploy. You’ll get a URL like `https://your-project.vercel.app`.

### Option B: Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**.
2. Select repo; **Publish directory**: `.`
3. Deploy. Set the backend URL in the frontend (Step 4).

### Option C: GitHub Pages

1. In the repo: **Settings** → **Pages** → Source: **GitHub Actions** (or deploy from branch).
2. You’ll need a small workflow or a tool (e.g. `peaceiris/actions-gh-pages`) to publish the root folder. Your site will be at `https://<username>.github.io/<repo>/`.
3. Update `razorpay-config.js` (or use a config that reads the backend URL from the environment; see below).

---

## Step 3: Backend environment variables

On the host where the backend runs, set:

| Variable | Example | Required |
|----------|--------|----------|
| `RAZORPAY_KEY_ID` | `rzp_test_...` or `rzp_live_...` | Yes |
| `RAZORPAY_KEY_SECRET` | Your secret from Razorpay | Yes |
| `RAZORPAY_CURRENCY` | `INR` | Yes (or USD) |
| `PORT` | `4000` | Optional (host often sets it) |

Use **live** keys from [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys) when you want real payments.

---

## Step 4: Point frontend to the live backend

Right now the frontend uses `http://localhost:4000`. It must use your **deployed backend URL** in production.

**Option A – Set production URL in code**  
Edit `razorpay-config.js` and replace the placeholder with your real backend URL:

```js
: (window.RAZORPAY_API_BASE_URL || 'https://YOUR-BACKEND-URL.railway.app')
```
Change to:
```js
: (window.RAZORPAY_API_BASE_URL || 'https://your-actual-backend.up.railway.app')
```

On localhost the app still uses `http://localhost:4000`; when visitors use your live site it will use the URL above.

**Option B – Use same host for frontend and API (optional)**  
If you serve the frontend and the backend from the same origin (e.g. same Vercel project with serverless API, or same VPS with reverse proxy), you can set `apiBaseUrl: ''` and use relative paths like `/api/...` so the same code works everywhere.

---

## Step 5: Firebase and YouTube (if used)

- **Firebase**: Use the same Firebase project; no URL change. Ensure the **authorized domains** in Firebase Console → Authentication → Settings include your live frontend domain (e.g. `your-project.vercel.app`).
- **YouTube API**: The key is in the frontend; it will work from any domain. Restrict the key in Google Cloud Console to your production domain (and localhost) to avoid abuse.

---

## Checklist before going live

- [ ] Backend deployed and returning 200 at `https://your-backend-url/api/health`
- [ ] Backend env vars set (Razorpay keys, currency)
- [ ] Frontend deployed and opening at a public URL
- [ ] `razorpay-config.js` (or your config) uses the **live backend URL**
- [ ] Firebase Auth authorized domains include your frontend URL
- [ ] For real payments: Razorpay **live** keys and verified account

---

## Summary

1. Deploy **backend** (e.g. Railway/Render) and copy its URL.
2. Deploy **frontend** (e.g. Vercel/Netlify) from the repo root.
3. Set backend env vars (Razorpay keys, `RAZORPAY_CURRENCY=INR`).
4. Set frontend `apiBaseUrl` in `razorpay-config.js` to the backend URL (or use relative URLs if frontend and API are on the same host).
5. Add your frontend domain to Firebase authorized domains.

After that, anyone can use the app at your frontend URL.
