// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', currentTheme);
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// Hash links: modals, login/signup, or smooth scroll to sections
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#privacy') {
            e.preventDefault();
            openPrivacyModal();
            return;
        }
        if (href === '#terms') {
            e.preventDefault();
            openTermsModal();
            return;
        }
        if (href === '#login') {
            e.preventDefault();
            closeSignupModal();
            openLoginModal();
            return;
        }
        if (href === '#signup') {
            e.preventDefault();
            closeLoginModal();
            openSignupModal();
            return;
        }
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

const privacyModal = document.getElementById('privacy-modal');
const privacyOverlay = document.getElementById('privacy-overlay');
const privacyClose = document.getElementById('privacy-close');

const termsModal = document.getElementById('terms-modal');
const termsOverlay = document.getElementById('terms-overlay');
const termsClose = document.getElementById('terms-close');

function openPrivacyModal() {
    if (!privacyModal) return;
    privacyModal.classList.add('active');
    privacyModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closePrivacyModal() {
    if (!privacyModal) return;
    privacyModal.classList.remove('active');
    privacyModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function openTermsModal() {
    if (!termsModal) return;
    termsModal.classList.add('active');
    termsModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeTermsModal() {
    if (!termsModal) return;
    termsModal.classList.remove('active');
    termsModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

if (privacyClose) {
    privacyClose.addEventListener('click', closePrivacyModal);
}
if (privacyOverlay) {
    privacyOverlay.addEventListener('click', closePrivacyModal);
}

if (termsClose) {
    termsClose.addEventListener('click', closeTermsModal);
}
if (termsOverlay) {
    termsOverlay.addEventListener('click', closeTermsModal);
}

document.addEventListener('click', (e) => {
    const a = e.target.closest('a.legal-internal-privacy-link');
    if (!a || a.getAttribute('href') !== '#privacy') return;
    e.preventDefault();
    closeTermsModal();
    openPrivacyModal();
});

// FAQ Accordion
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all FAQ items
        faqItems.forEach(faqItem => {
            faqItem.classList.remove('active');
        });
        
        // Open clicked item if it wasn't active
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// Scroll Progress Indicator - Removed to match original UI

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll('.feature-card, .tool-card, .pricing-card');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Form validation (if forms are added later)
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Add loading states to buttons
document.querySelectorAll('.btn-primary, .btn-hero, .btn-plan').forEach(button => {
    button.addEventListener('click', function(e) {
        if (this.href && this.href.includes('#')) {
            // Only add loading state for non-anchor links
            return;
        }
        
        const originalText = this.textContent;
        this.textContent = 'Loading...';
        this.disabled = true;
        
        // Reset after 2 seconds (for demo purposes)
        setTimeout(() => {
            this.textContent = originalText;
            this.disabled = false;
        }, 2000);
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (navLinks && navLinks.classList.contains('active')) {
        if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        }
    }
});

// Add active state to navigation links based on scroll position
const sections = document.querySelectorAll('section[id]');
const navLinksList = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinksList.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

console.log('Viralzaps website loaded successfully!');

// Login Modal Functionality
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const loginClose = document.getElementById('login-close');
const signupClose = document.getElementById('signup-close');
const loginOverlay = document.getElementById('login-overlay');
const signupOverlay = document.getElementById('signup-overlay');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
// Sign up / Sign in links use href="#signup" / href="#login" (handled in hash router above)

// Close modals
if (loginClose) {
    loginClose.addEventListener('click', closeLoginModal);
}

if (signupClose) {
    signupClose.addEventListener('click', closeSignupModal);
}

if (loginOverlay) {
    loginOverlay.addEventListener('click', closeLoginModal);
}

if (signupOverlay) {
    signupOverlay.addEventListener('click', closeSignupModal);
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (termsModal && termsModal.classList.contains('active')) {
            closeTermsModal();
            return;
        }
        if (privacyModal && privacyModal.classList.contains('active')) {
            closePrivacyModal();
            return;
        }
        closeLoginModal();
        closeSignupModal();
    }
});

function openLoginModal() {
    if (loginModal) {
        loginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLoginModal() {
    if (loginModal) {
        loginModal.classList.remove('active');
        document.body.style.overflow = '';
        resetLoginForm();
    }
}

function openSignupModal() {
    if (signupModal) {
        signupModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSignupModal() {
    if (signupModal) {
        signupModal.classList.remove('active');
        document.body.style.overflow = '';
        resetSignupForm();
    }
}

function resetLoginForm() {
    if (loginForm) {
        loginForm.reset();
        clearLoginErrors();
    }
}

function resetSignupForm() {
    if (signupForm) {
        signupForm.reset();
        clearSignupErrors();
        resetPasswordStrength();
    }
}

function clearLoginErrors() {
    const errors = document.querySelectorAll('#login-form .error-message');
    errors.forEach(error => error.textContent = '');
    const forgotFb = document.getElementById('forgot-password-feedback');
    if (forgotFb) {
        forgotFb.textContent = '';
        forgotFb.hidden = true;
        forgotFb.classList.remove('forgot-password-feedback--success');
    }
}

function clearSignupErrors() {
    const errors = document.querySelectorAll('#signup-form .error-message');
    errors.forEach(error => error.textContent = '');
}

// Password Toggle
const passwordToggle = document.getElementById('password-toggle');
const signupPasswordToggle = document.getElementById('signup-password-toggle');
const loginPasswordInput = document.getElementById('login-password');
const signupPasswordInput = document.getElementById('signup-password');

function setPasswordEyeIcons(toggleBtn, isHidden) {
    const wrap = toggleBtn && toggleBtn.querySelector('.eye-icon');
    if (!wrap) return;
    var open = wrap.querySelector('.eye-visible');
    var off = wrap.querySelector('.eye-hidden');
    if (!open || !off) return;
    if (isHidden) {
        open.hidden = false;
        off.hidden = true;
    } else {
        open.hidden = true;
        off.hidden = false;
    }
}

if (passwordToggle && loginPasswordInput) {
    passwordToggle.addEventListener('click', () => {
        const type = loginPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        loginPasswordInput.setAttribute('type', type);
        setPasswordEyeIcons(passwordToggle, type === 'password');
    });
}

if (signupPasswordToggle && signupPasswordInput) {
    signupPasswordToggle.addEventListener('click', () => {
        const type = signupPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        signupPasswordInput.setAttribute('type', type);
        setPasswordEyeIcons(signupPasswordToggle, type === 'password');
    });
}

// Password Strength Indicator
if (signupPasswordInput) {
    signupPasswordInput.addEventListener('input', (e) => {
        checkPasswordStrength(e.target.value);
    });
}

function checkPasswordStrength(password) {
    const strengthBars = document.querySelectorAll('#password-strength .strength-bar');
    strengthBars.forEach(bar => {
        bar.classList.remove('weak', 'fair', 'good', 'strong');
    });

    if (password.length === 0) return;

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const strengthLevel = Math.min(Math.floor(strength / 1.5), 4);
    
    for (let i = 0; i < strengthLevel; i++) {
        if (strengthLevel <= 1) {
            strengthBars[i].classList.add('weak');
        } else if (strengthLevel === 2) {
            strengthBars[i].classList.add('fair');
        } else if (strengthLevel === 3) {
            strengthBars[i].classList.add('good');
        } else {
            strengthBars[i].classList.add('strong');
        }
    }
}

function resetPasswordStrength() {
    const strengthBars = document.querySelectorAll('#password-strength .strength-bar');
    strengthBars.forEach(bar => {
        bar.classList.remove('weak', 'fair', 'good', 'strong');
    });
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// After Firebase sign-in: require plan selection + Razorpay before dashboard (same plans as dashboard)
const SUBSCRIPTION_PLAN_STORAGE_KEY = 'subscription_plan';
const POST_AUTH_PLAN_NAMES = {
    plan_15d: 'Viralzaps 15 Days',
    plan_6m: 'Viralzaps 6 Months',
    plan_lifetime: 'Viralzaps Lifetime'
};
const POST_AUTH_PLAN_PRICES = {
    plan_15d: '99',
    plan_6m: '999',
    plan_lifetime: '19999'
};

function hasActiveSubscriptionPlan() {
    try {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        const uid = user && user.uid;
        if (!uid) return false;
        const raw = localStorage.getItem(SUBSCRIPTION_PLAN_STORAGE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!data || !data.plan || !POST_AUTH_PLAN_NAMES[data.plan]) return false;
        if (data.firebaseUid && data.firebaseUid !== uid) return false;
        if (!data.firebaseUid) {
            if (data.plan === 'plan_lifetime') {
                data.firebaseUid = uid;
                try {
                    localStorage.setItem(SUBSCRIPTION_PLAN_STORAGE_KEY, JSON.stringify(data));
                } catch (e) {}
                return true;
            }
            if (data.expiresAt && new Date(data.expiresAt) > new Date()) {
                data.firebaseUid = uid;
                try {
                    localStorage.setItem(SUBSCRIPTION_PLAN_STORAGE_KEY, JSON.stringify(data));
                } catch (e) {}
                return true;
            }
            return false;
        }
        if (data.plan === 'plan_lifetime') return true;
        if (data.expiresAt) {
            return new Date(data.expiresAt) > new Date();
        }
        return false;
    } catch (e) {
        return false;
    }
}

function removePostAuthPlansModal() {
    const el = document.getElementById('post-auth-plans-modal');
    if (el) {
        el.remove();
        document.body.style.overflow = '';
    }
}

function startPostAuthPlanCheckout(plan) {
    const config = typeof window !== 'undefined' && window.RAZORPAY_CONFIG;
    if (!config || !config.keyId || !config.apiBaseUrl) {
        alert('Payments are not configured. Set Razorpay in razorpay-config.js and run the backend.');
        return;
    }
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const userEmail = (user && user.email) ? user.email : '';
    const userName = (user && user.displayName) ? user.displayName : '';
    const planAmounts = { plan_15d: 9900, plan_6m: 99900, plan_lifetime: 1999900 };
    const planShortNames = { plan_15d: '15 Days', plan_6m: '6 Months', plan_lifetime: 'Lifetime' };
    const amountPaise = planAmounts[plan];
    if (!amountPaise) return;

    fetch(config.apiBaseUrl + '/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            amount: amountPaise,
            currency: 'INR',
            receipt: 'plan_' + plan + '_' + Date.now(),
            notes: { plan: plan, customer_email: userEmail, customer_name: userName }
        })
    }).then(function (r) { return r.json(); }).then(function (data) {
        if (data.error) throw new Error(data.error);
        const options = {
            key: config.keyId,
            order_id: data.orderId,
            amount: data.amount,
            currency: data.currency || 'INR',
            name: 'Viralzaps',
            description: planShortNames[plan] + ' Plan',
            prefill: { email: userEmail, name: userName },
            handler: function (res) {
                const activatedAt = Date.now();
                const planData = {
                    plan: plan,
                    planName: POST_AUTH_PLAN_NAMES[plan],
                    price: POST_AUTH_PLAN_PRICES[plan],
                    activatedAt: activatedAt,
                    firebaseUid: user && user.uid ? user.uid : undefined
                };
                if (plan === 'plan_15d') {
                    const d15 = new Date(activatedAt);
                    d15.setDate(d15.getDate() + 15);
                    planData.expiresAt = d15.toISOString();
                } else if (plan === 'plan_6m') {
                    const d6 = new Date(activatedAt);
                    d6.setMonth(d6.getMonth() + 6);
                    planData.expiresAt = d6.toISOString();
                }
                try {
                    localStorage.setItem(SUBSCRIPTION_PLAN_STORAGE_KEY, JSON.stringify(planData));
                } catch (e) {}
                const payload = {
                    order_id: res.razorpay_order_id || data.orderId,
                    payment_id: res.razorpay_payment_id,
                    signature: res.razorpay_signature,
                    customer_name: userName,
                    customer_email: userEmail
                };
                fetch(config.apiBaseUrl + '/api/verify-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(function (v) { return v.json(); }).catch(function () {}).finally(function () {
                    removePostAuthPlansModal();
                    window.location.href = 'dashboard.html';
                });
            }
        };
        if (typeof Razorpay === 'undefined') {
            alert('Razorpay script failed to load. Check your network and try again.');
            return;
        }
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', function (payRes) {
            alert('Payment failed: ' + (payRes.error && payRes.error.description ? payRes.error.description : 'Unknown error'));
        });
        rzp.open();
    }).catch(function (err) {
        alert('Could not start checkout: ' + (err.message || 'Network error') + '. Is the backend running on ' + config.apiBaseUrl + '?');
    });
}

function showPostAuthPlansModal() {
    removePostAuthPlansModal();
    const modal = document.createElement('div');
    modal.id = 'post-auth-plans-modal';
    modal.className = 'plans-modal plans-modal-open';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'post-auth-plans-title');
    const canContinue = hasActiveSubscriptionPlan();
    const continueBanner = canContinue
        ? '<div class="post-auth-continue-banner"><p class="post-auth-continue-text">You already have an active plan on this device.</p><button type="button" class="settings-btn settings-btn-primary" id="post-auth-continue-dashboard">Continue to dashboard</button></div>'
        : '';
    modal.innerHTML =
        '<div class="plans-modal-overlay" id="post-auth-plans-overlay"></div>' +
        '<div class="plans-modal-content">' +
        continueBanner +
        '  <h2 class="plans-modal-title" id="post-auth-plans-title">Choose your plan</h2>' +
        '  <p class="plans-modal-subtitle">Select a plan to continue to your dashboard. Complete payment in the secure Razorpay window.</p>' +
        '  <div class="plans-grid">' +
        '    <div class="plan-card" data-plan="plan_15d">' +
        '      <div class="plan-card-header">' +
        '        <h3 class="plan-card-name">15 Days</h3>' +
        '        <div class="plan-card-price-wrap"><span class="plan-card-price">₹99</span><span class="plan-card-period">/15 days</span></div>' +
        '      </div>' +
        '      <p class="plan-card-features">15 days access + 100 credits/day</p>' +
        '      <button type="button" class="plan-card-activate settings-btn settings-btn-primary">Select & pay</button>' +
        '    </div>' +
        '    <div class="plan-card plan-card-featured" data-plan="plan_6m">' +
        '      <span class="plan-card-badge">Best value</span>' +
        '      <div class="plan-card-header">' +
        '        <h3 class="plan-card-name">6 Months</h3>' +
        '        <div class="plan-card-price-wrap"><span class="plan-card-price">₹999</span><span class="plan-card-period">/6 months</span></div>' +
        '      </div>' +
        '      <p class="plan-card-features">6 months access + 200 credits/day</p>' +
        '      <button type="button" class="plan-card-activate settings-btn settings-btn-primary">Select & pay</button>' +
        '    </div>' +
        '    <div class="plan-card" data-plan="plan_lifetime">' +
        '      <div class="plan-card-header">' +
        '        <h3 class="plan-card-name">Lifetime</h3>' +
        '        <div class="plan-card-price-wrap"><span class="plan-card-price">₹19,999</span><span class="plan-card-period"> one-time</span></div>' +
        '      </div>' +
        '      <p class="plan-card-features">Lifetime access</p>' +
        '      <button type="button" class="plan-card-activate settings-btn settings-btn-primary">Select & pay</button>' +
        '    </div>' +
        '  </div>' +
        '  <p class="post-auth-plans-footer"><button type="button" class="post-auth-sign-out" id="post-auth-sign-out">Sign out</button></p>' +
        '</div>';
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    document.getElementById('post-auth-plans-overlay').addEventListener('click', function (e) {
        e.stopPropagation();
    });
    const continueBtn = document.getElementById('post-auth-continue-dashboard');
    if (continueBtn) {
        continueBtn.addEventListener('click', function () {
            removePostAuthPlansModal();
            window.location.href = 'dashboard.html';
        });
    }
    modal.querySelectorAll('.plan-card-activate').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const card = btn.closest('.plan-card');
            const plan = card && card.getAttribute('data-plan');
            if (plan) startPostAuthPlanCheckout(plan);
        });
    });
    document.getElementById('post-auth-sign-out').addEventListener('click', async function () {
        if (typeof signOut === 'function') {
            try {
                await signOut();
            } catch (e) {}
        }
        removePostAuthPlansModal();
        updateLoginState(false);
    });
}

function completeAuthAndGoHomeOrCheckout() {
    showPostAuthPlansModal();
}

// Firebase email/password error messages
function getEmailAuthErrorMessage(error) {
    const code = error && error.code;
    if (code === 'auth/user-not-found') return 'No account found with this email.';
    if (code === 'auth/wrong-password') return 'Incorrect password.';
    if (code === 'auth/invalid-credential') return 'Invalid email or password.';
    if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (code === 'auth/user-disabled') return 'This account has been disabled.';
    if (code === 'auth/email-already-in-use') return 'This email is already registered. Sign in instead.';
    if (code === 'auth/weak-password') return 'Password should be at least 6 characters.';
    if (code === 'auth/operation-not-allowed') return 'Email/password sign-in is not enabled. Enable it in Firebase Console → Authentication → Sign-in method.';
    if (code === 'auth/configuration-not-found') return 'Firebase Auth is not set up. Enable Authentication and Email/Password in Firebase Console.';
    if (code === 'auth/network-request-failed') return 'Network error. Check your connection and try again.';
    if (code === 'auth/too-many-requests') return 'Too many attempts. Try again later or reset your password.';
    return error && (error.message || String(error)) || 'Something went wrong. Please try again.';
}

function getPasswordResetErrorMessage(error) {
    const code = error && error.code;
    if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (code === 'auth/missing-email') return 'Enter your email address.';
    if (code === 'auth/user-not-found') return 'No account found with this email.';
    if (code === 'auth/user-disabled') return 'This account has been disabled.';
    if (code === 'auth/operation-not-allowed') {
        return 'Password reset is not enabled. Turn on Email/Password in Firebase Console → Authentication.';
    }
    if (code === 'auth/configuration-not-found') {
        return 'Firebase Auth is not set up. Enable Email/Password in Firebase Console.';
    }
    if (code === 'auth/network-request-failed') return 'Network error. Check your connection and try again.';
    if (code === 'auth/too-many-requests') return 'Too many attempts. Try again in a few minutes.';
    return error && (error.message || String(error)) || 'Could not send reset email. Try again.';
}

// Forgot password — Firebase sendPasswordResetEmail
const forgotPasswordBtn = document.getElementById('forgot-password-btn');
if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', async () => {
        const emailInput = document.getElementById('login-email');
        const feedback = document.getElementById('forgot-password-feedback');
        const email = emailInput ? emailInput.value.trim() : '';

        clearLoginErrors();

        if (!email) {
            showError('email-error', 'Enter your email address first, then tap Forgot password.');
            return;
        }
        if (!validateEmail(email)) {
            showError('email-error', 'Please enter a valid email address');
            return;
        }

        if (typeof getAuthUnsupportedReason === 'function') {
            const reason = getAuthUnsupportedReason();
            if (reason) {
                alert(reason);
                return;
            }
        }
        if (typeof ensureFirebaseReady === 'function') await ensureFirebaseReady();
        if (typeof sendPasswordResetEmail !== 'function' || typeof isFirebaseConfigured !== 'function') {
            const why =
                typeof getFirebaseAuthUnavailableReason === 'function'
                    ? getFirebaseAuthUnavailableReason()
                    : null;
            alert(why || 'Password reset is not available. Check Firebase configuration.');
            return;
        }
        if (!isFirebaseConfigured()) {
            const why =
                typeof getFirebaseAuthUnavailableReason === 'function'
                    ? getFirebaseAuthUnavailableReason()
                    : null;
            alert(why || 'Password reset is not available.');
            return;
        }

        forgotPasswordBtn.disabled = true;
        try {
            await sendPasswordResetEmail(email);
            if (feedback) {
                feedback.textContent =
                    'If an account exists for that email, we sent a link to reset your password. Check your inbox and spam folder.';
                feedback.hidden = false;
                feedback.classList.add('forgot-password-feedback--success');
            }
        } catch (error) {
            showError('email-error', getPasswordResetErrorMessage(error));
        } finally {
            forgotPasswordBtn.disabled = false;
        }
    });
}

// Login Form Submission (Firebase)
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const submitBtn = document.getElementById('login-submit');
        
        clearLoginErrors();
        
        let isValid = true;
        if (!email) {
            showError('email-error', 'Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError('email-error', 'Please enter a valid email address');
            isValid = false;
        }
        if (!password) {
            showError('password-error', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            showError('password-error', 'Password must be at least 6 characters');
            isValid = false;
        }
        if (!isValid) return;
        
        if (typeof getAuthUnsupportedReason === 'function') {
            const reason = getAuthUnsupportedReason();
            if (reason) {
                alert(reason);
                return;
            }
        }
        if (typeof ensureFirebaseReady === 'function') await ensureFirebaseReady();
        if (typeof isFirebaseConfigured !== 'function' || !isFirebaseConfigured()) {
            const why =
                typeof getFirebaseAuthUnavailableReason === 'function'
                    ? getFirebaseAuthUnavailableReason()
                    : null;
            alert(
                why ||
                    'Sign-in is not available. Set FIREBASE_* in backend/firebase.env, run the API, and enable Email/Password in Firebase Console.'
            );
            return;
        }
        
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            await signInWithEmail(email, password);
            closeLoginModal();
            updateLoginState(true);
            completeAuthAndGoHomeOrCheckout();
        } catch (error) {
            const msg = getEmailAuthErrorMessage(error);
            showError('password-error', msg);
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
}

// Signup Form Submission (Firebase)
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const terms = document.getElementById('terms').checked;
        const submitBtn = document.getElementById('signup-submit');
        
        clearSignupErrors();
        
        let isValid = true;
        if (!name) {
            showError('name-error', 'Name is required');
            isValid = false;
        } else if (name.length < 2) {
            showError('name-error', 'Name must be at least 2 characters');
            isValid = false;
        }
        if (!email) {
            showError('signup-email-error', 'Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            showError('signup-email-error', 'Please enter a valid email address');
            isValid = false;
        }
        if (!password) {
            showError('signup-password-error', 'Password is required');
            isValid = false;
        } else if (password.length < 8) {
            showError('signup-password-error', 'Password must be at least 8 characters');
            isValid = false;
        }
        if (!terms) {
            alert('Please accept the Terms of Service and Privacy Policy');
            isValid = false;
        }
        if (!isValid) return;
        
        if (typeof getAuthUnsupportedReason === 'function') {
            const reason = getAuthUnsupportedReason();
            if (reason) {
                alert(reason);
                return;
            }
        }
        if (typeof ensureFirebaseReady === 'function') await ensureFirebaseReady();
        if (typeof isFirebaseConfigured !== 'function' || !isFirebaseConfigured()) {
            const whyUp =
                typeof getFirebaseAuthUnavailableReason === 'function'
                    ? getFirebaseAuthUnavailableReason()
                    : null;
            alert(
                whyUp ||
                    'Sign-up is not available. Set FIREBASE_* in backend/firebase.env, run the API, and enable Email/Password in Firebase Console.'
            );
            return;
        }
        
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            const credential = await signUpWithEmail(email, password);
            if (name && credential && credential.user) {
                await credential.user.updateProfile({ displayName: name });
            }
            closeSignupModal();
            updateLoginState(true);
            completeAuthAndGoHomeOrCheckout();
        } catch (error) {
            const msg = getEmailAuthErrorMessage(error);
            showError('signup-email-error', msg);
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
}

// Update login state in UI
function updateLoginState(isLoggedIn) {
    const el = document.getElementById('nav-cta');
    if (el) {
        el.textContent = 'Try Viralzaps';
        el.href = isLoggedIn ? 'dashboard.html' : '#login';
    }
}

// Google OAuth: shared handler for both login and signup modals
function setGoogleButtonLoading(button, loading) {
    if (!button) return;
    button.disabled = loading;
    button.classList.toggle('loading', loading);
    const label = button.querySelector('.btn-social-text');
    if (label) {
        if (loading) {
            label.dataset.originalText = label.textContent;
            label.textContent = 'Signing in with Google...';
        } else if (label.dataset.originalText) {
            label.textContent = label.dataset.originalText;
            delete label.dataset.originalText;
        }
    }
}

function getGoogleAuthErrorMessage(error) {
    const code = error && error.code;
    if (code === 'auth/popup-blocked') return 'Popup was blocked. Please allow popups for this site and try again.';
    if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') return 'Sign-in was cancelled.';
    if (code === 'auth/account-exists-with-different-credential') return 'An account already exists with this email. Try signing in with your password.';
    if (code === 'auth/network-request-failed') return 'Network error. Check your connection and try again.';
    if (code === 'auth/configuration-not-found') {
        return 'Firebase Auth is not set up. In Firebase Console: Authentication → Get started (if needed) → Sign-in method → enable Google, then try again.';
    }
    return error && (error.message || String(error)) || 'Google sign-in failed. Please try again.';
}

async function handleGoogleSignIn(button) {
    if (typeof getAuthUnsupportedReason === 'function') {
        const reason = getAuthUnsupportedReason();
        if (reason) {
            alert(reason);
            return;
        }
    }
    if (typeof ensureFirebaseReady === 'function') await ensureFirebaseReady();
    if (typeof signInWithGoogle !== 'function' || typeof isFirebaseConfigured !== 'function') {
        const why0 =
            typeof getFirebaseAuthUnavailableReason === 'function'
                ? getFirebaseAuthUnavailableReason({ google: true })
                : null;
        alert(
            why0 ||
                'Google login is not configured. Set FIREBASE_* in backend/firebase.env and run the API.'
        );
        return;
    }
    if (!isFirebaseConfigured()) {
        const whyG =
            typeof getFirebaseAuthUnavailableReason === 'function'
                ? getFirebaseAuthUnavailableReason({ google: true })
                : null;
        alert(
            whyG ||
                'Google login: Set FIREBASE_* in backend/firebase.env, run the API, and enable Google in Firebase Console.'
        );
        return;
    }
    setGoogleButtonLoading(button, true);
    clearLoginErrors();
    clearSignupErrors();
    try {
        await signInWithGoogle();
        closeLoginModal();
        closeSignupModal();
        updateLoginState(true);
        completeAuthAndGoHomeOrCheckout();
    } catch (err) {
        const msg = getGoogleAuthErrorMessage(err);
        const loginError = document.getElementById('password-error');
        const signupError = document.getElementById('signup-password-error');
        if (loginError) loginError.textContent = msg;
        if (signupError) signupError.textContent = msg;
    } finally {
        setGoogleButtonLoading(button, false);
    }
}

document.getElementById('google-login')?.addEventListener('click', (e) => {
    handleGoogleSignIn(e.currentTarget);
});

document.getElementById('google-signup')?.addEventListener('click', (e) => {
    handleGoogleSignIn(e.currentTarget);
});

// Restore auth state on page load (Firebase persistence); reopen plan flow if sent back from dashboard
if (typeof onAuthStateChanged === 'function') {
    onAuthStateChanged((user) => {
        updateLoginState(!!user);
        try {
            const params = new URLSearchParams(window.location.search);
            if (user && params.get('needpay') === '1') {
                const clean = window.location.pathname + (window.location.hash || '');
                window.history.replaceState({}, '', clean);
                if (hasActiveSubscriptionPlan()) {
                    window.location.href = 'dashboard.html';
                } else {
                    showPostAuthPlansModal();
                }
            }
        } catch (e) {}
    });
}

// Optional: handle redirect result if you add signInWithRedirect for popup-blocked users
if (typeof getGoogleRedirectResult === 'function' && typeof onAuthStateChanged === 'function') {
    getGoogleRedirectResult().then((result) => {
        if (result && result.user) {
            closeLoginModal();
            closeSignupModal();
            updateLoginState(true);
            completeAuthAndGoHomeOrCheckout();
        }
    }).catch((err) => {
        if (err && err.code !== 'auth/popup-closed-by-user') {
            console.warn('Google redirect result error:', err);
        }
    });
}
