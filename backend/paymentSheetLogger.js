/**
 * Append verified payment rows to Google Sheets.
 *
 * Option A — No service account keys (works when org policy blocks keys):
 *   GOOGLE_APPS_SCRIPT_WEBHOOK_URL + GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET
 *   See google-apps-script-payment-webhook.gs
 *
 * Option B — Google Sheets API + service account JSON:
 *   GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON
 *   Share the spreadsheet with the service account email (Editor).
 */

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const HEADER_ROW = [
  'Timestamp (UTC)',
  'Type',
  'Customer name',
  'Email',
  'Payment ID (transaction)',
  'Order / subscription ID',
  'Amount',
  'Currency',
  'Description',
  'Payment method',
  'Receipt',
  'Order notes'
];

function getSpreadsheetId() {
  return (
    process.env.GOOGLE_SHEET_ID ||
    process.env.GOOGLE_SPREADSHEET_ID ||
    '1DvuVVXrK_pIgflAWImM497l0Pwe_h-EJm20neNZv0PM'
  ).trim();
}

function getTabName() {
  return (process.env.GOOGLE_SHEET_TAB || 'Sheet1').trim() || 'Sheet1';
}

function hasWebhook() {
  const u = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL;
  const s = process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET;
  return !!(u && String(u).trim() && s && String(s).trim().length >= 8);
}

function hasServiceAccountCredentials() {
  return !!(
    (process.env.GOOGLE_APPLICATION_CREDENTIALS && String(process.env.GOOGLE_APPLICATION_CREDENTIALS).trim()) ||
    (process.env.GOOGLE_SERVICE_ACCOUNT_JSON && String(process.env.GOOGLE_SERVICE_ACCOUNT_JSON).trim().length > 20)
  );
}

function isConfigured() {
  if (hasWebhook()) return true;
  return hasServiceAccountCredentials() && !!getSpreadsheetId();
}

async function appendViaWebhook(row) {
  const url = String(process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_URL || '').trim();
  const secret = String(process.env.GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET || '').trim();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret,
      row,
      sheetName: getTabName()
    })
  });
  const text = await res.text();
  let j;
  try {
    j = JSON.parse(text);
  } catch (_) {
    throw new Error('Sheets webhook HTTP ' + res.status + ': ' + text.slice(0, 300));
  }
  if (!j.ok) {
    throw new Error(j.error || 'webhook rejected');
  }
}

async function getSheetsClient() {
  const { google } = require('googleapis');
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  let auth;
  if (keyFile && String(keyFile).trim()) {
    auth = new google.auth.GoogleAuth({
      keyFile: String(keyFile).trim(),
      scopes: SCOPES
    });
  } else if (jsonEnv && String(jsonEnv).trim().length > 20) {
    const credentials = JSON.parse(String(jsonEnv).trim());
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES
    });
  } else {
    return null;
  }
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

function escapeTabName(tab) {
  return `'${String(tab).replace(/'/g, "''")}'`;
}

async function ensureHeaderRow(sheets, spreadsheetId, tabName) {
  const range = `${escapeTabName(tabName)}!A1:L1`;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  const row = res.data.values && res.data.values[0];
  const empty = !row || !row.length || !String(row[0] || '').trim();
  if (empty) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${escapeTabName(tabName)}!A1:L1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [HEADER_ROW] }
    });
  }
}

/**
 * @param {string[]} row - one row of values (same length as HEADER_ROW)
 */
async function appendPaymentRecord(row) {
  if (hasWebhook()) {
    await appendViaWebhook(row);
    return;
  }
  if (!hasServiceAccountCredentials() || !getSpreadsheetId()) return;
  const sheets = await getSheetsClient();
  if (!sheets) return;
  const spreadsheetId = getSpreadsheetId();
  const tabName = getTabName();
  await ensureHeaderRow(sheets, spreadsheetId, tabName);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${escapeTabName(tabName)}!A:L`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [row] }
  });
}

function safeNotes(notes) {
  if (!notes || typeof notes !== 'object') return '';
  try {
    return JSON.stringify(notes);
  } catch (_) {
    return String(notes);
  }
}

function orderTypeLabel(notes) {
  if (!notes || typeof notes !== 'object') return 'order';
  if (notes.plan) return 'subscription_plan';
  if (notes.credits) return 'credit_pack';
  return 'order';
}

function describeFromNotes(notes) {
  if (!notes || typeof notes !== 'object') return '';
  if (notes.plan) return 'Subscription: ' + String(notes.plan);
  if (notes.credits) return 'Credits pack: ' + String(notes.credits);
  return '';
}

/**
 * Log a successful order payment (credit packs, subscription-style orders via create-order).
 */
async function logOrderPaymentFromRazorpay(razorpay, { orderId, paymentId, customerName, customerEmail }) {
  if (!isConfigured() || !razorpay) return;
  try {
    const [order, payment] = await Promise.all([
      razorpay.orders.fetch(orderId),
      razorpay.payments.fetch(paymentId)
    ]);
    const o = order || {};
    const p = payment || {};
    const notes = o.notes || {};
    const email =
      p.email ||
      customerEmail ||
      notes.customer_email ||
      notes.user_email ||
      '';
    const name =
      customerName ||
      p.name ||
      p.customer_name ||
      notes.customer_name ||
      '';
    const method = p.method || '';
    const receipt = o.receipt || '';
    const currency = o.currency || p.currency || '';
    const amountRaw = o.amount != null ? o.amount : p.amount;
    const amountDisplay =
      amountRaw != null && currency
        ? (currency === 'INR' ? '₹' + (Number(amountRaw) / 100).toFixed(2) : (Number(amountRaw) / 100).toFixed(2) + ' ' + currency)
        : amountRaw != null
          ? String(amountRaw)
          : '';
    const desc =
      describeFromNotes(notes) ||
      (p.description || '') ||
      '';
    const row = [
      new Date().toISOString(),
      orderTypeLabel(notes),
      name,
      email,
      paymentId,
      orderId,
      amountDisplay,
      currency,
      desc,
      method,
      receipt,
      safeNotes(notes)
    ];
    await appendPaymentRecord(row);
  } catch (err) {
    console.error('Google Sheet payment log failed:', err && err.message ? err.message : err);
  }
}

/**
 * Log subscription flow verified via payment_id + subscription_id (Razorpay subscriptions API).
 */
async function logSubscriptionPaymentFromRazorpay(razorpay, { subscriptionId, paymentId, customerName, customerEmail }) {
  if (!isConfigured() || !razorpay) return;
  try {
    const [sub, payment] = await Promise.all([
      razorpay.subscriptions.fetch(subscriptionId),
      razorpay.payments.fetch(paymentId)
    ]);
    const s = sub || {};
    const p = payment || {};
    const notes = s.notes || {};
    const email = p.email || customerEmail || notes.customer_email || '';
    const name = customerName || p.name || p.customer_name || '';
    const method = p.method || '';
    const currency = p.currency || '';
    const amountRaw = p.amount;
    const amountDisplay =
      amountRaw != null && currency
        ? (currency === 'INR' ? '₹' + (Number(amountRaw) / 100).toFixed(2) : (Number(amountRaw) / 100).toFixed(2) + ' ' + currency)
        : amountRaw != null
          ? String(amountRaw)
          : '';
    const planId = s.plan_id || '';
    const row = [
      new Date().toISOString(),
      'subscription_charge',
      name,
      email,
      paymentId,
      subscriptionId,
      amountDisplay,
      currency,
      planId ? 'Plan: ' + planId : 'Subscription payment',
      method,
      '',
      safeNotes(notes)
    ];
    await appendPaymentRecord(row);
  } catch (err) {
    console.error('Google Sheet subscription log failed:', err && err.message ? err.message : err);
  }
}

module.exports = {
  isConfigured,
  hasWebhook,
  appendPaymentRecord,
  logOrderPaymentFromRazorpay,
  logSubscriptionPaymentFromRazorpay,
  getSpreadsheetId,
  getTabName
};
