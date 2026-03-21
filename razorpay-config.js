/**
 * Razorpay frontend config.
 * Key ID only – Key Secret stays on the backend (see backend/.env).
 * For production: set apiBaseUrl to your deployed backend URL (see HOSTING.md).
 */
(function () {
  var isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  var cfg = (typeof window !== 'undefined' && window.VIRALZAP_PUBLIC_CONFIG)
    ? window.VIRALZAP_PUBLIC_CONFIG
    : null;

  window.RAZORPAY_CONFIG = {
    // Use your own publishable Razorpay key id (safe for frontend).
    keyId: 'YOUR_RAZORPAY_KEY_ID',
    apiBaseUrl: cfg && cfg.apiBaseUrl
      ? cfg.apiBaseUrl
      : (isLocal ? 'http://localhost:4000' : (window.RAZORPAY_API_BASE_URL || 'https://YOUR-BACKEND-URL.com'))
  };
})();
