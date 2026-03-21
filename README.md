# Viralzap

Public repo/branch: [apporbitscom-cmyk/viralzap (viralzap branch)](https://github.com/apporbitscom-cmyk/viralzap/tree/viralzap)

## What this project includes

- Static frontend served on `:3000`
- Node/Express backend served on `:4000`
- Firebase auth (frontend config)
- YouTube API usage (frontend config)
- Razorpay integration (frontend key id + backend secret)
- Gemini-powered Trending Topics tree (backend API call)

## Security first (read before publishing)

### Never commit these

- `backend/.env`
- Any real API keys or secrets

The repo now ignores secrets via `.gitignore`, but still verify before each push.

### Files that must be filled with your own values

- `firebase-config.js`
- `youtube-config.js`
- `razorpay-config.js`
- `backend/.env` (from `backend/.env.example`)
- `public-config.js` (set production backend URL)

### Important note about frontend keys

Values used in browser JavaScript are visible to users. For those keys:

- Use project-specific keys only
- Restrict by domain/referrer in provider dashboards
- Keep private secrets on backend only

## Local setup

### 1) Install dependencies

From project root:

```bash
npm install
cd backend
npm install
```

### 2) Configure backend secrets

Create `backend/.env` from `backend/.env.example` and set:

- `GEMINI_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- Optional plan/currency values

### 3) Configure frontend

Update:

- `firebase-config.js` with your Firebase project values
- `youtube-config.js` with your YouTube API key
- `razorpay-config.js` with your Razorpay key id

### 4) Run

From project root:

```bash
npm run dev
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:4000`

## Deploy publicly (including `.io` domain)

### Recommended architecture

- Frontend: GitHub Pages / Netlify / Vercel (static hosting)
- Backend: Railway / Render / Fly.io (Node server with env vars)
- Domain: buy your `.io` domain and point DNS to hosting providers

### Deployment checklist

1. Deploy backend first and set all backend environment variables.
2. Set `public-config.js`:
   - `apiBaseUrl: "https://your-backend-domain.com"`
3. Update frontend configs with production-safe values.
4. Deploy frontend.
5. Configure custom domain (`yourbrand.io`) in hosting + DNS.
6. Add allowed origins/domains in Firebase/Google/Razorpay dashboards.
7. Re-test login, payments, YouTube flows, and Trending Topics API.

## Pre-publish safety checklist

- [ ] No real keys in tracked files
- [ ] `backend/.env` is not committed
- [ ] `public-config.js` points to production backend
- [ ] All provider keys/domain restrictions set
- [ ] Full smoke test passed on production domain

