/**
 * Razorpay frontend config.
 * Key ID only – Key Secret stays on the backend (see backend/.env).
 * For production: set apiBaseUrl to your deployed backend URL (see HOSTING.md).
 */
(function () {
  var h = typeof window !== 'undefined' ? window.location.hostname : '';
  var origin = typeof window !== 'undefined' ? window.location.origin : '';
  var isLocal =
    h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]';
  var customBase =
    typeof window !== 'undefined' && window.RAZORPAY_API_BASE_URL
      ? String(window.RAZORPAY_API_BASE_URL).replace(/\/$/, '')
      : '';
  window.RAZORPAY_CONFIG = {
    keyId: 'rzp_live_STnApImE1yR966',
    apiBaseUrl: isLocal
      ? 'http://localhost:4000'
      : (customBase || origin)
  };
})();
