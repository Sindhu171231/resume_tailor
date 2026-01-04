/* =====================================
   script.js
   Vanilla JS for modal logic, form validation,
   and authentication requests (via proxy backend).
   ===================================== */

(() => {
  // ---------------------------
  // Config
  // ---------------------------
  const AUTH_ENDPOINT = 'https://authentication-8e1c.onrender.com/auth';

  // DOM elements
  const modalOverlay = document.getElementById('modalOverlay');
  const authModal = document.getElementById('authModal');
  const closeAuth = document.getElementById('closeAuth');

  const tabSignIn = document.getElementById('tabSignIn');
  const tabSignUp = document.getElementById('tabSignUp');

  const signUpForm = document.getElementById('signUpForm');
  const signInForm = document.getElementById('signInForm');
  const forgotForm = document.getElementById('forgotForm');

  const openSignIn = document.getElementById('openSignIn');
  const openSignUp = document.getElementById('openSignUp');
  const heroSignUp = document.getElementById('heroSignUp');
  const finalSignUp = document.getElementById('finalSignUp');

  const mOpenSignIn = document.getElementById('mOpenSignIn');
  const mOpenSignUp = document.getElementById('mOpenSignUp');

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  const authStatus = document.getElementById('authStatus');

  const switchToSignIn = document.getElementById('switchToSignIn');
  const switchToSignUp = document.getElementById('switchToSignUp');
  const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
  const backToSignIn = document.getElementById('backToSignIn');

  const openSignInBtns = [openSignIn, mOpenSignIn];
  const openSignUpBtns = [openSignUp, heroSignUp, finalSignUp, mOpenSignUp];

  // ---------------------------
  // Utility
  // ---------------------------
  function showModal() {
    modalOverlay.classList.remove('hidden');
    authModal.classList.remove('hidden');
    authModal.classList.add('show');
    showSignUp();
  }
  function hideModal() {
    modalOverlay.classList.add('hidden');
    authModal.classList.add('hidden');
    authModal.classList.remove('show');
    clearStatus();
  }
  function setStatus(msg, isError = false) {
    authStatus.textContent = msg;
    authStatus.style.color = isError ? '#dc2626' : '';
  }
  function clearStatus() {
    authStatus.textContent = '';
    authStatus.style.color = '';
  }
  function validateEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
  }

  // ---------------------------
  // Mobile menu toggle
  // ---------------------------
  mobileMenuBtn?.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });

  // ---------------------------
  // Modal open / close
  // ---------------------------
  openSignInBtns.forEach(btn => btn?.addEventListener('click', (e) => {
    e.preventDefault();
    showSignIn();
    showModal();
  }));
  openSignUpBtns.forEach(btn => btn?.addEventListener('click', (e) => {
    e.preventDefault();
    showSignUp();
    showModal();
  }));
  closeAuth?.addEventListener('click', hideModal);
  modalOverlay?.addEventListener('click', hideModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
  });

  // ---------------------------
  // Form switches
  // ---------------------------
  function showSignIn() {
    tabSignIn.classList.add('bg-white', 'shadow');
    tabSignUp.classList.remove('bg-white', 'shadow');
    signInForm.classList.remove('hidden');
    signUpForm.classList.add('hidden');
    forgotForm.classList.add('hidden');
    clearStatus();
  }
  function showSignUp() {
    tabSignUp.classList.add('bg-white', 'shadow');
    tabSignIn.classList.remove('bg-white', 'shadow');
    signUpForm.classList.remove('hidden');
    signInForm.classList.add('hidden');
    forgotForm.classList.add('hidden');
    clearStatus();
  }
  function showForgot() {
    signUpForm.classList.add('hidden');
    signInForm.classList.add('hidden');
    forgotForm.classList.remove('hidden');
    clearStatus();
  }

  tabSignIn.addEventListener('click', showSignIn);
  tabSignUp.addEventListener('click', showSignUp);
  switchToSignIn.addEventListener('click', showSignIn);
  switchToSignUp.addEventListener('click', showSignUp);
  forgotPasswordBtn.addEventListener('click', showForgot);
  backToSignIn.addEventListener('click', showSignIn);

  // ---------------------------
  // Auth API requests
  // ---------------------------
  async function postAuth(payload) {
    try {
      setStatus('Processing...');
      const res = await fetch(AUTH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => null);

      if (res.status !== 200) {  // Only success code 200
        return {
          ok: false,
          error: data?.message || `Server returned ${res.status}`,
          details: data
        };
      }

      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.message || 'Network error' };
    }
  }

  // ---------------------------
  // Sign Up
  // ---------------------------
  signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();

    const email = signUpForm.email.value.trim();
    const password = signUpForm.password.value.trim();

    if (!validateEmail(email)) {
      setStatus('Please enter a valid email address.', true);
      return;
    }
    if (password.length < 6) {
      setStatus('Password must be at least 6 characters.', true);
      return;
    }

    const payload = { email, password, action: 'signup' };
    const result = await postAuth(payload);

    if (!result.ok) {
      setStatus(`Error: ${result.error}`, true);
      return;
    }

    const resp = result.data;
    setStatus(resp.message || 'Signup successful!');

    if (resp.idToken) {
      localStorage.setItem('ai_resume_token', resp.idToken);
      localStorage.setItem('ai_resume_email', resp.email || email);
      // Redirect to dashboard on successful signup
      window.location.href = 'dashboard.html';
    }

    setTimeout(hideModal, 900);
  });

  // ---------------------------
  // Sign In
  // ---------------------------
  signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();

    const email = signInForm.email.value.trim();
    const password = signInForm.password.value.trim();

    if (!validateEmail(email)) {
      setStatus('Please enter a valid email address.', true);
      return;
    }
    if (!password) {
      setStatus('Please enter your password.', true);
      return;
    }

    const payload = { email, password, action: 'signin' };
    const result = await postAuth(payload);

    if (!result.ok) {
      setStatus(`Error: ${result.error}`, true);
      return;
    }

    const resp = result.data;
    setStatus(resp.message || 'Sign-in successful!');

    if (resp.idToken) {
      localStorage.setItem('ai_resume_token', resp.idToken);
      localStorage.setItem('ai_resume_email', resp.email || email);
      // Redirect to dashboard on successful signin
      window.location.href = 'dashboard.html';
    }

    setTimeout(hideModal, 800);
  });

  // ---------------------------
  // Forgot Password
  // ---------------------------
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();

    const email = forgotForm.email.value.trim();
    if (!validateEmail(email)) {
      setStatus('Please enter a valid email address.', true);
      return;
    }

    const payload = { email, action: 'forgot_password' };
    const result = await postAuth(payload);

    if (!result.ok) {
      setStatus(`Error: ${result.error}`, true);
      return;
    }

    const resp = result.data;
    setStatus(resp.message || 'If this email exists, a password reset has been sent.');

    setTimeout(showSignIn, 1200);
  });

  // ---------------------------
  // Google placeholder
  // ---------------------------
  document.getElementById('googleSignIn')?.addEventListener('click', () => {
    setStatus('Google sign-in placeholder — implement OAUTH flow in production.', true);
  });
  document.getElementById('googleSignUp')?.addEventListener('click', () => {
    setStatus('Google sign-up placeholder — implement OAUTH flow in production.', true);
  });

  // Footer year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Restore session
  window.addEventListener('load', () => {
    const token = localStorage.getItem('ai_resume_token');
    const email = localStorage.getItem('ai_resume_email');
    if (token && email) {
      console.log(`Signed in as ${email}`);
    }
  });

})();

