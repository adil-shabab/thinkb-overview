const Auth = (() => {
  const KEY = 'tb_session';

  function read() {
    for (const store of [sessionStorage, localStorage]) {
      try {
        const raw = store.getItem(KEY);
        if (raw) return JSON.parse(raw);
      } catch { /* storage blocked */ }
    }
    return null;
  }

  function login(username, password, remember) {
    if (username.trim() !== CONFIG.username || password !== CONFIG.password) return false;
    const hours = remember ? CONFIG.rememberDays * 24 : CONFIG.sessionHours;
    const session = { user: CONFIG.username, exp: Date.now() + hours * 3600e3 };
    try {
      (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
    } catch { /* storage blocked */ }
    return true;
  }

  function isLoggedIn() {
    const s = read();
    if (!s || s.user !== CONFIG.username || Date.now() > s.exp) {
      logout(false);
      return false;
    }
    return true;
  }

  function logout(redirect = true) {
    try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); } catch { /* ignore */ }
    if (redirect) location.replace('index.html');
  }

  function requireAuth() {
    if (!isLoggedIn()) location.replace('index.html');
  }

  return { login, logout, isLoggedIn, requireAuth };
})();
