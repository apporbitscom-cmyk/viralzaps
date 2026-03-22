/**
 * Firebase Configuration & User Authentication
 *
 * Setup:
 * 1. Create a project at https://console.firebase.google.com
 * 2. Enable Authentication > Sign-in method: Email/Password and Google
 * 3. Replace the firebaseConfig object below with your project's config
 *    (Project Settings > General > Your apps > SDK setup and configuration)
 *
 * Production (Google OAuth):
 * 4. In Firebase Console > Authentication: click "Get started" if you see it (required once per project).
 * 5. Authentication > Sign-in method: enable "Google" (and set support email). Save.
 * 6. Authentication > Settings > Authorized domains: add your production domain if needed; localhost is listed by default.
 */

// Viralzaps app (Firebase project id unchanged)
const firebaseConfig = {
  apiKey: "AIzaSyBm2Q9p3AZL9HyMHzBuM-DBSC4w1BPdUzk",
  authDomain: "viralzap-5f04e.firebaseapp.com",
  projectId: "viralzap-5f04e",
  storageBucket: "viralzap-5f04e.firebasestorage.app",
  messagingSenderId: "434254312524",
  appId: "1:434254312524:web:3108d448c682424d50b0e9",
  measurementId: "G-7NWEY1R0L9"
};

// Initialize Firebase (requires Firebase SDK script loaded first)
// Firebase Auth only works over http://, https:// or chrome-extension:// (not file://)
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

let app, auth, provider;

if (typeof firebase !== 'undefined' && isSupportedAuthEnvironment()) {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    provider = new firebase.auth.GoogleAuthProvider();

    // Production OAuth: always show account picker (avoids silent re-use of wrong account)
    provider.setCustomParameters({
        prompt: 'select_account'
    });
}

/** Returns a short message if auth cannot run in this environment (e.g. file:// or no storage); otherwise null */
function getAuthUnsupportedReason() {
    if (typeof location !== 'undefined' && location.protocol === 'file:') {
        return 'Firebase Auth requires the app to run over HTTP. Open the app via a local server (e.g. run in terminal: npx serve, or use Live Server in VS Code) instead of opening the HTML file directly.';
    }
    if (!isSupportedAuthEnvironment()) {
        return 'Web storage is disabled or this environment is not supported. Enable cookies/local storage or use a normal browser window.';
    }
    return null;
}

/** True if Firebase Auth is initialized with a real config (not placeholders) */
function isFirebaseConfigured() {
    return typeof auth !== 'undefined' && auth != null &&
        firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';
}

/**
 * Create a new user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<firebase.auth.UserCredential>}
 */
async function signUpWithEmail(email, password) {
    if (!auth) throw new Error('Firebase Auth not initialized');
    return auth.createUserWithEmailAndPassword(email, password);
}

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<firebase.auth.UserCredential>}
 */
async function signInWithEmail(email, password) {
    if (!auth) throw new Error('Firebase Auth not initialized');
    return auth.signInWithEmailAndPassword(email, password);
}

/**
 * Sign in with Google (popup). For production, ensure your domain is in
 * Firebase Console > Authentication > Settings > Authorized domains.
 * @returns {Promise<firebase.auth.UserCredential>}
 */
async function signInWithGoogle() {
    if (!auth || !provider) throw new Error('Firebase Auth not initialized');
    return auth.signInWithPopup(provider);
}

/**
 * Check for redirect result (use after page load if you offer signInWithRedirect as fallback).
 * Call once on app init: handleGoogleRedirectResult().then(...)
 * @returns {Promise<firebase.auth.UserCredential|null>}
 */
function getGoogleRedirectResult() {
    if (!auth) return Promise.resolve(null);
    return auth.getRedirectResult();
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
async function signOut() {
    if (!auth) throw new Error('Firebase Auth not initialized');
    return auth.signOut();
}

/**
 * Get the currently signed-in user (or null)
 * @returns {firebase.User|null}
 */
function getCurrentUser() {
    return auth ? auth.currentUser : null;
}

/**
 * Listen for auth state changes (signed in / signed out)
 * @param {(user: firebase.User|null) => void} callback
 * @returns {firebase.Unsubscribe}
 */
function onAuthStateChanged(callback) {
    if (!auth) return () => {};
    return auth.onAuthStateChanged(callback);
}

/**
 * Send password reset email
 * @param {string} email
 * @returns {Promise<void>}
 */
async function sendPasswordResetEmail(email) {
    if (!auth) throw new Error('Firebase Auth not initialized');
    return auth.sendPasswordResetEmail(email);
}
