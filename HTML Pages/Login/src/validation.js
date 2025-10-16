document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('loginForm');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const formError = document.getElementById('formError');

  function showError(message) {
    formError.textContent = message;
  }

  function clearError() {
    formError.textContent = '';
  }

  function validate() {
    clearError();
    if (!email.value) {
      showError('Email is required.');
      email.focus();
      return false;
    }
    // simple email pattern
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value)) {
      showError('Please enter a valid email address.');
      email.focus();
      return false;
    }

    if (!password.value) {
      showError('Password is required.');
      password.focus();
      return false;
    }

    if (password.value.length < 6) {
      showError('Password must be at least 6 characters.');
      password.focus();
      return false;
    }

    return true;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    // Post credentials to mock server
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })
      .then(res => res.json().then(body => ({ status: res.status, body })))
      .then(({ status, body }) => {
        if (status === 200 && body.success) {
          // Redirect to Meeting page on success
          window.location.href = '../Meeting/index.html';
        } else {
          showError(body.message || 'Login failed');
        }
      })
      .catch(err => {
        showError('Network error — please try again');
        console.error(err);
      });
  });

  // Create account button: redirect to registration page
  const createBtn = document.getElementById('createAccount');
  if (createBtn) {
    createBtn.addEventListener('click', function () {
      window.location.href = '../User Registration/index.html';
    });
  }

  // Guest sign-in: bypass validation and go to Meeting page
  const guestBtn = document.getElementById('guestSignin');
  if (guestBtn) {
    guestBtn.addEventListener('click', function () {
      // Optionally, set a flag in sessionStorage to indicate guest session
      sessionStorage.setItem('guest', 'true');
      window.location.href = '../Meeting/index.html';
    });
  }
});