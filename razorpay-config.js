/**
 * Razorpay frontend config.
 * Key ID only – Key Secret stays on the backend (see backend/.env).
 * For production: set apiBaseUrl to your deployed backend URL (see HOSTING.md).
 */
(function () {
  var isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  window.RAZORPAY_CONFIG = {
    keyId: 'rzp_test_SNPPB5DHPVeZNH',
    apiBaseUrl: isLocal
      ? 'http://localhost:4000'
      : (window.RAZORPAY_API_BASE_URL || 'https://YOUR-BACKEND-URL.railway.app')
  };
})();
