/**
 * Razorpay frontend config.
 * Key ID only – Key Secret stays on the backend (see backend/.env).
 * For production: set apiBaseUrl to your deployed backend URL (see HOSTING.md).
 */
(function () {
  var h = typeof window !== 'undefined' ? window.location.hostname : '';
  var isLocal =
    h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]';
  window.RAZORPAY_CONFIG = {
    keyId: 'rzp_test_SNPPB5DHPVeZNH',
    apiBaseUrl: isLocal
      ? (window.VIRALZAPS_LOCAL_API_BASE_URL || '')
      : (window.RAZORPAY_API_BASE_URL || 'https://YOUR-BACKEND-URL.railway.app')
  };
})();
