if (Auth.isLoggedIn()) location.replace('dashboard.html');

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const user = document.getElementById('username');
  const pass = document.getElementById('password');
  const remember = document.getElementById('remember');
  const error = document.getElementById('login-error');
  const btn = form.querySelector('button[type="submit"]');
  const toggle = document.getElementById('toggle-pass');

  toggle.addEventListener('click', () => {
    const show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    toggle.classList.toggle('on', show);
  });

  pass.addEventListener('keyup', (e) => {
    document.getElementById('caps').hidden = !(e.getModifierState && e.getModifierState('CapsLock'));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    error.hidden = true;
    btn.classList.add('loading');
    btn.disabled = true;

    setTimeout(() => {
      if (Auth.login(user.value, pass.value, remember.checked)) {
        btn.classList.add('success');
        setTimeout(() => location.replace('dashboard.html'), 450);
      } else {
        btn.classList.remove('loading');
        btn.disabled = false;
        error.hidden = false;
        form.classList.remove('shake');
        void form.offsetWidth;
        form.classList.add('shake');
        pass.select();
      }
    }, 500);
  });
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
