(() => {
  // ── Helpers ────────────────────────────────────────────────
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const toDate = (s) => new Date(s + 'T00:00:00');
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const daysUntil = (s) => Math.round((toDate(s) - today()) / 86400000);
  const fmtDate = (s, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => (s ? toDate(s).toLocaleDateString('en-IN', opts) : '—');
  const known = (n) => n !== '' && n !== null && n !== undefined;
  const money = (n, cur = CONFIG.currency) => (known(n) ? cur + Number(n).toLocaleString('en-IN') : '—');
  // Totals per currency, e.g. "₹1,500 + $16".
  const sumMoney = (list, weight = () => 1) => {
    const by = {};
    list.forEach((r) => { if (known(r.amount)) by[r.currency] = (by[r.currency] || 0) + Number(r.amount) * weight(r); });
    const parts = Object.entries(by).map(([c, v]) => money(v, c));
    if (parts.length) return parts.join(' + ');
    return list.length ? 'Price not added' : money(0);
  };
  const host = (w) => (w.url ? w.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '');
  const siteSub = (w) => host(w) || (w.domains || []).map((d) => d.name).filter(Boolean)[0]
    || ((w.domains || []).some((d) => d.managedBy === 'client') ? 'Domain with client' : (w.domains || []).length ? 'Domain name not added' : 'Domain not finalized yet');
  // Next date a monthly charge on `day` happens (today counts).
  function nextMonthly(day) {
    const t = today();
    let d = new Date(t.getFullYear(), t.getMonth(), day);
    if (d < t) d = new Date(t.getFullYear(), t.getMonth() + 1, day);
    return iso(d);
  }
  const initials = (name) => name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const member = (id) => DATA.team.find((m) => m.id === id);
  const site = (id) => DATA.websites.find((w) => w.id === id);

  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6 6 0 0 1 3.5 6"/>',
    kanban: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 7v7M12 7v4M16 7v10"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    link: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 13.5h.01"/>',
    chevL: '<path d="m15 18-6-6 6-6"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  };
  const ic = (name, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const STATUS = {
    live: { label: 'Live', cls: 'green' },
    ready: { label: 'Ready to deploy', cls: 'violet' },
    development: { label: 'In development', cls: 'amber' },
    maintenance: { label: 'Maintenance', cls: 'blue' },
    hold: { label: 'On hold', cls: 'gray' },
    new: { label: 'Not started', cls: 'gray' },
    domain: { label: 'Domain only', cls: 'gray' },
  };
  const TASK_STATUS = { todo: 'To do', doing: 'In progress', review: 'Review', done: 'Done' };
  const TYPE_ICON = { Domain: 'globe', Server: 'server', SSL: 'shield', Subscription: 'wallet', Payment: 'wallet' };

  const badge = (st) => `<span class="badge ${STATUS[st]?.cls || 'gray'}"><i></i>${STATUS[st]?.label || esc(st)}</span>`;
  const urgency = (d) => (d <= 7 ? 'red' : d <= 30 ? 'amber' : 'green');
  const daysLabel = (d) => (d < 0 ? `${-d}d overdue` : d === 0 ? 'Due today' : d === 1 ? 'Tomorrow' : `${d} days left`);
  const avatar = (m, size = '') => (m ? `<span class="avatar ${size}" style="--c:${m.color}" title="${esc(m.name)}">${esc(initials(m.name))}</span>` : '');
  const assigneeAvatar = (m) => avatar(m, 'sm') || '<span class="avatar sm unassigned" title="Not assigned">?</span>';
  const progressBar = (p, cls = '') => `<div class="progress ${cls}"><span style="width:${Math.max(0, Math.min(100, p))}%"></span></div>`;
  const empty = (text) => `<div class="empty">${ic('check')}<p>${esc(text)}</p></div>`;

  // ── Derived data ───────────────────────────────────────────
  function allTasks() {
    return DATA.websites.flatMap((w) => (w.tasks || []).map((t, i) => ({ ...t, siteId: w.id, id: `${w.id}-${i}` })));
  }
  const pendingTasks = () => allTasks().filter((t) => t.status !== 'done');

  function renewals() {
    const list = [];
    DATA.websites.forEach((w) => {
      (w.domains || []).forEach((d) => {
        if (d.managedBy === 'client' || !d.expiry) return;
        list.push({ type: 'Domain', siteId: w.id, title: d.name || `${w.name} domain`, provider: d.account || d.registrar, amount: d.cost, currency: d.currency || CONFIG.currency, due: d.expiry, autoRenew: d.autoRenew });
      });
      const s = w.server;
      if (s && s.managedBy !== 'client') {
        const monthly = s.billing?.cycle === 'monthly';
        // A monthly bill with no known day has no date to remind about.
        const due = monthly ? (s.billing.day ? nextMonthly(s.billing.day) : '') : s.expiry;
        if (due) list.push({ type: 'Server', siteId: w.id, title: `${s.provider || ''} ${s.plan || ''}`.trim() || 'Server', provider: s.account || s.provider, amount: s.cost, currency: s.currency || CONFIG.currency, due, monthly, card: s.card });
      }
      if (w.ssl?.expiry) list.push({ type: 'SSL', siteId: w.id, title: `SSL · ${w.name}`, provider: w.ssl.provider, amount: w.ssl.cost, currency: CONFIG.currency, due: w.ssl.expiry });
    });
    (DATA.payments || []).forEach((p) => list.push({ type: p.type || 'Payment', siteId: p.site || '', title: p.title, provider: p.provider, amount: p.amount, currency: p.currency || CONFIG.currency, due: p.due, card: p.card }));
    const paid = store.get('tb_paid', []);
    return list
      .map((r) => {
        const id = `${r.siteId}|${r.type}|${r.title}|${r.due}`;
        return { ...r, id, days: daysUntil(r.due), paid: paid.includes(id) };
      })
      .sort((a, b) => a.days - b.days);
  }
  const dueSoon = () => renewals().filter((r) => !r.paid && r.days <= CONFIG.alertDays);

  // ── Shared UI pieces ──────────────────────────────────────
  function renewalRow(r, { compact = false } = {}) {
    const s = site(r.siteId);
    const u = r.paid ? 'paid' : urgency(r.days);
    return `
      <div class="renewal-row ${u}">
        <span class="r-icon">${ic(TYPE_ICON[r.type] || 'wallet')}</span>
        <div class="r-main">
          <b>${esc(r.title)}</b>
          <small>${esc(r.type)}${r.monthly ? ' · monthly' : ''}${s ? ` · ${esc(s.name)}` : ''}${r.provider ? ` · ${esc(r.provider)}` : ''}${r.card ? ` · card ${esc(r.card)}` : ''}${r.autoRenew ? ' · auto-renew' : ''}</small>
        </div>
        <div class="r-meta">
          <b>${money(r.amount, r.currency)}</b>
          <small>${fmtDate(r.due)}</small>
        </div>
        ${r.paid
          ? `<span class="pill paid">${ic('check')}Paid</span>`
          : `<span class="pill ${u}">${daysLabel(r.days)}</span>`}
        ${compact ? '' : r.paid
          ? `<button class="btn btn-ghost btn-sm" data-unpaid="${esc(r.id)}">Undo</button>`
          : `<button class="btn btn-ghost btn-sm" data-paid="${esc(r.id)}">${ic('check')}Mark paid</button>`}
      </div>`;
  }

  function taskCard(t, { showSite = true } = {}) {
    const m = member(t.assignee);
    const s = site(t.siteId);
    const d = t.due ? daysUntil(t.due) : null;
    const late = d !== null && d < 0 && t.status !== 'done';
    return `
      <div class="task-card prio-${esc(t.priority || 'low')} ${t.status === 'done' ? 'is-done' : ''}">
        <div class="task-top">
          <span class="prio">${esc(t.priority || 'low')}</span>
          ${showSite && s ? `<button class="task-site" data-site="${esc(s.id)}">${esc(s.name)}</button>` : ''}
        </div>
        <p class="task-title">${esc(t.title)}</p>
        <div class="task-foot">
          ${assigneeAvatar(m)}
          <span class="task-due ${late ? 'late' : ''}">${ic('clock')}${t.due ? fmtDate(t.due, { day: 'numeric', month: 'short' }) : 'No date'}</span>
          ${showSite ? '' : `<span class="mini-status s-${esc(t.status)}">${TASK_STATUS[t.status] || esc(t.status)}</span>`}
        </div>
      </div>`;
  }

  // ── Views ──────────────────────────────────────────────────
  const state = { siteFilter: 'all', siteQuery: '', taskMember: 'all', taskSite: 'all', renewType: 'all', calMonth: null };

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  function viewOverview() {
    const sites = DATA.websites;
    const real = sites.filter((s) => s.status !== 'domain'); // domain-only entries aren't websites
    const live = real.filter((s) => s.status === 'live' || s.status === 'maintenance').length;
    const notLive = real.length - live;
    const pending = pendingTasks();
    const due = dueSoon();
    const updates = DATA.websites
      .flatMap((w) => (w.updates || []).map((u) => ({ ...u, siteId: w.id })))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    return `
      <section class="hero">
        <div>
          <p class="eyebrow">${today().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>${greeting()}, ${esc(CONFIG.leadName)} <span class="wave">👋</span></h1>
          <p class="muted">${pending.length} pending tasks across ${real.length} websites${due.length ? `, and <b class="text-red">${due.length} payment${due.length > 1 ? 's' : ''} due</b> this week` : '. No payments due this week'}.</p>
        </div>
      </section>

      <section class="kpis">
        <a href="#websites" class="kpi">
          <span class="kpi-icon violet">${ic('globe')}</span>
          <small>Total websites</small><b>${real.length}</b>
        </a>
        <a href="#websites" class="kpi" data-filter-link="live">
          <span class="kpi-icon green">${ic('rocket')}</span>
          <small>Live sites</small><b>${live}</b>
        </a>
        <a href="#websites" class="kpi" data-filter-link="notlive">
          <span class="kpi-icon amber">${ic('code')}</span>
          <small>Not live yet</small><b>${notLive}</b>
        </a>
        <a href="#tasks" class="kpi">
          <span class="kpi-icon cyan">${ic('list')}</span>
          <small>Pending tasks</small><b>${pending.length}</b>
        </a>
        <button class="kpi kpi-alert ${due.length ? 'hot' : ''}" data-action="alerts">
          <span class="kpi-icon red">${ic('wallet')}</span>
          <small>Payments due / overdue</small><b>${due.length}</b>
          <em>${due.length ? sumMoney(due) : `nothing in ${CONFIG.alertDays} days`}</em>
        </button>
      </section>

      <section class="card">
        <div class="card-head">
          <h2>${ic('alert')}Due this week</h2>
          <a href="#renewals" class="link">All renewals ${ic('chevR')}</a>
        </div>
        ${due.length ? `<div class="due-strip">${due.map((r) => {
          const s = site(r.siteId);
          return `
            <div class="due-chip ${urgency(r.days)}">
              <div class="due-chip-top"><span class="tag">${ic(TYPE_ICON[r.type] || 'wallet')}${esc(r.type)}</span><span class="pill ${urgency(r.days)}">${daysLabel(r.days)}</span></div>
              <b>${esc(s ? s.name : r.title)}</b>
              <small>${esc(r.title)}</small>
              <div class="due-chip-foot"><b>${money(r.amount, r.currency)}</b><button class="btn btn-ghost btn-sm" data-paid="${esc(r.id)}">${ic('check')}Paid</button></div>
            </div>`;
        }).join('')}</div>` : empty('Nothing due in the next ' + CONFIG.alertDays + ' days.')}
      </section>

      <div class="grid-2">
        <section class="card">
          <div class="card-head"><h2>${ic('users')}Team right now</h2><a href="#team" class="link">Team ${ic('chevR')}</a></div>
          <div class="team-now">
            ${DATA.team.map((m) => {
              const mine = allTasks().filter((t) => t.assignee === m.id);
              const done = mine.filter((t) => t.status === 'done').length;
              const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
              const s = site(m.current?.site);
              return `
                <div class="member-row">
                  <div class="ring" style="--p:${pct};--c:${m.color}">${avatar(m)}</div>
                  <div class="member-info">
                    <b>${esc(m.name)}</b>
                    <small>${esc(m.role)}</small>
                  </div>
                  <div class="member-task">
                    <span class="live-dot"></span>
                    <div><b>${esc(m.current?.task || 'No current task set')}</b>${s ? `<button class="task-site" data-site="${esc(s.id)}">${esc(s.name)}</button>` : ''}</div>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>${ic('activity')}Recent updates</h2></div>
          ${updates.length ? `<ol class="timeline">${updates.map((u) => {
            const m = member(u.by);
            const s = site(u.siteId);
            return `<li><span class="t-dot" style="--c:${m?.color || '#7C5CFF'}"></span><div><p>${esc(u.text)}</p><small><button class="task-site" data-site="${esc(s.id)}">${esc(s.name)}</button> · ${esc(m?.name.split(' ')[0] || '')} · ${fmtDate(u.date, { day: 'numeric', month: 'short' })}</small></div></li>`;
          }).join('')}</ol>` : empty('No updates yet.')}
        </section>
      </div>

      <section class="card">
        <div class="card-head"><h2>${ic('globe')}Websites at a glance</h2><a href="#websites" class="link">All websites ${ic('chevR')}</a></div>
        <div class="table">
          <div class="tr th"><span>Website</span><span>Status</span><span>Progress</span><span>Pending</span><span>Next renewal</span></div>
          ${sites.map((w) => {
            const next = renewals().find((r) => r.siteId === w.id && !r.paid);
            const pend = (w.tasks || []).filter((t) => t.status !== 'done').length;
            return `
              <button class="tr" data-site="${esc(w.id)}">
                <span class="site-cell"><span class="site-fav" style="--h:${hue(w.id)}">${esc(w.name[0])}</span><span><b>${esc(w.name)}</b><small>${esc(siteSub(w))}</small></span></span>
                <span>${badge(w.status)}</span>
                <span class="prog-cell">${known(w.progress) ? `${progressBar(w.progress)}<small>${w.progress}%</small>` : '<small class="muted">No website</small>'}</span>
                <span><b>${pend}</b> <small class="muted">task${pend === 1 ? '' : 's'}</small></span>
                <span>${next ? `<span class="pill ${urgency(next.days)}">${esc(next.type)} · ${fmtDate(next.due, { day: 'numeric', month: 'short' })}</span>` : '<small class="muted">—</small>'}</span>
              </button>`;
          }).join('')}
        </div>
      </section>`;
  }

  // Spread site colours evenly around the wheel, starting at violet.
  function hue(id) {
    const i = DATA.websites.findIndex((w) => w.id === id);
    return (255 + Math.max(i, 0) * 137) % 360;
  }

  function siteCards() {
    const q = state.siteQuery.toLowerCase();
    const isLive = (w) => w.status === 'live' || w.status === 'maintenance';
    const list = DATA.websites.filter((w) =>
      (state.siteFilter === 'all' || w.status === state.siteFilter || (state.siteFilter === 'notlive' && !isLive(w) && w.status !== 'domain')) &&
      (!q || `${w.name} ${w.url} ${w.client?.name} ${(w.domains || []).map((d) => d.name).join(' ')} ${(w.stack || []).join(' ')}`.toLowerCase().includes(q)));
    if (!list.length) return empty('No websites match.');
    const all = renewals();
    return list.map((w) => {
      const pend = (w.tasks || []).filter((t) => t.status !== 'done').length;
      const people = [...new Set([w.owner, ...(w.tasks || []).filter((t) => t.status !== 'done').map((t) => t.assignee)])].map(member).filter(Boolean);
      const box = (cls, icon, label, value) => `<span class="exp ${cls}">${ic(icon)}<small>${label}</small><b>${esc(value)}</b></span>`;
      const exp = (type, managedBy) => {
        if (managedBy === 'client') return box('client', TYPE_ICON[type], type, 'Client');
        const doms = w.domains || [];
        if (type === 'Domain' && doms.length && doms.every((d) => d.subdomainOf)) return box('set', 'globe', 'Subdomain of', doms[0].subdomainOf);
        const r = all.find((x) => x.siteId === w.id && x.type === type);
        // No renewal date yet: show which server it's on instead of a blank.
        if (!r && type === 'Server' && w.server?.provider) {
          const plan = (w.server.plan || '').replace(/\s*web hosting$/i, '');
          const acct = w.server.account || w.server.provider;
          return box('set', 'server', 'Server', plan ? `${acct.split(' ')[0]} ${plan}` : acct);
        }
        if (!r) return box('none', TYPE_ICON[type], type, '—');
        return box(r.paid ? 'paid' : urgency(r.days), TYPE_ICON[type], r.monthly ? 'Next bill' : type, fmtDate(r.due, { day: 'numeric', month: 'short', year: '2-digit' }));
      };
      const domainOwner = (w.domains || []).every((d) => d.managedBy === 'client') && (w.domains || []).length ? 'client' : 'thinkb';
      const deploy = box(w.deploy?.method ? 'deploy' : 'none', 'rocket', 'Deploy', w.deploy?.method || '—');
      const link = w.url
        ? `<a href="${esc(w.url)}" target="_blank" rel="noopener" class="url" data-stop>${esc(host(w))} ${ic('link')}</a>`
        : `<span class="url">${esc(siteSub(w))}</span>`;
      return `
        <article class="site-card" data-site="${esc(w.id)}" tabindex="0">
          <div class="site-card-head">
            <span class="site-fav lg" style="--h:${hue(w.id)}">${esc(w.name[0])}</span>
            <div><h3>${esc(w.name)}</h3>${link}</div>
            ${badge(w.status)}
          </div>
          ${known(w.progress) ? `<div class="site-card-prog"><div class="row-between"><small class="muted">Progress</small><b>${w.progress}%</b></div>${progressBar(w.progress, STATUS[w.status]?.cls)}</div>` : ''}
          <div class="exp-row">${exp('Domain', domainOwner)}${exp('Server', w.server?.managedBy)}${deploy}</div>
          <div class="site-card-foot">
            <span class="pending-count ${pend ? '' : 'zero'}">${ic('list')}${pend} pending</span>
            <span class="avatars">${people.map((m) => avatar(m, 'sm')).join('')}</span>
          </div>
        </article>`;
    }).join('');
  }

  function viewWebsites() {
    const counts = { all: DATA.websites.length };
    DATA.websites.forEach((w) => { counts[w.status] = (counts[w.status] || 0) + 1; });
    const chips = [['all', 'All'], ...Object.entries(STATUS).map(([k, s]) => [k, s.label])]
      .filter(([k]) => k === 'all' || counts[k] || state.siteFilter === k);
    if (state.siteFilter === 'notlive') chips.push(['notlive', 'Not live yet']);
    counts.notlive = DATA.websites.filter((w) => !['live', 'maintenance', 'domain'].includes(w.status)).length;
    return `
      <section class="page-head">
        <div><h1>Websites</h1><p class="muted">Every project with its status, pending work and renewal dates.</p></div>
      </section>
      <div class="toolbar">
        <label class="search">${ic('search')}<input id="site-search" placeholder="Search websites, clients, stack…" value="${esc(state.siteQuery)}"></label>
        <div class="chips">${chips.map(([k, l]) => `<button class="chip ${state.siteFilter === k ? 'active' : ''}" data-site-filter="${k}">${l}<em>${counts[k] || 0}</em></button>`).join('')}</div>
      </div>
      <div class="site-grid" id="site-grid">${siteCards()}</div>`;
  }

  function viewTasks() {
    const tasks = allTasks().filter((t) =>
      (state.taskMember === 'all' || t.assignee === state.taskMember) &&
      (state.taskSite === 'all' || t.siteId === state.taskSite));
    const prioRank = { high: 0, medium: 1, low: 2 };
    const cols = Object.keys(TASK_STATUS);
    return `
      <section class="page-head">
        <div><h1>Tasks</h1><p class="muted">${pendingTasks().length} pending across all websites.</p></div>
      </section>
      <div class="toolbar">
        <div class="chips">
          <button class="chip ${state.taskMember === 'all' ? 'active' : ''}" data-task-member="all">Everyone</button>
          ${DATA.team.map((m) => `<button class="chip ${state.taskMember === m.id ? 'active' : ''}" data-task-member="${m.id}">${avatar(m, 'xs')}${esc(m.name.split(' ')[0])}</button>`).join('')}
        </div>
        <label class="select">${ic('globe')}
          <select id="task-site">
            <option value="all">All websites</option>
            ${DATA.websites.map((w) => `<option value="${esc(w.id)}" ${state.taskSite === w.id ? 'selected' : ''}>${esc(w.name)}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="kanban">
        ${cols.map((c) => {
          const list = tasks.filter((t) => t.status === c).sort((a, b) => (prioRank[a.priority] ?? 3) - (prioRank[b.priority] ?? 3) || (a.due || '9').localeCompare(b.due || '9'));
          return `
            <section class="k-col k-${c}">
              <header><span class="k-dot"></span>${TASK_STATUS[c]}<em>${list.length}</em></header>
              <div class="k-list">${list.length ? list.map((t) => taskCard(t)).join('') : '<p class="k-empty">Nothing here</p>'}</div>
            </section>`;
        }).join('')}
      </div>`;
  }

  function viewTeam() {
    const tasks = allTasks();
    return `
      <section class="page-head">
        <div><h1>Team</h1><p class="muted">Who is doing what right now.</p></div>
      </section>
      <div class="team-grid">
        ${DATA.team.map((m) => {
          const mine = tasks.filter((t) => t.assignee === m.id);
          const open = mine.filter((t) => t.status !== 'done');
          const done = mine.length - open.length;
          const load = Math.min(100, open.length * 20);
          const owned = DATA.websites.filter((w) => w.owner === m.id || open.some((t) => t.siteId === w.id));
          const s = site(m.current?.site);
          return `
            <article class="member-card" style="--c:${m.color}">
              <div class="member-card-head">
                ${avatar(m, 'lg')}
                <div><h3>${esc(m.name)}</h3><small>${esc(m.role)}</small></div>
              </div>
              <div class="now-box">
                <small><span class="live-dot"></span>Working on now</small>
                <b>${esc(m.current?.task || 'Not set')}</b>
                ${s ? `<button class="task-site" data-site="${esc(s.id)}">${esc(s.name)}</button>` : ''}
              </div>
              <div class="stats">
                <div><b>${open.length}</b><small>Pending</small></div>
                <div><b>${done}</b><small>Done</small></div>
                <div><b>${owned.length}</b><small>Sites</small></div>
              </div>
              ${owned.length ? `<div class="owned-sites">${owned.map((w) => `<button class="tag" data-site="${esc(w.id)}"><span class="site-dot" style="--h:${hue(w.id)}"></span>${esc(w.name)}</button>`).join('')}</div>` : ''}
              <div><div class="row-between"><small class="muted">Workload</small><small class="muted">${load >= 80 ? 'Heavy' : load >= 40 ? 'Balanced' : 'Light'}</small></div>${progressBar(load, load >= 80 ? 'red' : load >= 40 ? 'amber' : 'green')}</div>
              <div class="member-tasks">
                ${open.length ? open.map((t) => taskCard(t)).join('') : empty('No pending tasks')}
              </div>
            </article>`;
        }).join('')}
      </div>`;
  }

  function calendar() {
    const m = state.calMonth || (state.calMonth = new Date(today().getFullYear(), today().getMonth(), 1));
    const first = new Date(m.getFullYear(), m.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const daysIn = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const byDay = {};
    renewals().forEach((r) => { (byDay[r.due] = byDay[r.due] || []).push(r); });
    const todayIso = iso(today());
    let cells = '';
    for (let i = 0; i < offset; i++) cells += '<span class="cal-cell blank"></span>';
    for (let d = 1; d <= daysIn; d++) {
      const key = iso(new Date(m.getFullYear(), m.getMonth(), d));
      const items = byDay[key] || [];
      const tip = items.map((r) => `${r.type}: ${r.title} (${money(r.amount, r.currency)})`).join('\n');
      cells += `<span class="cal-cell ${key === todayIso ? 'today' : ''} ${items.length ? 'has' : ''}" title="${esc(tip)}">
        <b>${d}</b>
        <span class="cal-dots">${items.map((r) => `<i class="${r.paid ? 'paid' : urgency(r.days)}"></i>`).join('')}</span>
      </span>`;
    }
    return `
      <div class="cal">
        <div class="cal-head">
          <button class="icon-btn sm" data-cal="-1" aria-label="Previous month">${ic('chevL')}</button>
          <b>${m.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</b>
          <button class="icon-btn sm" data-cal="1" aria-label="Next month">${ic('chevR')}</button>
        </div>
        <div class="cal-grid">
          ${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<span class="cal-dow">${d}</span>`).join('')}
          ${cells}
        </div>
        <div class="cal-legend"><span><i class="red"></i>≤ 7 days</span><span><i class="amber"></i>≤ 30 days</span><span><i class="green"></i>Later</span><span><i class="paid"></i>Paid</span></div>
      </div>`;
  }

  function viewRenewals() {
    const all = renewals();
    const unpaid = all.filter((r) => !r.paid);
    const sum = (l) => sumMoney(l);
    const week = unpaid.filter((r) => r.days >= 0 && r.days <= CONFIG.alertDays);
    const month = unpaid.filter((r) => r.days >= 0 && r.days <= 30);
    const overdue = unpaid.filter((r) => r.days < 0);
    // Monthly charges count 12 times in a year.
    const yearCost = sumMoney(all.filter((r) => r.days >= -30 && r.days <= 365), (r) => (r.monthly ? 12 : 1));
    const types = ['all', ...new Set(all.map((r) => r.type))];
    const list = all.filter((r) => state.renewType === 'all' || r.type === state.renewType);

    return `
      <section class="page-head">
        <div><h1>Renewals & payments</h1><p class="muted">Domains, servers, SSL and subscriptions, sorted by due date.</p></div>
      </section>
      <section class="kpis kpis-4">
        <div class="kpi"><span class="kpi-icon red">${ic('alert')}</span><small>Due this week</small><b>${sum(week)}</b><em>${week.length} items</em></div>
        <div class="kpi"><span class="kpi-icon amber">${ic('calendar')}</span><small>Due in 30 days</small><b>${sum(month)}</b><em>${month.length} items</em></div>
        <div class="kpi"><span class="kpi-icon ${overdue.length ? 'red' : 'green'}">${ic('clock')}</span><small>Overdue</small><b>${overdue.length}</b><em>${sum(overdue)}</em></div>
        <div class="kpi"><span class="kpi-icon violet">${ic('wallet')}</span><small>Next 12 months</small><b>${yearCost}</b><em>${all.length} upcoming</em></div>
      </section>
      <div class="grid-renew">
        <section class="card">${calendar()}</section>
        <section class="card">
          <div class="card-head"><h2>${ic('list')}Upcoming</h2>
            <div class="chips sm">${types.map((t) => `<button class="chip ${state.renewType === t ? 'active' : ''}" data-renew-type="${esc(t)}">${t === 'all' ? 'All' : esc(t)}</button>`).join('')}</div>
          </div>
          <div class="renewal-list">${list.length ? list.map((r) => renewalRow(r)).join('') : empty('No renewals.')}</div>
        </section>
      </div>`;
  }

  // ── Website detail drawer ─────────────────────────────────
  function openSite(id) {
    const w = site(id);
    if (!w) return;
    const rs = renewals().filter((r) => r.siteId === w.id);
    const r = (type) => rs.find((x) => x.type === type);
    const expLine = (x) => (x ? `<span class="pill ${x.paid ? 'paid' : urgency(x.days)}">${x.paid ? 'Paid' : daysLabel(x.days)}</span>` : '');
    const kv = (k, v) => `<div class="kv"><small>${k}</small><b>${v || '—'}</b></div>`;
    const tasks = (w.tasks || []).map((t, i) => ({ ...t, siteId: w.id, id: `${w.id}-${i}` }));
    const open = tasks.filter((t) => t.status !== 'done');
    const done = tasks.filter((t) => t.status === 'done');

    $('#drawer').innerHTML = `
      <div class="drawer-head">
        <span class="site-fav lg" style="--h:${hue(w.id)}">${esc(w.name[0])}</span>
        <div class="drawer-title">
          <h2>${esc(w.name)}</h2>
          <div class="drawer-sub">${badge(w.status)}${w.url ? `<a href="${esc(w.url)}" target="_blank" rel="noopener" class="url">${esc(host(w))} ${ic('link')}</a>` : ''}</div>
        </div>
        <button class="icon-btn" data-close="drawer" aria-label="Close">${ic('x')}</button>
      </div>
      <div class="drawer-body">
        ${known(w.progress) ? `<div class="drawer-prog"><div class="row-between"><b>Overall progress</b><b class="grad-text">${w.progress}%</b></div>${progressBar(w.progress, STATUS[w.status]?.cls)}</div>` : ''}

        <div class="info-grid">
          ${(w.domains || []).map((d) => {
            const rd = rs.find((x) => x.type === 'Domain' && x.title === (d.name || `${w.name} domain`) && x.due === d.expiry);
            return `
              <div class="info-card">
                <h4>${ic('globe')}Domain ${expLine(rd)}</h4>
                ${d.subdomainOf
                  ? `${kv('Domain', esc(d.name))}${kv('Subdomain of', esc(d.subdomainOf))}${kv('Renewal', `With ${esc(d.subdomainOf)}`)}`
                  : d.managedBy === 'client'
                  ? `${kv('Domain', esc(d.name))}${kv('Managed by', '<span class="owner client">Client</span>')}${d.dns ? kv('DNS', esc(d.dns)) : ''}`
                  : `${kv('Domain', esc(d.name) || '<span class="muted">Not added</span>')}${kv('Bought in', esc(d.account || d.registrar))}
                     ${kv('Expiry', fmtDate(d.expiry))}${kv('Cost / yr', known(d.cost) ? money(d.cost, d.currency) : '')}`}
              </div>`;
          }).join('')}
          <div class="info-card">
            <h4>${ic('server')}Server / Hosting ${expLine(r('Server'))}</h4>
            ${w.server?.managedBy === 'client'
              ? kv('Managed by', '<span class="owner client">Client</span>')
              : `${kv('Provider', esc(w.server?.provider))}${kv('Account', esc(w.server?.account))}${kv('Plan', esc(w.server?.plan))}
                 ${w.server?.billing?.cycle === 'monthly'
                   ? `${kv('Billing', `${money(w.server.cost, w.server.currency)} / month${w.server.billing.day ? ` on the ${w.server.billing.day}th` : ''}`)}${kv('Card', esc(w.server.card))}${w.server.billing.day ? kv('Next charge', fmtDate(r('Server')?.due)) : ''}`
                   : `${kv('Expiry', fmtDate(w.server?.expiry))}${kv('Cost', known(w.server?.cost) ? money(w.server.cost, w.server.currency) : '')}`}`}
          </div>
          <div class="info-card">
            <h4>${ic('rocket')}Deployment</h4>
            ${kv('Method', esc(w.deploy?.method))}${kv('Account / access', esc(w.deploy?.account))}
          </div>
          ${w.ssl ? `
          <div class="info-card">
            <h4>${ic('shield')}SSL ${expLine(r('SSL'))}</h4>
            ${kv('Provider', esc(w.ssl.provider))}${kv('Expiry', fmtDate(w.ssl.expiry))}
          </div>` : ''}
          <div class="info-card">
            <h4>${ic('briefcase')}Client</h4>
            ${kv('Client', esc(w.client?.name))}${kv('Contact', esc(w.client?.contact))}
            ${kv('Developer', esc(member(w.owner)?.name))}
            ${w.startDate ? kv('Started', fmtDate(w.startDate)) : ''}${w.launchDate ? kv('Launch', fmtDate(w.launchDate)) : ''}
          </div>
        </div>

        ${(w.stack || []).length ? `<div class="stack">${w.stack.map((s) => `<span class="tag">${esc(s)}</span>`).join('')}</div>` : ''}

        <section class="d-section">
          <h3>${ic('list')}Pending work <em>${open.length}</em></h3>
          <div class="d-tasks">${open.length ? open.map((t) => taskCard(t, { showSite: false })).join('') : empty('Nothing pending 🎉')}</div>
          ${done.length ? `<details class="done-list"><summary>${done.length} completed</summary><div class="d-tasks">${done.map((t) => taskCard(t, { showSite: false })).join('')}</div></details>` : ''}
        </section>

        <section class="d-section">
          <h3>${ic('activity')}Updates</h3>
          ${(w.updates || []).length ? `<ol class="timeline">${[...w.updates].sort((a, b) => b.date.localeCompare(a.date)).map((u) => {
            const m = member(u.by);
            return `<li><span class="t-dot" style="--c:${m?.color || '#7C5CFF'}"></span><div><p>${esc(u.text)}</p><small>${esc(m?.name || '')} · ${fmtDate(u.date)}</small></div></li>`;
          }).join('')}</ol>` : empty('No updates yet.')}
        </section>

        ${w.notes ? `<section class="d-section"><h3>${ic('note')}Notes</h3><p class="notes">${esc(w.notes)}</p></section>` : ''}
      </div>`;
    $('#drawer').classList.add('open');
    $('#drawer').setAttribute('aria-hidden', 'false');
    $('#drawer-overlay').classList.add('show');
    document.body.classList.add('locked');
    $('#drawer').scrollTop = 0;
  }

  function closeDrawer() {
    $('#drawer').classList.remove('open');
    $('#drawer').setAttribute('aria-hidden', 'true');
    $('#drawer-overlay').classList.remove('show');
    if (!$('#alert-modal').classList.contains('open')) document.body.classList.remove('locked');
  }

  // ── Payments-due popup ────────────────────────────────────
  function renderAlerts() {
    const due = dueSoon();
    const total = sumMoney(due);
    const overdue = due.filter((r) => r.days < 0);
    const upcoming = due.filter((r) => r.days >= 0);
    $('#alert-modal .modal').innerHTML = `
      <div class="modal-glow"></div>
      <button class="icon-btn modal-x" data-close="alerts" aria-label="Close">${ic('x')}</button>
      <div class="modal-head">
        <span class="alert-icon">${ic(due.length ? 'bell' : 'check')}</span>
        <div>
          <h2 id="alert-title">${!due.length ? 'All clear' : overdue.length ? 'Payments need attention' : 'Payments due this week'}</h2>
          <p class="muted">${due.length
            ? [overdue.length && `${overdue.length} overdue`, upcoming.length && `${upcoming.length} due in the next ${CONFIG.alertDays} days`].filter(Boolean).join(' · ')
            : `No payments due in the next ${CONFIG.alertDays} days.`}</p>
        </div>
      </div>
      ${due.length ? `
        <div class="modal-list">${due.map((r) => renewalRow(r)).join('')}</div>
        <div class="modal-total"><span>Total due</span><b>${total}</b></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-action="snooze">Remind me later</button>
          <a href="#renewals" class="btn btn-primary" data-close="alerts">View renewals ${ic('chevR')}</a>
        </div>` : `
        <div class="modal-actions"><button class="btn btn-primary" data-close="alerts">Great</button></div>`}`;
  }

  function openAlerts() {
    renderAlerts();
    $('#alert-modal').classList.add('open');
    $('#alert-modal').setAttribute('aria-hidden', 'false');
    document.body.classList.add('locked');
  }

  function closeAlerts() {
    $('#alert-modal').classList.remove('open');
    $('#alert-modal').setAttribute('aria-hidden', 'true');
    if (!$('#drawer').classList.contains('open')) document.body.classList.remove('locked');
  }

  function setPaid(id, paid) {
    const list = new Set(store.get('tb_paid', []));
    paid ? list.add(id) : list.delete(id);
    store.set('tb_paid', [...list]);
    toast(paid ? 'Marked as paid' : 'Marked as unpaid');
    refresh();
    if ($('#alert-modal').classList.contains('open')) {
      if (paid && !dueSoon().length) closeAlerts();
      else renderAlerts();
    }
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.innerHTML = `${ic('check')}${esc(msg)}`;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ── Router ────────────────────────────────────────────────
  const VIEWS = {
    overview: ['Overview', viewOverview],
    websites: ['Websites', viewWebsites],
    tasks: ['Tasks', viewTasks],
    team: ['Team', viewTeam],
    renewals: ['Renewals', viewRenewals],
  };
  const current = () => (VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'overview');

  function render(scroll = true) {
    const v = current();
    const [title, fn] = VIEWS[v];
    $('#view').innerHTML = fn();
    $('#view').dataset.view = v;
    $('#view-title').textContent = title;
    document.title = `${title} · ${CONFIG.appName}`;
    $$('[data-view]').forEach((a) => a.classList.toggle('active', a.dataset.view === v));
    if (scroll) window.scrollTo({ top: 0 });
  }

  function refresh() {
    render(false);
    updateCounts();
  }

  function updateCounts() {
    const due = dueSoon().length;
    const set = (k, val) => $$(`[data-count="${k}"]`).forEach((el) => { el.textContent = val; el.hidden = !val; });
    set('sites', DATA.websites.length);
    set('tasks', pendingTasks().length);
    set('due', due);
    $$('[data-count="due-dot"]').forEach((el) => { el.hidden = !due; });
    const dot = $('#bell-dot');
    dot.textContent = due;
    dot.hidden = !due;
  }

  // ── Events ────────────────────────────────────────────────
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-stop]')) return;

    const closer = t.closest('[data-close]');
    if (closer) {
      closer.dataset.close === 'drawer' ? closeDrawer() : closeAlerts();
      if (closer.tagName !== 'A') return;
    }

    const paid = t.closest('[data-paid]');
    if (paid) { e.stopPropagation(); return setPaid(paid.dataset.paid, true); }
    const unpaid = t.closest('[data-unpaid]');
    if (unpaid) return setPaid(unpaid.dataset.unpaid, false);

    const s = t.closest('[data-site]');
    if (s) { closeAlerts(); return openSite(s.dataset.site); }

    const action = t.closest('[data-action]');
    if (action) {
      const a = action.dataset.action;
      if (a === 'logout') return Auth.logout();
      if (a === 'alerts') return openAlerts();
      if (a === 'snooze') {
        store.set('tb_snooze', iso(today()));
        toast("We'll remind you tomorrow");
        return closeAlerts();
      }
    }

    const fl = t.closest('[data-filter-link]');
    if (fl) state.siteFilter = fl.dataset.filterLink;
    else if (t.closest('a[href="#websites"]')) state.siteFilter = 'all';

    const sf = t.closest('[data-site-filter]');
    if (sf) {
      state.siteFilter = sf.dataset.siteFilter;
      $$('[data-site-filter]').forEach((c) => c.classList.toggle('active', c === sf));
      $('#site-grid').innerHTML = siteCards();
      return;
    }

    const tm = t.closest('[data-task-member]');
    if (tm) { state.taskMember = tm.dataset.taskMember; return render(false); }

    const rt = t.closest('[data-renew-type]');
    if (rt) { state.renewType = rt.dataset.renewType; return render(false); }

    const cal = t.closest('[data-cal]');
    if (cal) {
      const m = state.calMonth;
      state.calMonth = new Date(m.getFullYear(), m.getMonth() + Number(cal.dataset.cal), 1);
      return render(false);
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.id === 'site-search') {
      state.siteQuery = e.target.value;
      $('#site-grid').innerHTML = siteCards();
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'task-site') { state.taskSite = e.target.value; render(false); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeAlerts(); closeDrawer(); }
    if (e.key === 'Enter' && e.target.matches('.site-card')) openSite(e.target.dataset.site);
  });

  window.addEventListener('hashchange', () => { closeDrawer(); render(); });

  // ── Boot ──────────────────────────────────────────────────
  $$('[data-icon]').forEach((el) => { el.outerHTML = ic(el.dataset.icon); });
  $('#side-name').textContent = CONFIG.leadName;
  $('#side-avatar').textContent = initials(CONFIG.leadName);
  $('#today-label').textContent = today().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  render();
  updateCounts();

  if (dueSoon().length && store.get('tb_snooze', '') !== iso(today())) {
    setTimeout(openAlerts, 600);
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
