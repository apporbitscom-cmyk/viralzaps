# Viralzap Backend (Razorpay)

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

4. **Frontend config**  
   In the project root, edit `razorpay-config.js`:
   - Set `keyId` to your Razorpay **Key ID** (same as above).
   - Set `apiBaseUrl` to your backend URL (e.g. `http://localhost:4000` for local dev).

5. **Run backend**

   ```bash
   cd backend
   npm install
   npm start
   ```

   Frontend: run your app (e.g. `npx serve . -l 3000`) and open the dashboard. Use **Settings → Subscription** (Compare Plans) and **Settings → Usage** (Purchase on credit packages) to test.

## API

- `POST /api/create-order` – Body: `{ amount, currency?, receipt?, notes? }`. Returns `{ orderId, amount, currency }`.
- `POST /api/create-subscription` – Body: `{ planKey: 'starter'|'professional'|'ultimate', customer_email?, customer_name? }`. Returns `{ subscriptionId, planName }`.
- `POST /api/verify-payment` – Body: `{ order_id, payment_id, signature }`. Returns `{ verified }`.
- `POST /api/verify-subscription-payment` – Body: `{ subscription_id, payment_id, signature }`. Returns `{ verified }`.

**Note:** In production, use **Razorpay Webhooks** to update subscription status (activated, charged, cancelled) and keep your database in sync. This backend only creates orders/subscriptions and verifies the first payment on the client.
