// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
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

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
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

// Testimonial Slider
let currentTestimonial = 0;
const testimonialCards = document.querySelectorAll('.testimonial-card');
const testimonialDots = document.querySelectorAll('.dot');
const testimonialPrev = document.querySelector('.testimonial-prev');
const testimonialNext = document.querySelector('.testimonial-next');

function showTestimonial(index) {
    // Remove active class from all cards and dots
    testimonialCards.forEach(card => card.classList.remove('active'));
    testimonialDots.forEach(dot => dot.classList.remove('active'));
    
    // Add active class to current card and dot
    if (testimonialCards[index]) {
        testimonialCards[index].classList.add('active');
    }
    if (testimonialDots[index]) {
        testimonialDots[index].classList.add('active');
    }
}

function nextTestimonial() {
    currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
    showTestimonial(currentTestimonial);
}

function prevTestimonial() {
    currentTestimonial = (currentTestimonial - 1 + testimonialCards.length) % testimonialCards.length;
    showTestimonial(currentTestimonial);
}

if (testimonialNext) {
    testimonialNext.addEventListener('click', nextTestimonial);
}

if (testimonialPrev) {
    testimonialPrev.addEventListener('click', prevTestimonial);
}

// Dot navigation
testimonialDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentTestimonial = index;
        showTestimonial(currentTestimonial);
    });
});

// Auto-rotate testimonials
let testimonialInterval = setInterval(nextTestimonial, 5000);

// Pause auto-rotation on hover
const testimonialsSlider = document.querySelector('.testimonials-slider');
if (testimonialsSlider) {
    testimonialsSlider.addEventListener('mouseenter', () => {
        clearInterval(testimonialInterval);
    });
    
    testimonialsSlider.addEventListener('mouseleave', () => {
        testimonialInterval = setInterval(nextTestimonial, 5000);
    });
}

// Initialize first testimonial
if (testimonialCards.length > 0) {
    showTestimonial(0);
}

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
    
    // Update scroll progress
    updateScrollProgress();
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
    const animateElements = document.querySelectorAll('.feature-card, .platform-feature, .tool-card, .credit-card, .pricing-card');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Pricing toggle (Annual/Monthly)
const annualToggle = document.getElementById('annual-toggle');
const priceAmounts = document.querySelectorAll('.price-amount');
const planBilling = document.querySelectorAll('.plan-billing');

if (annualToggle) {
    annualToggle.addEventListener('change', (e) => {
        const isAnnual = e.target.checked;
        
        priceAmounts.forEach((price, index) => {
            const currentPrice = parseFloat(price.textContent.replace('$', ''));
            let newPrice;
            
            if (isAnnual) {
                // Apply 30% discount for annual
                newPrice = Math.round(currentPrice * 12 * 0.7);
                price.textContent = `$${newPrice}`;
                planBilling[index].textContent = `Billed annually at $${newPrice}`;
            } else {
                // Monthly prices
                const monthlyPrices = [25, 45, 80];
                price.textContent = `$${monthlyPrices[index]}`;
                planBilling[index].textContent = `Billed monthly at $${monthlyPrices[index]}`;
            }
        });
    });
}

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

console.log('Viralzap website loaded successfully!');

// Login Modal Functionality
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const loginLink = document.querySelector('a[href="#login"]');
const signupLink = document.getElementById('signup-link');
const loginClose = document.getElementById('login-close');
const signupClose = document.getElementById('signup-close');
const loginOverlay = document.getElementById('login-overlay');
const signupOverlay = document.getElementById('signup-overlay');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginToSignupLink = document.getElementById('login-link');

// Open login modal
if (loginLink) {
    loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        openLoginModal();
    });
}

// Open signup modal from login
if (signupLink) {
    signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeLoginModal();
        openSignupModal();
    });
}

// Open login modal from signup
if (loginToSignupLink) {
    loginToSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeSignupModal();
        openLoginModal();
    });
}

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

if (passwordToggle && loginPasswordInput) {
    passwordToggle.addEventListener('click', () => {
        const type = loginPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        loginPasswordInput.setAttribute('type', type);
        passwordToggle.querySelector('.eye-icon').textContent = type === 'password' ? '👁️' : '🙈';
    });
}

if (signupPasswordToggle && signupPasswordInput) {
    signupPasswordToggle.addEventListener('click', () => {
        const type = signupPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        signupPasswordInput.setAttribute('type', type);
        signupPasswordToggle.querySelector('.eye-icon').textContent = type === 'password' ? '👁️' : '🙈';
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

// Form Validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
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
        if (typeof isFirebaseConfigured !== 'function' || !isFirebaseConfigured()) {
            alert('Sign-in is not configured. Add your Firebase config and enable Email/Password in Firebase Console.');
            return;
        }
        
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            await signInWithEmail(email, password);
            closeLoginModal();
            updateLoginState(true);
            window.location.href = 'dashboard.html';
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
        if (typeof isFirebaseConfigured !== 'function' || !isFirebaseConfigured()) {
            alert('Sign-up is not configured. Add your Firebase config and enable Email/Password in Firebase Console.');
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
            window.location.href = 'dashboard.html';
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
    const loginLink = document.querySelector('a[href="#login"]');
    if (loginLink) {
        if (isLoggedIn) {
            loginLink.textContent = 'Dashboard';
            loginLink.href = 'dashboard.html';
        } else {
            loginLink.textContent = 'Login';
            loginLink.href = '#login';
        }
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
    if (typeof signInWithGoogle !== 'function' || typeof isFirebaseConfigured !== 'function') {
        alert('Google login is not configured. Add your Firebase config in firebase-config.js.');
        return;
    }
    if (!isFirebaseConfigured()) {
        alert('Google login: Add your Firebase project config in firebase-config.js and enable Google sign-in in the Firebase Console.');
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
        window.location.href = 'dashboard.html';
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

// Restore auth state on page load (Firebase persistence)
if (typeof onAuthStateChanged === 'function') {
    onAuthStateChanged((user) => {
        updateLoginState(!!user);
    });
}

// Optional: handle redirect result if you add signInWithRedirect for popup-blocked users
if (typeof getGoogleRedirectResult === 'function' && typeof onAuthStateChanged === 'function') {
    getGoogleRedirectResult().then((result) => {
        if (result && result.user) {
            closeLoginModal();
            closeSignupModal();
            updateLoginState(true);
        }
    }).catch((err) => {
        if (err && err.code !== 'auth/popup-closed-by-user') {
            console.warn('Google redirect result error:', err);
        }
    });
}

// Tool Tabs Functionality
const toolTabs = document.querySelectorAll('.tool-tab');
const toolPanels = document.querySelectorAll('.tool-panel');

toolTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const toolName = tab.getAttribute('data-tool');
        
        // Remove active class from all tabs and panels
        toolTabs.forEach(t => t.classList.remove('active'));
        toolPanels.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding panel
        tab.classList.add('active');
        const panel = document.getElementById(`${toolName}-panel`);
        if (panel) {
            panel.classList.add('active');
        }
    });
});

// Sample niche data for demo
const sampleNiches = [
    {
        name: 'Minecraft Parkour',
        trend: '+245%',
        views: '2.4M',
        competition: 'Low',
        age: '7 days',
        growth: 'Rapid'
    },
    {
        name: 'Roblox Rants',
        trend: '+189%',
        views: '1.8M',
        competition: 'Medium',
        age: '14 days',
        growth: 'Growing'
    },
    {
        name: 'Bodycam Stories',
        trend: '+312%',
        views: '3.1M',
        competition: 'Low',
        age: '5 days',
        growth: 'Rapid'
    },
    {
        name: 'History Documentaries',
        trend: '+156%',
        views: '950K',
        competition: 'Low',
        age: '21 days',
        growth: 'Steady'
    },
    {
        name: 'AI Explained',
        trend: '+278%',
        views: '1.2M',
        competition: 'Medium',
        age: '10 days',
        growth: 'Rapid'
    }
];

// Niche Finder Search
function searchNiches() {
    const searchInput = document.getElementById('niche-search');
    const minViews = document.getElementById('min-views').value;
    const videoAge = document.getElementById('video-age').value;
    const resultsContainer = document.getElementById('niche-results');
    
    if (!searchInput.value.trim()) {
        resultsContainer.innerHTML = `
            <div class="results-placeholder">
                <p>Please enter keywords to search for niches</p>
            </div>
        `;
        return;
    }
    
    // Show loading state
    resultsContainer.innerHTML = `
        <div class="results-placeholder">
            <p>Searching for trending niches...</p>
        </div>
    `;
    
    // Simulate API call
    setTimeout(() => {
        const filteredNiches = sampleNiches.filter((niche, index) => {
            return index < 3; // Show first 3 results
        });
        
        let resultsHTML = '';
        filteredNiches.forEach(niche => {
            resultsHTML += `
                <div class="niche-result-item">
                    <div class="niche-result-header">
                        <div class="niche-name">${niche.name}</div>
                        <div class="niche-trend">${niche.trend}</div>
                    </div>
                    <div class="niche-stats">
                        <div class="niche-stat">
                            <div class="niche-stat-label">Avg Views</div>
                            <div class="niche-stat-value">${niche.views}</div>
                        </div>
                        <div class="niche-stat">
                            <div class="niche-stat-label">Competition</div>
                            <div class="niche-stat-value">${niche.competition}</div>
                        </div>
                        <div class="niche-stat">
                            <div class="niche-stat-label">Video Age</div>
                            <div class="niche-stat-value">${niche.age}</div>
                        </div>
                        <div class="niche-stat">
                            <div class="niche-stat-label">Growth</div>
                            <div class="niche-stat-value">${niche.growth}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = resultsHTML;
    }, 1500);
}

// Video Generation
function generateVideo() {
    const prompt = document.getElementById('video-prompt').value;
    const quality = document.getElementById('video-quality').value;
    const duration = document.getElementById('video-duration').value;
    const preview = document.getElementById('video-preview');
    const generateBtn = document.querySelector('#video-gen-panel .btn-generate');
    
    if (!prompt.trim()) {
        alert('Please enter a video prompt');
        return;
    }
    
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    preview.innerHTML = `
        <div class="preview-placeholder">
            <div class="preview-icon">⏳</div>
            <p>Generating your video... This may take a moment.</p>
        </div>
    `;
    
    // Simulate video generation
    setTimeout(() => {
        preview.innerHTML = `
            <div style="width: 100%; aspect-ratio: 16/9; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem; font-weight: 600;">
                🎥 Video Generated Successfully!<br>
                <span style="font-size: 0.875rem; opacity: 0.9; margin-top: 0.5rem; display: block;">Your video is ready to download</span>
            </div>
        `;
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Video';
        
        // Update credits
        updateCredits(parseInt(document.getElementById('video-credits').textContent));
        addActivity('Video Generated', '🎥');
    }, 3000);
}

// Update video credits based on quality selection
document.getElementById('video-quality')?.addEventListener('change', function() {
    const credits = {
        'sora2': 13,
        'sora2pro': 38,
        'sora2hd': 63
    };
    document.getElementById('video-credits').textContent = credits[this.value] || 13;
});

// Image Generation
function generateImage() {
    const prompt = document.getElementById('image-prompt').value;
    const style = document.getElementById('image-style').value;
    const ratio = document.getElementById('image-ratio').value;
    const imageGrid = document.getElementById('image-grid');
    const generateBtn = document.querySelector('#image-gen-panel .btn-generate');
    
    if (!prompt.trim()) {
        alert('Please enter an image prompt');
        return;
    }
    
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    // Simulate image generation
    setTimeout(() => {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        const imageHTML = `
            <div class="image-item" style="background: ${randomColor}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                Generated Image
            </div>
        `;
        
        if (imageGrid.querySelector('.image-placeholder')) {
            imageGrid.innerHTML = imageHTML;
        } else {
            imageGrid.insertAdjacentHTML('beforeend', imageHTML);
        }
        
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Image';
        
        updateImageCredits();
        addActivity('Image Generated', '🖼️');
    }, 2000);
}

// Channel Analysis
function analyzeChannel() {
    const channelUrl = document.getElementById('channel-url').value;
    const resultsContainer = document.getElementById('channel-results');
    const analyzeBtn = document.querySelector('#channel-analysis-panel .btn-search');
    
    if (!channelUrl.trim()) {
        alert('Please enter a channel URL or name');
        return;
    }
    
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    
    resultsContainer.innerHTML = `
        <div class="results-placeholder">
            <p>Analyzing channel data...</p>
        </div>
    `;
    
    // Simulate channel analysis
    setTimeout(() => {
        const channelName = channelUrl.split('/').pop() || 'Sample Channel';
        const metrics = {
            subscribers: (Math.random() * 5 + 1).toFixed(1) + 'M',
            totalViews: (Math.random() * 50 + 10).toFixed(1) + 'M',
            avgViews: (Math.random() * 500 + 100).toFixed(0) + 'K',
            uploads: Math.floor(Math.random() * 500 + 100),
            growth: '+' + (Math.random() * 20 + 5).toFixed(1) + '%'
        };
        
        resultsContainer.innerHTML = `
            <div class="channel-analysis-card">
                <div class="channel-header">
                    <div class="channel-avatar-large"></div>
                    <div class="channel-info-large">
                        <h4>${channelName}</h4>
                        <p>Gaming & Entertainment</p>
                    </div>
                </div>
                <div class="channel-metrics">
                    <div class="metric-box">
                        <div class="metric-value">${metrics.subscribers}</div>
                        <div class="metric-label">Subscribers</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-value">${metrics.totalViews}</div>
                        <div class="metric-label">Total Views</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-value">${metrics.avgViews}</div>
                        <div class="metric-label">Avg Views/Video</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-value">${metrics.uploads}</div>
                        <div class="metric-label">Total Videos</div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-value">${metrics.growth}</div>
                        <div class="metric-label">Growth Rate</div>
                    </div>
                </div>
            </div>
        `;
        
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze Channel';
        addActivity('Channel Analyzed', '🔍');
    }, 2000);
}

// Voice Generation
function generateVoice() {
    const script = document.getElementById('voice-script').value;
    const model = document.getElementById('voice-model').value;
    const language = document.getElementById('voice-language').value;
    const voicePlayer = document.getElementById('voice-player');
    const generateBtn = document.querySelector('#voice-gen-panel .btn-generate');
    
    if (!script.trim()) {
        alert('Please enter a script');
        return;
    }
    
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    voicePlayer.innerHTML = `
        <div class="player-placeholder">
            <div class="preview-icon">⏳</div>
            <p>Generating voiceover...</p>
        </div>
    `;
    
    // Simulate voice generation
    setTimeout(() => {
        const duration = Math.ceil(script.length / 150); // Rough estimate
        voicePlayer.innerHTML = `
            <div class="player-placeholder">
                <div class="preview-icon">🎙️</div>
                <p>Voiceover Generated!</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Duration: ${duration}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}</p>
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-primary); border-radius: 0.5rem; width: 100%;">
                    <div style="display: flex; gap: 0.5rem; align-items: center; justify-content: center;">
                        <button style="background: var(--primary-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">▶ Play</button>
                        <button style="background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">⬇ Download</button>
                    </div>
                </div>
            </div>
        `;
        
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Voiceover';
        addActivity('Voiceover Generated', '🎙️');
    }, 2500);
}

// Dashboard Functions
function updateCredits(amount) {
    const balanceElement = document.getElementById('credit-balance');
    if (balanceElement) {
        let currentBalance = parseInt(balanceElement.textContent);
        currentBalance = Math.max(0, currentBalance - amount);
        balanceElement.textContent = currentBalance;
        
        // Add animation
        balanceElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            balanceElement.style.transform = 'scale(1)';
        }, 300);
    }
}

function updateImageCredits() {
    const imageCreditsElement = document.getElementById('image-credits');
    if (imageCreditsElement) {
        const [used, total] = imageCreditsElement.textContent.split('/').map(Number);
        if (used < total) {
            imageCreditsElement.textContent = `${used + 1}/${total}`;
        }
    }
}

function addActivity(title, icon) {
    const activityList = document.getElementById('activity-list');
    if (activityList) {
        const now = new Date();
        const timeAgo = 'Just now';
        
        const activityHTML = `
            <div class="activity-item">
                <div class="activity-icon">${icon}</div>
                <div class="activity-info">
                    <div class="activity-title">${title}</div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
                <div class="activity-credits">-1</div>
            </div>
        `;
        
        activityList.insertAdjacentHTML('afterbegin', activityHTML);
    }
}

function showTopup() {
    alert('Top-up feature would open a payment modal in the full application.');
}

// Update stats on dashboard
function updateStats() {
    const videosCreated = document.getElementById('videos-created');
    const nichesFound = document.getElementById('niches-found');
    const channelsAnalyzed = document.getElementById('channels-analyzed');
    
    // These would be updated based on actual user activity
    // For demo purposes, they're static
}

// Initialize dashboard stats
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    
    // Add enter key support for search inputs
    document.getElementById('niche-search')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchNiches();
    });
    
    document.getElementById('channel-url')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') analyzeChannel();
    });
    
    // Removed extra interactions to match original UI exactly
    
    // Removed extra animations to match original UI exactly
});

