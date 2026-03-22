/**
 * Viralzaps backend – Razorpay orders (credit packs) and subscriptions (plans).
 * Run: npm install && set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... (or use .env) && npm start
 */

require('dotenv').config();
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
const PORT = process.env.PORT || 4000;

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

// Root – so visiting http://localhost:4000/ shows something useful
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'Viralzaps backend',
    endpoints: {
      health: 'GET /api/health',
      youtubeTrendingSearch: 'GET /api/youtube-trending-topics-search?q=',
      createOrder: 'POST /api/create-order',
      verifyPayment: 'POST /api/verify-payment',
      createSubscription: 'POST /api/create-subscription',
      verifySubscriptionPayment: 'POST /api/verify-subscription-payment',
      geminiTrending: 'POST /api/gemini-trending'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, razorpay: !!razorpay });
});

const YOUTUBE_DATA_API_KEY = process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_DATA_API_KEY || '';

/**
 * YouTube Data API: search for videos related to a topic, ordered by view count (popular / trending in niche).
 * Query params: q (required), regionCode (default IN), maxResults (default 24, max 50)
 */
app.get('/api/youtube-trending-topics-search', async (req, res) => {
  const rawQ = (req.query.q || '').toString().trim();
  if (!rawQ || rawQ.length < 2) {
    return res.status(400).json({ error: 'Enter a topic (at least 2 characters).' });
  }
  if (!YOUTUBE_DATA_API_KEY) {
    return res.status(503).json({
      error: 'YouTube API key not configured. Set YOUTUBE_API_KEY in backend .env.'
    });
  }
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
    base + '&publishedAfter=' + encodeURIComponent(publishedAfter) + '&key=' + encodeURIComponent(YOUTUBE_DATA_API_KEY);
  const urlNoDate = base + '&key=' + encodeURIComponent(YOUTUBE_DATA_API_KEY);
  try {
    let r = await fetch(urlWithDate);
    let json = await r.json().catch(() => null);
    if (!r.ok) {
      const msg =
        json && json.error && json.error.message ? json.error.message : 'YouTube API request failed';
      return res.status(r.status >= 400 ? r.status : 502).json({ error: msg });
    }
    let rows = (json && json.items) || [];
    if (rows.length === 0) {
      r = await fetch(urlNoDate);
      json = await r.json().catch(() => null);
      if (!r.ok) {
        const msg =
          json && json.error && json.error.message ? json.error.message : 'YouTube API request failed';
        return res.status(r.status >= 400 ? r.status : 502).json({ error: msg });
      }
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
    res.json({ query: rawQ, regionCode: region, items });
  } catch (e) {
    res.status(500).json({ error: e && e.message ? e.message : 'YouTube search failed' });
  }
});

/**
 * Gemini-powered "Trending Topics" idea exploration.
 *
 * Body:
 * - keyword: string (required)
 * - parent: string (optional) - when present, generates sub-ideas for that node
 * - exclusions: string[] (optional) - topics to avoid repeating
 * - geminiApiKey: string (optional) - caller's Gemini key for deeper tree expansion (uses server key if omitted)
 *
 * Response:
 * { items: string[] } where items.length <= 5
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
 * Body: { amount, currency?, receipt?, notes? }
 * amount: number in smallest unit (e.g. 999 for $9.99 in cents if you use USD)
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
 * Body: { planKey, customer_email?, customer_name? }
 * planKey: 'starter' | 'professional' | 'ultimate'
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
 * Body: { order_id, payment_id, signature } or { razorpay_order_id, razorpay_payment_id, razorpay_signature }
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
 * Verify subscription payment (first charge). Optional: use webhooks in production.
 * Body: { subscription_id, payment_id, signature }
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

function startServer(port) {
  const server = app.listen(port, () => {
    console.log('Viralzaps backend running on http://localhost:' + port);
    if (port !== PORT) console.warn('Update razorpay-config.js apiBaseUrl to http://localhost:' + port);
    if (!razorpay) console.warn('Razorpay keys missing – set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
    if (!googleSheetsConfigured()) {
      console.warn(
        'Google Sheets payment log disabled – set GOOGLE_APPS_SCRIPT_WEBHOOK_URL + GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET (see backend/google-apps-script-payment-webhook.gs), or service account JSON + share sheet.'
      );
    }
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port < 4010) {
      console.warn('Port ' + port + ' in use, trying ' + (port + 1) + '...');
      startServer(port + 1);
    } else {
      throw err;
    }
  });
}
startServer(PORT);
