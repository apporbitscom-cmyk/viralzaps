
/**
 * Razorpay frontend config.
 * Key ID only – Key Secret stays on the backend (see backend/.env).
 * Production API: same origin as frontend (window.location.origin).
 */
(function () {
  var h = typeof window !== 'undefined' ? window.location.hostname : '';
  var isLocal =
    h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]';

  window.RAZORPAY_CONFIG = {
    keyId: 'rzp_test_SNPPB5DHPVeZNH',
    apiBaseUrl: isLocal
      ? (window.VIRALZAPS_LOCAL_API_BASE_URL || '')
      : window.location.origin
  };
})();
