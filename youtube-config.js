/**
 * Loads YOUTUBE_API_KEY from the backend GET /api/youtube-config.
 * Must try every likely API port: Firebase resolves the real port async (often 4001), but this
 * script runs sync — we probe localhost ports around VIRALZAPS_LOCAL_API_BASE_URL and reload after Firebase sets VIRALZAPS_PUBLIC_CONFIG.
 * Load razorpay-config.js and firebase-config.js before this file.
 */
(function () {
    function getCandidateApiBases() {
        var list = [];
        var seen = {};
        function add(u) {
            if (!u || typeof u !== 'string') return;
            var raw = u.replace(/\/$/, '');
            if (raw.indexOf('YOUR-BACKEND') !== -1) return;
            if (seen[raw]) return;
            seen[raw] = true;
            list.push(raw);
        }
        if (typeof window !== 'undefined' && window.VIRALZAPS_PUBLIC_CONFIG && window.VIRALZAPS_PUBLIC_CONFIG.apiBaseUrl) {
            add(String(window.VIRALZAPS_PUBLIC_CONFIG.apiBaseUrl));
        }
        if (typeof window !== 'undefined' && window.RAZORPAY_CONFIG && window.RAZORPAY_CONFIG.apiBaseUrl) {
            add(String(window.RAZORPAY_CONFIG.apiBaseUrl));
        }
        var h = typeof location !== 'undefined' ? location.hostname : '';
        if (
            h === 'localhost' ||
            h === '127.0.0.1' ||
            h === '::1' ||
            h === '[::1]'
        ) {
            var rng =
                typeof window !== 'undefined' && typeof window.viralzapsLocalBackendPortRange === 'function'
                    ? window.viralzapsLocalBackendPortRange()
                    : { start: 4000, end: 4010 };
            var p;
            for (p = rng.start; p <= rng.end; p++) {
                add('http://localhost:' + p);
            }
        }
        return list;
    }
    function tryLoadKey(apiBase) {
        try {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', apiBase + '/api/youtube-config', false);
            xhr.withCredentials = true;
            xhr.send(null);
            if (xhr.status === 200) {
                var j = JSON.parse(xhr.responseText);
                if (j && j.youtubeApiKey && String(j.youtubeApiKey).trim().length > 10) {
                    window.YOUTUBE_API_KEY = String(j.youtubeApiKey).trim();
                    return true;
                }
            }
        } catch (e) {
            /* try next */
        }
        return false;
    }
    function loadYoutubeApiKeyFromBackend() {
        window.YOUTUBE_API_KEY = '';
        var bases = getCandidateApiBases();
        var i;
        for (i = 0; i < bases.length; i++) {
            if (tryLoadKey(bases[i])) {
                return true;
            }
        }
        return false;
    }
    window.reloadViralzapsYoutubeApiKey = loadYoutubeApiKeyFromBackend;
    loadYoutubeApiKeyFromBackend();
})();
