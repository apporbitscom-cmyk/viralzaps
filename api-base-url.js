/**
 * Single place to set the local dev API base URL (change the port here if needed).
 * Overwritten by `npm run build` — production URL comes from VIRALZAPS_API_BASE_URL on the host.
 */
(function () {
  if (typeof window === 'undefined') return;
  window.VIRALZAPS_LOCAL_API_BASE_URL = 'http://localhost:4000';
  window.RAZORPAY_API_BASE_URL = '';
  window.viralzapsLocalBackendPortRange = function () {
    var base = String(window.VIRALZAPS_LOCAL_API_BASE_URL || '');
    var m = base.match(/^https?:\/\/[^:]+:(\d+)/);
    var start = m ? parseInt(m[1], 10) : 4000;
    if (isNaN(start)) start = 4000;
    return { start: start, end: start + 10 };
  };
})();
