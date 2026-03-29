/**
 * Viralzaps backend – Razorpay orders (credit packs) and subscriptions (plans).
 * Run: npm install && set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... (or use .env) && npm start
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, 'firebase.env') });
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { generateTrendingIdeas } = require('./geminiTrending');
const {
  logOrderPaymentFromRazorpay,
  logSubscriptionPaymentFromRazorpay,
  isConfigured: googleSheetsConfigured
} = require('./paymentSheetLogger');

const app = express();
// Backend default port (Viralzaps frontend uses 3000)
const PORT = parseInt(process.env.PORT, 10) || 4000;
const YOUTUBE_SEARCH_COST_UNITS = 100;
// YouTube quota is tracked per API key / project pool in this app.
// Each key is assumed to have ~10,000 units/day (search.list costs 100 units).
// When a key hits 9,999 units used, we stop using it and shift to the next key.
const YOUTUBE_DAILY_KEY_LIMIT = parseInt(process.env.YOUTUBE_DAILY_KEY_LIMIT, 10) || 10000;
const YOUTUBE_SWITCH_THRESHOLD = parseInt(process.env.YOUTUBE_SWITCH_THRESHOLD, 10) || 9999;
const YOUTUBE_USAGE_FILE = path.join(__dirname, 'data', 'youtube-usage.json');

// Razorpay: amount is in smallest currency unit (cents for USD, paise for INR)
const CURRENCY = process.env.RAZORPAY_CURRENCY || 'USD';

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, razorpay: !!razorpay });
});

app.get('/api/firebase-config', (req, res) => {
  const apiKey = (process.env.FIREBASE_API_KEY || '').trim();
  const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim();
  if (!apiKey || !projectId) {
    return res.status(503).json({
      error:
        'Set FIREBASE_API_KEY and FIREBASE_PROJECT_ID in backend/firebase.env (see firebase.env.example).'
    });
  }
  res.json({
    firebaseConfig: {
      apiKey,
      authDomain: (process.env.FIREBASE_AUTH_DOMAIN || '').trim(),
      projectId,
      storageBucket: (process.env.FIREBASE_STORAGE_BUCKET || '').trim(),
      messagingSenderId: (process.env.FIREBASE_MESSAGING_SENDER_ID || '').trim(),
      appId: (process.env.FIREBASE_APP_ID || '').trim(),
      ...(process.env.FIREBASE_MEASUREMENT_ID
        ? { measurementId: process.env.FIREBASE_MEASUREMENT_ID.trim() }
        : {})
    }
  });
});

function normalizeApiKeyEnv(v) {
  if (v == null || v === '') return '';
  return String(v)
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

function normalizeYouTubeApiKey(v) {
  const s = normalizeApiKeyEnv(v);
  if (!s) return '';
  return s
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .replace(/\n/g, '')
    .replace(/\s/g, '');
}

function resolveYouTubeApiKeysFromEnv() {
  function splitMaybeCommaSeparated(raw) {
    if (!raw) return [];
    const normalized = normalizeYouTubeApiKey(raw);
    if (!normalized) return [];
    if (normalized.indexOf(',') !== -1) {
      return normalized
        .split(',')
        .map(function (x) {
          return normalizeYouTubeApiKey(x);
        })
        .filter(function (x) {
          return !!x;
        });
    }
    return [normalized];
  }

  // Option A: comma-separated keys in YOUTUBE_API_KEYS (recommended).
  const fromPool = splitMaybeCommaSeparated(process.env.YOUTUBE_API_KEYS || '');
  if (fromPool.length) return fromPool;

  // Option B: support comma-separated values in YOUTUBE_API_KEY / YOUTUBE_DATA_API_KEY too.
  const fromSingle = splitMaybeCommaSeparated(
    process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_DATA_API_KEY || ''
  );
  if (fromSingle.length) return fromSingle;

  // Option C: support YOUTUBE_API_KEY_1, YOUTUBE_API_KEY_2, ...
  const keys = [];
  Object.keys(process.env).forEach(function (k) {
    if (!/^YOUTUBE_API_KEY(_\d+)?$/i.test(k)) return;
    const v = normalizeYouTubeApiKey(process.env[k]);
    if (v) keys.push(v);
  });
  return keys;
}

const YOUTUBE_API_KEYS = resolveYouTubeApiKeysFromEnv();
const YOUTUBE_DATA_API_KEY = YOUTUBE_API_KEYS.length ? YOUTUBE_API_KEYS[0] : '';
if (YOUTUBE_DATA_API_KEY) {
  console.log(
    '[YouTube] API key pool loaded for server. keys=' +
      YOUTUBE_API_KEYS.length +
      ' (first length ' +
      YOUTUBE_DATA_API_KEY.length +
      ').'
  );
} else {
  console.warn('[YouTube] No YouTube API key(s) found in backend/.env.');
}

function todayKeyUTC() {
  return new Date().toISOString().slice(0, 10);
}

function getUserPlanDailyLimit(planRaw) {
  const plan = (planRaw || '').toString().trim().toLowerCase();
  if (plan === 'plan_6m' || plan === 'professional') return 200; // ₹999 plan
  if (plan === 'plan_lifetime' || plan === 'ultimate') return 200;
  return 100; // ₹99 plan and unknown defaults
}

function normalizeUserId(raw) {
  const v = (raw || '').toString().trim().toLowerCase();
  return v ? v : 'anonymous';
}

function readYoutubeUsageState() {
  try {
    if (!fs.existsSync(YOUTUBE_USAGE_FILE)) {
      return { day: todayKeyUTC(), nextKeyIndex: 0, keysUsed: {}, users: {} };
    }
    const parsed = JSON.parse(fs.readFileSync(YOUTUBE_USAGE_FILE, 'utf8'));
    if (!parsed || typeof parsed !== 'object') {
      return { day: todayKeyUTC(), nextKeyIndex: 0, keysUsed: {}, users: {} };
    }
    const parsedKeysUsed =
      parsed.keysUsed && typeof parsed.keysUsed === 'object' ? parsed.keysUsed : {};
    const keysUsed = parsedKeysUsed;
    // Backward compat: older file had globalUsed; treat it as keyIndex=0 usage.
    if ((!keysUsed || Object.keys(keysUsed).length === 0) && parsed.globalUsed != null) {
      keysUsed['0'] = Math.max(0, Number(parsed.globalUsed) || 0);
    }
    return {
      day: (parsed.day || '').toString(),
      nextKeyIndex: parsed.nextKeyIndex != null ? Number(parsed.nextKeyIndex) : 0,
      keysUsed: keysUsed || {},
      users: parsed.users && typeof parsed.users === 'object' ? parsed.users : {}
    };
  } catch (e) {
    return { day: todayKeyUTC(), nextKeyIndex: 0, keysUsed: {}, users: {} };
  }
}

function writeYoutubeUsageState(state) {
  fs.mkdirSync(path.dirname(YOUTUBE_USAGE_FILE), { recursive: true });
  fs.writeFileSync(YOUTUBE_USAGE_FILE, JSON.stringify(state), 'utf8');
}

function getFreshUsageState() {
  const state = readYoutubeUsageState();
  const today = todayKeyUTC();
  if (state.day !== today) {
    return { day: today, nextKeyIndex: 0, keysUsed: {}, users: {} };
  }
  return state;
}

function canConsumeYoutubeCredit(userId, plan, units) {
  const state = getFreshUsageState();
  const userKey = normalizeUserId(userId);
  const perUserLimit = getUserPlanDailyLimit(plan);
  const userUsed = Math.max(0, Number(state.users[userKey]) || 0);
  const cost = Math.max(1, Number(units) || 1);
  // Select a YouTube API key that still has capacity today.
  const keysUsed = state.keysUsed || {};
  let selectedIndex = -1;
  const startIndex =
    YOUTUBE_API_KEYS.length > 0 ? Math.max(0, Number(state.nextKeyIndex) || 0) % YOUTUBE_API_KEYS.length : 0;
  // Round-robin: try keys in order starting from nextKeyIndex
  for (let offset = 0; offset < YOUTUBE_API_KEYS.length; offset++) {
    const i = (startIndex + offset) % YOUTUBE_API_KEYS.length;
    const used = Math.max(0, Number(keysUsed[String(i)]) || 0);
    if (used >= YOUTUBE_SWITCH_THRESHOLD) continue;
    if (used + cost > YOUTUBE_DAILY_KEY_LIMIT) continue;
    selectedIndex = i;
    break;
  }
  if (selectedIndex === -1) {
    return { ok: false, reason: 'global', state, userKey, userUsed, perUserLimit };
  }
  const selectedKey = YOUTUBE_API_KEYS[selectedIndex];
  if (userUsed + cost > perUserLimit) {
    return { ok: false, reason: 'user', state, userKey, userUsed, perUserLimit };
  }
  return {
    ok: true,
    state,
    userKey,
    userUsed,
    perUserLimit,
    youtubeKeyIndex: selectedIndex,
    youtubeKey: selectedKey
  };
}

function consumeYoutubeCredit(state, userKey, units, youtubeKeyIndex) {
  const cost = Math.max(1, Number(units) || 1);
  const idx = String(youtubeKeyIndex);
  state.keysUsed = state.keysUsed || {};
  state.keysUsed[idx] = (Number(state.keysUsed[idx]) || 0) + cost;
  state.users[userKey] = (Number(state.users[userKey]) || 0) + cost;
  // Advance round-robin pointer for the next YouTube API call.
  if (YOUTUBE_API_KEYS && YOUTUBE_API_KEYS.length > 0) {
    state.nextKeyIndex = (Number(youtubeKeyIndex) + 1) % YOUTUBE_API_KEYS.length;
  }
  writeYoutubeUsageState(state);
}

app.get('/api/youtube-config', (req, res) => {
  if (!YOUTUBE_API_KEYS || YOUTUBE_API_KEYS.length === 0) {
    return res.status(503).json({ error: 'youtube_key_missing' });
  }
  const state = readYoutubeUsageState();
  const keysUsed = state && state.keysUsed ? state.keysUsed : {};
  const startIndex =
    YOUTUBE_API_KEYS.length > 0 ? Math.max(0, Number(state.nextKeyIndex) || 0) % YOUTUBE_API_KEYS.length : 0;
  let chosenIndex = startIndex;
  for (let offset = 0; offset < YOUTUBE_API_KEYS.length; offset++) {
    const i = (startIndex + offset) % YOUTUBE_API_KEYS.length;
    const used = Math.max(0, Number(keysUsed[String(i)]) || 0);
    if (used < YOUTUBE_SWITCH_THRESHOLD && used + 1 <= YOUTUBE_DAILY_KEY_LIMIT) {
      chosenIndex = i;
      break;
    }
  }
  res.json({ youtubeApiKey: YOUTUBE_API_KEYS[chosenIndex] });
});

/**
 * YouTube Data API: search for videos related to a topic, ordered by view count (popular / trending in niche).
 * Query params: q (required), regionCode (default IN), maxResults (default 24, max 50)
 */
app.get('/api/youtube-trending-topics-search', async (req, res) => {
  const rawQ = (req.query.q || '').toString().trim();
  if (!rawQ || rawQ.length < 2) {
    return res.status(400).json({ error: 'Enter a topic (at least 2 characters).' });
  }
  if (!YOUTUBE_API_KEYS || YOUTUBE_API_KEYS.length === 0) {
    return res.status(503).json({ error: 'youtube_key_missing' });
  }
  const userIdHeader = req.headers['x-user-id'];
  const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;
  const userPlanHeader = req.headers['x-user-plan'];
  const userPlan = Array.isArray(userPlanHeader) ? userPlanHeader[0] : userPlanHeader;
  const quotaCheck = canConsumeYoutubeCredit(userId, userPlan, YOUTUBE_SEARCH_COST_UNITS);
  if (!quotaCheck.ok) {
    return res.status(429).json({
      error: 'quota_limit_reached',
      message: 'Come tomorrow to use again.',
      scope: quotaCheck.reason
    });
  }
  const youtubeKey = quotaCheck.youtubeKey;
  var debugMode = String(req.headers['x-debug-youtube-key'] || '').toString().trim() === '1';
  var youtubeKeyIndexUsed = quotaCheck.youtubeKeyIndex;
  const region = (req.query.regionCode || 'IN').toString().trim().slice(0, 2).toUpperCase() || 'IN';
  const max = Math.min(50, Math.max(5, parseInt(req.query.maxResults, 10) || 24));
  const publishedAfter = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
  const base =
    'https://www.googleapis.com/youtube/v3/search?' +
    'part=snippet&q=' +
    encodeURIComponent(rawQ) +
    '&type=video&order=viewCount&maxResults=' +
    max +
    '&relevanceLanguage=en&regionCode=' +
    encodeURIComponent(region);
  const urlWithDate =
    base + '&publishedAfter=' + encodeURIComponent(publishedAfter) + '&key=' + encodeURIComponent(youtubeKey);
  const urlNoDate = base + '&key=' + encodeURIComponent(youtubeKey);
  try {
    let r = await fetch(urlWithDate);
    let json = await r.json().catch(() => null);
    if (!r.ok) {
      const msg =
        json && json.error && json.error.message ? json.error.message : 'YouTube API request failed';
      return res.status(r.status >= 400 ? r.status : 502).json({ error: msg });
    }
    consumeYoutubeCredit(
      quotaCheck.state,
      quotaCheck.userKey,
      YOUTUBE_SEARCH_COST_UNITS,
      quotaCheck.youtubeKeyIndex
    );
    let rows = (json && json.items) || [];
    if (rows.length === 0) {
      const quotaCheckSecond = canConsumeYoutubeCredit(userId, userPlan, YOUTUBE_SEARCH_COST_UNITS);
      if (!quotaCheckSecond.ok) {
        return res.status(429).json({
          error: 'quota_limit_reached',
          message: 'Come tomorrow to use again.',
          scope: quotaCheckSecond.reason
        });
      }
      const youtubeKey2 = quotaCheckSecond.youtubeKey;
      youtubeKeyIndexUsed = quotaCheckSecond.youtubeKeyIndex;
      const urlNoDate2 = base + '&key=' + encodeURIComponent(youtubeKey2);
      r = await fetch(urlNoDate2);
      json = await r.json().catch(() => null);
      if (!r.ok) {
        const msg =
          json && json.error && json.error.message ? json.error.message : 'YouTube API request failed';
        return res.status(r.status >= 400 ? r.status : 502).json({ error: msg });
      }
      consumeYoutubeCredit(
        quotaCheckSecond.state,
        quotaCheckSecond.userKey,
        YOUTUBE_SEARCH_COST_UNITS,
        quotaCheckSecond.youtubeKeyIndex
      );
      rows = (json && json.items) || [];
    }
    const items = rows
      .map((row) => {
        const sn = row.snippet || {};
        const vid = row.id && row.id.videoId ? row.id.videoId : '';
        const thumbs = sn.thumbnails || {};
        const thumb =
          (thumbs.medium && thumbs.medium.url) ||
          (thumbs.high && thumbs.high.url) ||
          (thumbs.default && thumbs.default.url) ||
          '';
        return {
          videoId: vid,
          title: (sn.title || '').trim(),
          channelTitle: (sn.channelTitle || '').trim(),
          thumbnail: thumb
        };
      })
      .filter((x) => x.videoId);
    if (debugMode) {
      res.json({
        query: rawQ,
        regionCode: region,
        items: items,
        debug: {
          youtubeKeyIndexUsed: youtubeKeyIndexUsed
        }
      });
    } else {
      res.json({ query: rawQ, regionCode: region, items });
    }
  } catch (e) {
    res.status(500).json({ error: e && e.message ? e.message : 'YouTube search failed' });
  }
});

/**
 * Gemini-powered "Trending Topics" idea exploration.
 */
app.post('/api/gemini-trending', async (req, res) => {
  try {
    const body = req.body || {};
    const keyword = (body.keyword || '').toString().trim();
    const parent = body.parent ? (body.parent || '').toString().trim() : '';
    const exclusions = Array.isArray(body.exclusions) ? body.exclusions : [];
    const geminiApiKey = (body.geminiApiKey || '').toString().trim();

    if (!keyword) {
      return res.status(400).json({ error: 'Missing keyword' });
    }

    const items = await generateTrendingIdeas({
      keyword,
      parent: parent || null,
      exclusions,
      apiKey: geminiApiKey || undefined
    });

    res.json({ items });
  } catch (err) {
    const status = err && err.statusCode ? err.statusCode : 500;
    res.status(status).json({ error: err && err.message ? err.message : 'Gemini failed' });
  }
});

/**
 * Create a Razorpay order for one-time payment (credit packs, etc.)
 */
app.post('/api/create-order', async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ error: 'Razorpay not configured' });
  }
  const { amount, currency = CURRENCY, receipt, notes = {} } = req.body;
  const amountNum = Math.round(Number(amount));
  if (!amountNum || amountNum < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  try {
    const order = await razorpay.orders.create({
      amount: amountNum,
      currency: currency || CURRENCY,
      receipt: receipt || 'credit_pack_' + Date.now(),
      notes
    });
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error('Razorpay create order error:', err);
    res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

/**
 * Create a Razorpay subscription for a plan.
 */
app.post('/api/create-subscription', async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ error: 'Razorpay not configured' });
  }
  const planMap = {
    starter: process.env.RAZORPAY_PLAN_STARTER,
    professional: process.env.RAZORPAY_PLAN_PROFESSIONAL,
    ultimate: process.env.RAZORPAY_PLAN_ULTIMATE
  };
  const planKey = (req.body.planKey || '').toLowerCase();
  const planId = planMap[planKey];
  if (!planId) {
    return res.status(400).json({ error: 'Invalid plan. Use starter, professional, or ultimate.' });
  }
  const { customer_email, customer_name } = req.body;
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      quantity: 1,
      customer_notify: 1,
      notes: {
        customer_email: customer_email || '',
        customer_name: customer_name || ''
      }
    });
    const planNames = { starter: 'Starter', professional: 'Professional', ultimate: 'Ultimate' };
    res.json({
      subscriptionId: subscription.id,
      planName: planNames[planKey] || planKey,
      status: subscription.status
    });
  } catch (err) {
    console.error('Razorpay create subscription error:', err);
    res.status(500).json({ error: err.message || 'Failed to create subscription' });
  }
});

/**
 * Verify payment signature after successful checkout (for orders).
 */
function hmacSha256(secret, body) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

app.post('/api/verify-payment', async (req, res) => {
  const rawSecret = process.env.RAZORPAY_KEY_SECRET;
  if (!rawSecret) {
    return res.status(503).json({ error: 'Razorpay not configured' });
  }
  const secret = String(rawSecret).replace(/\r\n/g, '').replace(/\n/g, '').replace(/\r/g, '').trim();
  const body = req.body || {};
  const order_id = (body.order_id ?? body.razorpay_order_id ?? '').toString().trim();
  const payment_id = (body.payment_id ?? body.razorpay_payment_id ?? '').toString().trim();
  const signature = (body.signature ?? body.razorpay_signature ?? '').toString().trim();
  if (!order_id || !payment_id || !signature) {
    return res.status(400).json({ error: 'Missing order_id, payment_id, or signature' });
  }
  const bodyOrderFirst = order_id + '|' + payment_id;
  const bodyPaymentFirst = payment_id + '|' + order_id;
  const expectedOrderFirst = hmacSha256(secret, bodyOrderFirst);
  const expectedPaymentFirst = hmacSha256(secret, bodyPaymentFirst);
  const verified = (signature === expectedOrderFirst) || (signature === expectedPaymentFirst);
  if (!verified) {
    return res.status(400).json({ error: 'Invalid signature', verified: false });
  }
  const customer_name = (body.customer_name ?? body.customerName ?? '').toString().trim();
  const customer_email = (body.customer_email ?? body.customerEmail ?? '').toString().trim();
  if (razorpay && googleSheetsConfigured()) {
    logOrderPaymentFromRazorpay(razorpay, {
      orderId: order_id,
      paymentId: payment_id,
      customerName: customer_name,
      customerEmail: customer_email
    }).catch(function () {});
  }
  res.json({ verified: true });
});

/**
 * Verify subscription payment (first charge).
 */
app.post('/api/verify-subscription-payment', async (req, res) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'Razorpay not configured' });
  }
  const reqBody = req.body || {};
  const { subscription_id, payment_id, signature } = reqBody;
  if (!subscription_id || !payment_id || !signature) {
    return res.status(400).json({ error: 'Missing subscription_id, payment_id, or signature' });
  }
  const sigPayload = payment_id + '|' + subscription_id;
  const expected = crypto.createHmac('sha256', secret).update(sigPayload).digest('hex');
  if (expected !== signature) {
    return res.status(400).json({ error: 'Invalid signature', verified: false });
  }
  const customer_name = (reqBody.customer_name ?? reqBody.customerName ?? '').toString().trim();
  const customer_email = (reqBody.customer_email ?? reqBody.customerEmail ?? '').toString().trim();
  if (razorpay && googleSheetsConfigured()) {
    logSubscriptionPaymentFromRazorpay(razorpay, {
      subscriptionId: subscription_id,
      paymentId: payment_id,
      customerName: customer_name,
      customerEmail: customer_email
    }).catch(function () {});
  }
  res.json({ verified: true });
});

// ─── Serve frontend static files ─────────────────────────────────────────────
// All API routes are defined above. Anything below is for the frontend.
app.use(express.static(path.join(__dirname, '..')));

// Catch-all: serve index.html for any non-API route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});
// ─────────────────────────────────────────────────────────────────────────────

function startServer(port) {
  const p = Number(port);
  const server = app.listen(p, () => {
    console.log('Viralzaps backend running on http://localhost:' + p);
    console.log('Firebase client config: GET http://localhost:' + p + '/api/firebase-config');
    if (p !== PORT) console.warn('Update razorpay-config.js apiBaseUrl to http://localhost:' + p);
    if (!razorpay) console.warn('Razorpay keys missing – set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
    if (!googleSheetsConfigured()) {
      console.warn(
        'Google Sheets payment log disabled – set GOOGLE_APPS_SCRIPT_WEBHOOK_URL + GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET'
      );
    }
  });
  server.on('error', (err) => {
    const maxTry = PORT + 10;
    if (err.code === 'EADDRINUSE' && p < maxTry) {
      console.warn('Port ' + p + ' in use, trying ' + (p + 1) + '...');
      startServer(p + 1);
    } else {
      throw err;
    }
  });
}
startServer(PORT);
