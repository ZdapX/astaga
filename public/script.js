const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const nameField = document.getElementById('nameField');
const nameInput = document.getElementById('name');
const title = document.getElementById('title');
const subtitle = document.getElementById('subtitle');
const submitButton = document.getElementById('submitButton');
const loginOptions = document.getElementById('loginOptions');
const password = document.getElementById('password');
const showPassword = document.getElementById('showPassword');
const form = document.getElementById('authForm');
const status = document.getElementById('status');
const forgot = document.getElementById('forgot');

let mode = 'login';

function setMode(nextMode) {
  mode = nextMode;
  const register = mode === 'register';
  nameField.classList.toggle('hidden', !register);
  nameInput.required = register;
  loginOptions.classList.toggle('hidden', register);
  loginTab.classList.toggle('active', !register);
  registerTab.classList.toggle('active', register);
  loginTab.setAttribute('aria-selected', String(!register));
  registerTab.setAttribute('aria-selected', String(register));
  title.textContent = register ? 'Create account' : 'Welcome back';
  subtitle.textContent = register ? 'Create your account to get started.' : 'Sign in to continue to your account.';
  submitButton.textContent = register ? 'Create account' : 'Sign in';
  password.autocomplete = register ? 'new-password' : 'current-password';
  password.value = '';
  status.classList.add('hidden');
  status.textContent = '';
}

loginTab.addEventListener('click', () => setMode('login'));
registerTab.addEventListener('click', () => setMode('register'));

showPassword.addEventListener('click', () => {
  const visible = password.type === 'text';
  password.type = visible ? 'password' : 'text';
  showPassword.textContent = visible ? 'Show' : 'Hide';
  showPassword.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  status.textContent = mode === 'login' ? 'Sign in form submitted.' : 'Account form submitted.';
  status.classList.remove('hidden');
});

forgot.addEventListener('click', () => {
  status.textContent = 'Password recovery is not configured yet.';
  status.classList.remove('hidden');
});
