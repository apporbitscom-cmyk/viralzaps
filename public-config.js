/**
 * Public runtime configuration for frontend-only values.
 *
 * Safe to keep in repo (no private secrets here).
 * For production, change API base URLs to your deployed backend.
 */
(function () {
  var isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  window.VIRALZAP_PUBLIC_CONFIG = {
    apiBaseUrl: isLocal
      ? 'http://localhost:4000'
      : 'https://YOUR-BACKEND-URL.com'
  };

  // Keep existing compatibility for Razorpay config.
  if (!window.RAZORPAY_API_BASE_URL) {
    window.RAZORPAY_API_BASE_URL = window.VIRALZAP_PUBLIC_CONFIG.apiBaseUrl;
  }
})();

