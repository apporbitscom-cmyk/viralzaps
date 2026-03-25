/**
 * Firebase — no API keys in this file. Backend serves config from backend/firebase.env via GET /api/firebase-config.
 * Load razorpay-config.js before this script so apiBaseUrl is set.
 */

function isLoopbackHostname(hostname) {
    if (!hostname) return false;
    return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '[::1]'
    );
}

function getFirebaseApiBaseUrl() {
    if (typeof window !== 'undefined' && window.RAZORPAY_CONFIG && window.RAZORPAY_CONFIG.apiBaseUrl) {
        var raw = String(window.RAZORPAY_CONFIG.apiBaseUrl).replace(/\/$/, '');
        if (raw.indexOf('YOUR-BACKEND') !== -1) return '';
        return raw;
    }
    if (typeof location !== 'undefined' && isLoopbackHostname(location.hostname)) {
        return 'http://localhost:4000';
    }
    return '';
}

function isSupportedAuthEnvironment() {
    if (typeof location === 'undefined') return false;
    const protocol = location.protocol;
    if (!/^(https?:|chrome-extension:)$/.test(protocol)) return false;
    try {
        if (typeof localStorage === 'undefined') return false;
        localStorage.setItem('_auth_check', '1');
        localStorage.removeItem('_auth_check');
        return true;
    } catch (e) {
        return false;
    }
}

let app;
let auth;
let provider;
let firebaseConfig = null;
let firebaseInitPromise = null;
let firebaseInitError = null;

function getApiBaseUrlCandidates() {
    var list = [];
    var primary = getFirebaseApiBaseUrl();
    if (primary) list.push(primary);
    if (typeof location !== 'undefined' && isLoopbackHostname(location.hostname)) {
        var p;
        for (p = 4000; p <= 4010; p++) {
            var b = 'http://localhost:' + p;
            if (list.indexOf(b) === -1) list.push(b);
        }
    }
    return list;
}

function applyResolvedApiBaseUrl(base) {
    if (!base || typeof window === 'undefined') return;
    if (window.RAZORPAY_CONFIG) window.RAZORPAY_CONFIG.apiBaseUrl = base;
    window.VIRALZAPS_PUBLIC_CONFIG = window.VIRALZAPS_PUBLIC_CONFIG || {};
    window.VIRALZAPS_PUBLIC_CONFIG.apiBaseUrl = base;
    if (typeof window.reloadViralzapsYoutubeApiKey === 'function') {
        window.reloadViralzapsYoutubeApiKey();
    }
}

async function initFirebaseFromBackend() {
    firebaseInitError = null;
    if (typeof firebase === 'undefined' || !isSupportedAuthEnvironment()) return;
    var candidates = getApiBaseUrlCandidates();
    if (!candidates.length) {
        firebaseInitError =
            'Backend URL is not set. Open the site on localhost or set RAZORPAY_CONFIG.apiBaseUrl.';
        return;
    }
    var r = null;
    var sawNetworkError = false;
    var i;
    for (i = 0; i < candidates.length; i++) {
        var base = candidates[i];
        try {
            var resp = await fetch(base + '/api/firebase-config', { credentials: 'include' });
            r = resp;
            if (resp.status === 404) {
                continue;
            }
            applyResolvedApiBaseUrl(base);
            break;
        } catch (e) {
            sawNetworkError = true;
            continue;
        }
    }
    if (!r) {
        firebaseInitError = sawNetworkError
            ? 'Could not reach the Viralzaps API. Start the backend: cd backend && npm start (default port 4000).'
            : 'No API base URL to try. Set RAZORPAY_CONFIG.apiBaseUrl or open the app on localhost.';
        return;
    }
    if (!r.ok) {
        var errBody = {};
        try {
            errBody = await r.json();
        } catch (e2) {
            /* ignore */
        }
        var serverMsg = errBody && errBody.error ? String(errBody.error) : '';
        if (r.status === 404) {
            firebaseInitError =
                'GET /api/firebase-config returned 404 on every port tried (4000–4010). Something else may be bound to 4000, or the backend is an old build. Fix: stop stray processes, then from viralzap/backend run npm start using the latest server.js.';
            return;
        }
        if (r.status === 503) {
            firebaseInitError =
                serverMsg ||
                'Set FIREBASE_API_KEY and FIREBASE_PROJECT_ID in backend/firebase.env, then restart the API.';
        } else {
            firebaseInitError = serverMsg || 'Could not load Firebase config (HTTP ' + r.status + ').';
        }
        return;
    }
    var data;
    try {
        data = await r.json();
    } catch (e) {
        firebaseInitError = 'Invalid response from /api/firebase-config.';
        return;
    }
    var cfg = data.firebaseConfig || data;
    if (!cfg || !cfg.apiKey) {
        firebaseInitError = 'Firebase config response was missing apiKey.';
        return;
    }
    firebaseConfig = cfg;
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
}

if (typeof firebase !== 'undefined' && isSupportedAuthEnvironment()) {
    firebaseInitPromise = initFirebaseFromBackend();
}

async function ensureFirebaseReady() {
    if (firebaseInitPromise) {
        try {
            await firebaseInitPromise;
        } catch (e) {
            /* ignore */
        }
    }
}

function getAuthUnsupportedReason() {
    if (typeof location !== 'undefined' && location.protocol === 'file:') {
        return 'Firebase Auth requires the app to run over HTTP. Use a local server (e.g. npx serve) instead of opening the file directly.';
    }
    if (!isSupportedAuthEnvironment()) {
        return 'Web storage is disabled or this environment is not supported.';
    }
    return null;
}

function isFirebaseConfigured() {
    return (
        typeof auth !== 'undefined' &&
        auth != null &&
        firebaseConfig != null &&
        !!firebaseConfig.apiKey
    );
}

function getFirebaseAuthUnavailableReason(options) {
    if (isFirebaseConfigured()) return null;
    var google = options && options.google;
    var suffix = google
        ? ' In Firebase Console: Authentication → Sign-in method → enable Google.'
        : '';
    if (firebaseInitError) return firebaseInitError + suffix;
    return (
        'Firebase did not initialize. Set FIREBASE_* in backend/firebase.env, run the API, and enable sign-in in the Firebase Console.' +
        suffix
    );
}

async function signUpWithEmail(email, password) {
    await ensureFirebaseReady();
    if (!auth) throw new Error('Firebase Auth not initialized');
    return auth.createUserWithEmailAndPassword(email, password);
}

async function signInWithEmail(email, password) {
    await ensureFirebaseReady();
    if (!auth) throw new Error('Firebase Auth not initialized');
    return auth.signInWithEmailAndPassword(email, password);
}

async function signInWithGoogle() {
    await ensureFirebaseReady();
    if (!auth || !provider) throw new Error('Firebase Auth not initialized');
    return auth.signInWithPopup(provider);
}

function getGoogleRedirectResult() {
    if (!auth) {
        if (firebaseInitPromise) {
            return firebaseInitPromise.then(function () {
                return auth ? auth.getRedirectResult() : Promise.resolve(null);
            });
        }
        return Promise.resolve(null);
    }
    return auth.getRedirectResult();
}

async function signOut() {
    await ensureFirebaseReady();
    if (!auth) throw new Error('Firebase Auth not initialized');
    return auth.signOut();
}

function getCurrentUser() {
    return auth ? auth.currentUser : null;
}

function onAuthStateChanged(callback) {
    if (!firebaseInitPromise) {
        try {
            callback(null);
        } catch (e) {
            /* ignore */
        }
        return function () {};
    }
    var dispose = null;
    var ready = firebaseInitPromise.then(function () {
        if (auth) {
            dispose = auth.onAuthStateChanged(callback);
        } else {
            try {
                callback(null);
            } catch (e) {
                /* ignore */
            }
        }
    });
    return function () {
        ready.then(function () {
            if (dispose) dispose();
        });
    };
}

async function sendPasswordResetEmail(email) {
    await ensureFirebaseReady();
    if (!auth) throw new Error('Firebase Auth not initialized');
    return auth.sendPasswordResetEmail(email);
}
