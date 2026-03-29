# Viralzaps Backend (Razorpay)

This server handles **Razorpay** payments for:

- **Subscriptions** – Starter, Professional, Ultimate (recurring)
- **One-time orders** – Credit packs (Boost 250, Creator 750)

## Setup

1. **Razorpay account**  
   Sign up at [razorpay.com](https://razorpay.com) and get your **Key ID** and **Key Secret** from [Dashboard → API Keys](https://dashboard.razorpay.com/app/keys).

2. **Subscription plans**  
   In Razorpay Dashboard go to **Subscriptions → Plans** and create three plans (e.g. monthly billing):
   - Starter: $25/month (or your price)
   - Professional: $45/month
   - Ultimate: $80/month  

   Copy each Plan ID (e.g. `plan_xxxx`).

3. **Backend env**  
   Copy `.env.example` to `.env` and set:

   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxx
   RAZORPAY_KEY_SECRET=xxxx
   RAZORPAY_PLAN_STARTER=plan_xxxx
   RAZORPAY_PLAN_PROFESSIONAL=plan_xxxx
   RAZORPAY_PLAN_ULTIMATE=plan_xxxx
   PORT=4000
   ```

4. **Google Sheet — payment log (optional)**  
   After a successful Razorpay verification, the backend appends a row to your [payment spreadsheet](https://docs.google.com/spreadsheets/d/1DvuVVXrK_pIgflAWImM497l0Pwe_h-EJm20neNZv0PM/edit) (timestamp, name, email, payment ID, amount, etc.).

   **If your organization blocks service account keys** (`iam.disableServiceAccountKeyCreation`), use **Google Apps Script** (no JSON key):

   - Open that spreadsheet → **Extensions** → **Apps Script**.
   - Paste the code from `backend/google-apps-script-payment-webhook.gs`.
   - **Project Settings** (gear) → **Script properties** → add property `WEBHOOK_SECRET` with a long random string (e.g. 32+ characters).
   - **Deploy** → **New deployment** → type **Web app** → **Execute as: Me** → **Who has access: Anyone** → **Deploy** and copy the **Web app URL** (ends with `/exec`).
   - In `backend/.env`:  
     `GOOGLE_APPS_SCRIPT_WEBHOOK_URL=https://script.google.com/macros/s/.../exec`  
     `GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET=` (same value as `WEBHOOK_SECRET` in Apps Script)

   **Alternative — service account JSON** (only if your org allows key creation):

   - Enable **Google Sheets API**, create a service account, download JSON, share the sheet with the service account `client_email` (**Editor**).
   - Set `GOOGLE_APPLICATION_CREDENTIALS` or `GOOGLE_SERVICE_ACCOUNT_JSON` in `.env`. Optional: `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB`.

5. **Frontend config**  
   In the project root, edit `razorpay-config.js` (Razorpay **Key ID**).  
   For local dev, set the API base URL once in **`api-base-url.js`** (`VIRALZAPS_LOCAL_API_BASE_URL`, default port `4000`).

6. **Run backend**

   ```bash
   cd backend
   npm install
   npm start
   ```

   Frontend: run your app (e.g. `npx serve . -l 3000`) and open the dashboard. Use **Settings → Subscription** (Compare Plans) and **Settings → Usage** (Purchase on credit packages) to test.

## API

- `POST /api/create-order` – Body: `{ amount, currency?, receipt?, notes? }`. Returns `{ orderId, amount, currency }`.
- `POST /api/create-subscription` – Body: `{ planKey: 'starter'|'professional'|'ultimate', customer_email?, customer_name? }`. Returns `{ subscriptionId, planName }`.
- `POST /api/verify-payment` – Body: `{ order_id, payment_id, signature, customer_name?, customer_email? }`. Returns `{ verified }`. On success, appends a row to the configured Google Sheet when credentials are set.
- `POST /api/verify-subscription-payment` – Body: `{ subscription_id, payment_id, signature, customer_name?, customer_email? }`. Returns `{ verified }`. Same sheet logging when configured.

**Note:** In production, use **Razorpay Webhooks** to update subscription status (activated, charged, cancelled) and keep your database in sync. This backend only creates orders/subscriptions and verifies the first payment on the client.
