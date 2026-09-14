/* SplitEZ Admin panel — vanilla SPA served at /admin */
(() => {
  'use strict';

  const API = '/api/v1';
  const TOKEN_KEY = 'splitez_admin_token';
  const THEME_KEY = 'splitez_admin_theme';

  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, props = {}, children = []) => {
    const node = Object.assign(document.createElement(tag), props);
    for (const c of [].concat(children)) {
      if (c != null) node.append(c.nodeType ? c : document.createTextNode(c));
    }
    return node;
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString());
  const date = (d) => (d ? new Date(d).toLocaleDateString() : '—');

  let token = null;
  const charts = [];

  // ── API helper ─────────────────────────────────────────────────────────
  async function api(path, opts = {}) {
    const res = await fetch(API + path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(opts.headers || {}),
      },
    });
    if (res.status === 401) {
      logout();
      throw new Error('Session expired — please log in again.');
    }
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error((data && (data.message || data.error)) || res.statusText);
    return data;
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), 2600);
  }

  // ── Auth ─────────────────────────────────────────────────────────────
  function showLogin() {
    $('#login').hidden = false;
    $('#app').hidden = true;
  }
  function showApp() {
    $('#login').hidden = true;
    $('#app').hidden = false;
    navigate('overview');
  }
  function logout() {
    token = null;
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    showLogin();
  }

  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errBox = $('#login-error');
    errBox.hidden = true;
    const f = e.target;
    try {
      const r = await api('/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          username: f.username.value,
          password: f.password.value,
        }),
      });
      token = r.token;
      try { localStorage.setItem(TOKEN_KEY, token); } catch {}
      f.reset();
      showApp();
    } catch (err) {
      errBox.textContent = err.message;
      errBox.hidden = false;
    }
  });

  $('#logout').addEventListener('click', logout);

  // ── Theme ──────────────────────────────────────────────────────────────
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(THEME_KEY, t); } catch {}
  }
  $('#theme-toggle').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    if (currentView) navigate(currentView); // re-render charts with new colors
  });

  // ── Navigation ─────────────────────────────────────────────────────────
  const TITLES = {
    overview: 'Overview', analytics: 'Analytics', users: 'Users',
    banners: 'Promotional Banners', elements: 'Dashboard Elements', ads: 'Ad Placements',
    pages: 'Content Pages',
  };
  let currentView = null;

  $('#nav').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-view]');
    if (btn) navigate(btn.dataset.view);
  });

  function navigate(view) {
    currentView = view;
    for (const b of document.querySelectorAll('#nav button[data-view]')) {
      b.classList.toggle('active', b.dataset.view === view);
    }
    $('#view-title').textContent = TITLES[view] || view;
    charts.forEach((c) => c.destroy());
    charts.length = 0;
    const host = $('#view');
    host.innerHTML = '<div class="loading">Loading…</div>';
    VIEWS[view](host).catch((err) => {
      host.innerHTML = '';
      host.append(el('div', { className: 'error' }, err.message));
    });
  }

  // ── Chart helpers ────────────────────────────────────────────────────
  function themeColors() {
    const s = getComputedStyle(document.documentElement);
    return {
      accent: s.getPropertyValue('--accent').trim(),
      grid: s.getPropertyValue('--border').trim(),
      text: s.getPropertyValue('--muted').trim(),
    };
  }
  const PALETTE = ['#4338CA', '#818CF8', '#2EC770', '#F5A623', '#EB5757', '#12b5b0'];

  function lineChart(canvas, labels, data, label) {
    const c = themeColors();
    charts.push(new Chart(canvas, {
      type: 'line',
      data: { labels, datasets: [{ label, data, borderColor: c.accent,
        backgroundColor: c.accent + '22', fill: true, tension: 0.3, pointRadius: 2 }] },
      options: { responsive: true, plugins: { legend: { display: false } },
        scales: { x: { grid: { color: c.grid }, ticks: { color: c.text, maxTicksLimit: 8 } },
          y: { grid: { color: c.grid }, ticks: { color: c.text }, beginAtZero: true } } },
    }));
  }
  function doughnut(canvas, labels, data) {
    const c = themeColors();
    charts.push(new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: PALETTE, borderWidth: 0 }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom',
        labels: { color: c.text } } } },
    }));
  }
  function barChart(canvas, labels, data, label) {
    const c = themeColors();
    charts.push(new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: [{ label, data, backgroundColor: c.accent, borderRadius: 4 }] },
      options: { responsive: true, plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false }, ticks: { color: c.text } },
          y: { grid: { color: c.grid }, ticks: { color: c.text }, beginAtZero: true } } },
    }));
  }

  function kpi(label, value, sub) {
    return el('div', { className: 'card kpi' }, [
      el('div', { className: 'label' }, label),
      el('div', { className: 'value' }, value),
      sub ? el('div', { className: 'sub' }, sub) : null,
    ]);
  }

  // ── Views ───────────────────────────────────────────────────────────
  const VIEWS = {};

  VIEWS.overview = async (host) => {
    const [stats, installs, stick] = await Promise.all([
      api('/admin/users/stats'),
      api('/analytics/installs'),
      api('/analytics/stickiness'),
    ]);
    host.innerHTML = '';

    const grid = el('div', { className: 'kpi-grid' }, [
      kpi('Total users', fmt(stats.totalUsers), `${fmt(stats.new30d)} in last 30d`),
      kpi('New (7 days)', fmt(stats.new7d), `${fmt(stats.newToday)} today`),
      kpi('Verified', stats.verifiedPct + '%', `${fmt(stats.verifiedUsers)} users`),
      kpi('Total installs', fmt(installs.total), `${fmt(installs.activeInstalls)} active (30d)`),
      kpi('DAU / MAU', (stick.stickiness ?? 0) + '%', `avg DAU ${fmt(stick.avgDau)} · MAU ${fmt(stick.mau)}`),
    ]);
    host.append(grid);

    const cvSignups = el('canvas');
    const cvPlatform = el('canvas');
    host.append(el('div', { className: 'chart-grid' }, [
      el('div', { className: 'card' }, [el('h3', {}, 'New signups (30 days)'), cvSignups]),
      el('div', { className: 'card' }, [el('h3', {}, 'Installs by platform'), cvPlatform]),
    ]));
    lineChart(cvSignups, stats.signups.map((s) => s.date.slice(5)),
      stats.signups.map((s) => s.count), 'Signups');
    if (installs.byPlatform.length) {
      doughnut(cvPlatform, installs.byPlatform.map((p) => p.platform),
        installs.byPlatform.map((p) => p.count));
    } else {
      cvPlatform.replaceWith(el('div', { className: 'loading' }, 'No install data yet'));
    }
  };

  VIEWS.analytics = async (host) => {
    const [dau, mau, platforms, events, journeys] = await Promise.all([
      api('/analytics/dau?days=30'),
      api('/analytics/mau?months=12'),
      api('/analytics/platforms?days=30'),
      api('/analytics/events/breakdown?days=7'),
      api('/analytics/journeys?days=7&limit=10'),
    ]);
    host.innerHTML = '';

    const cvDau = el('canvas'), cvMau = el('canvas'),
      cvPlat = el('canvas'), cvEvents = el('canvas');
    host.append(el('div', { className: 'chart-grid' }, [
      el('div', { className: 'card' }, [el('h3', {}, 'Daily active users (30d)'), cvDau]),
      el('div', { className: 'card' }, [el('h3', {}, 'Active users by platform'), cvPlat]),
    ]));
    host.append(el('div', { className: 'chart-grid' }, [
      el('div', { className: 'card' }, [el('h3', {}, 'Monthly active users'), cvMau]),
      el('div', { className: 'card' }, [el('h3', {}, 'Event breakdown (7d)'), cvEvents]),
    ]));

    dau.length ? lineChart(cvDau, dau.map((r) => String(r.day).slice(5, 10)),
      dau.map((r) => r.count), 'DAU') : empty(cvDau);
    mau.length ? barChart(cvMau, mau.map((r) => r.month), mau.map((r) => r.count), 'MAU') : empty(cvMau);
    platforms.length ? doughnut(cvPlat, platforms.map((r) => r.platform),
      platforms.map((r) => r.users)) : empty(cvPlat);
    events.length ? barChart(cvEvents, events.map((r) => r.event), events.map((r) => r.count), 'Events')
      : empty(cvEvents);

    const jt = table(['From', 'To', 'Transitions'],
      journeys.map((j) => [j.from, j.to, fmt(j.count)]));
    host.append(el('div', { className: 'card', style: 'margin-top:16px' },
      [el('h3', {}, 'Top user journeys (7d)'), journeys.length ? jt : el('div', { className: 'loading' }, 'No journey data yet')]));

    function empty(cv) { cv.replaceWith(el('div', { className: 'loading' }, 'No data yet')); }
  };

  var USER_FIELDS = [
    { key: 'firstName', label: 'First name', required: true },
    { key: 'lastName', label: 'Last name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'countryCode', label: 'Country code' },
    { key: 'currency', label: 'Currency', type: 'select', options: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'], default: 'INR' },
    { key: 'isVerified', label: 'Verified', type: 'checkbox', default: false },
    { key: 'emailVerified', label: 'Email verified', type: 'checkbox', default: false },
    { key: 'adFree', label: 'Ad-free', type: 'checkbox', default: false },
  ];

  VIEWS.users = async (host) => {
    let page = 1, search = '';
    const render = async () => {
      const q = `?page=${page}&pageSize=25${search ? '&search=' + encodeURIComponent(search) : ''}`;
      const data = await api('/admin/users' + q);
      host.innerHTML = '';
      const input = el('input', { placeholder: 'Search name, email, phone…', value: search });
      const searchBtn = el('button', { className: 'btn' }, 'Search');
      const form = el('form', { className: 'toolbar' }, [input, searchBtn,
        el('span', { className: 'muted' }, `${fmt(data.total)} users`)]);
      form.addEventListener('submit', (e) => { e.preventDefault(); search = input.value; page = 1; render(); });
      host.append(form);

      const rows = data.users.map((u) => {
        const editBtn = el('button', { className: 'btn secondary small' }, 'Edit');
        const delBtn = el('button', { className: 'btn danger small' }, 'Delete');
        editBtn.addEventListener('click', () => openUserForm(u, render));
        delBtn.addEventListener('click', async () => {
          if (!(await confirmAction('Delete this user and ALL their data? This cannot be undone.'))) return;
          try {
            await api(`/admin/users/${u.id}`, { method: 'DELETE' });
            toast('User deleted');
            render();
          } catch (err) { toast('Error: ' + err.message); }
        });
        return [
          esc([u.firstName, u.lastName].filter(Boolean).join(' ')) || '—',
          esc(u.email) || '—',
          u.phone ? esc(u.countryCode + ' ' + u.phone) : '—',
          tag(u.isVerified ? 'Active' : 'Inactive', u.isVerified ? 'Yes' : 'No'),
          tag(u.adFree ? 'Active' : 'Inactive', u.adFree ? 'Yes' : 'No'),
          date(u.createdAt),
          el('div', { className: 'row-actions' }, [editBtn, delBtn]),
        ];
      });
      host.append(table(
        ['Name', 'Email', 'Phone', 'Verified', 'Ad-free', 'Joined', ''],
        rows, true));

      const prev = el('button', { className: 'btn secondary small', disabled: page <= 1 }, 'Prev');
      const next = el('button', { className: 'btn secondary small', disabled: page >= data.pageCount }, 'Next');
      prev.addEventListener('click', () => { page--; render(); });
      next.addEventListener('click', () => { page++; render(); });
      host.append(el('div', { className: 'pager' },
        [prev, el('span', { className: 'muted' }, `Page ${data.page} / ${Math.max(1, data.pageCount)}`), next]));
    };
    await render();
  };

  function openUserForm(user, onDone) {
    const form = $('#modal-form');
    $('#modal-title').textContent = 'Edit User';
    form.innerHTML = '';
    const grid = el('div', { className: 'grid-2' });
    for (const f of USER_FIELDS) {
      grid.append(fieldControl(f, user[f.key]));
    }
    form.append(grid);
    const cancel = el('button', { type: 'button', className: 'btn secondary' }, 'Cancel');
    cancel.addEventListener('click', closeModal);
    form.append(el('div', { className: 'actions' }, [cancel,
      el('button', { type: 'submit', className: 'btn' }, 'Save')]));

    form.onsubmit = async (e) => {
      e.preventDefault();
      const body = {};
      for (const f of USER_FIELDS) {
        let v = form.elements[f.key].value;
        if (f.type === 'checkbox') { body[f.key] = form.elements[f.key].checked; continue; }
        if (v === '' && !f.required) continue;
        body[f.key] = v;
      }
      try {
        await api(`/admin/users/${user.id}`, { method: 'PUT', body: JSON.stringify(body) });
        toast('User updated');
        closeModal();
        onDone();
      } catch (err) { toast('Error: ' + err.message); }
    };
    $('#modal').hidden = false;
  }

  // ── CMS views (full CRUD) ───────────────────────────────────────────
  VIEWS.banners = (host) => crud(host, {
    list: '/admin/banners', base: '/admin/banners', name: 'Banner',
    columns: ['Title', 'Screen', 'Priority', 'Status', 'Window'],
    row: (b) => [esc(b.title), esc(b.targetScreen), b.priority,
      tag(b.status, b.status), `${date(b.startDate)} → ${date(b.endDate)}`],
    fields: BANNER_FIELDS,
  });

  VIEWS.elements = (host) => crud(host, {
    list: '/admin/dashboard-elements', base: '/admin/dashboard-elements', name: 'Element',
    columns: ['Type', 'Title', 'Screen', 'Position', 'Status'],
    row: (e) => [esc(e.type), esc(e.title) || '—', esc(e.targetScreen), e.position,
      tag(e.status, e.status)],
    fields: ELEMENT_FIELDS,
  });

  VIEWS.ads = (host) => crud(host, {
    list: '/admin/ads', base: '/admin/ads', name: 'Ad placement',
    columns: ['Name', 'Type', 'Platform', 'Screen', 'Enabled'],
    row: (a) => [esc(a.name), esc(a.adType), esc(a.platform), esc(a.screen),
      tag(a.enabled ? 'Active' : 'Inactive', a.enabled ? 'On' : 'Off')],
    fields: AD_FIELDS,
  });

  // Generic CRUD renderer + modal editor
  async function crud(host, cfg) {
    const items = await api(cfg.list);
    host.innerHTML = '';
    const add = el('button', { className: 'btn' }, '+ New ' + cfg.name);
    add.addEventListener('click', () => openForm(cfg, null));
    host.append(el('div', { className: 'toolbar' }, [add,
      el('span', { className: 'muted' }, `${items.length} item(s)`)]));

    const rows = items.map((it) => {
      const cells = cfg.row(it).map((c) => c);
      const editBtn = el('button', { className: 'btn secondary small' }, 'Edit');
      const delBtn = el('button', { className: 'btn danger small' }, 'Delete');
      editBtn.addEventListener('click', () => openForm(cfg, it));
      delBtn.addEventListener('click', async () => {
        if (!(await confirmAction(`Delete this ${cfg.name.toLowerCase()}?`))) return;
        try {
          await api(`${cfg.base}/${it.id}`, { method: 'DELETE' });
          toast(cfg.name + ' deleted');
          navigate(currentView);
        } catch (err) { toast('Error: ' + err.message); }
      });
      return cells.concat([el('div', { className: 'row-actions' }, [editBtn, delBtn])]);
    });
    host.append(items.length
      ? table(cfg.columns.concat(['']), rows, true)
      : el('div', { className: 'loading' }, 'Nothing here yet — create one.'));
  }

  function openForm(cfg, item) {
    const form = $('#modal-form');
    $('#modal-title').textContent = (item ? 'Edit ' : 'New ') + cfg.name;
    form.innerHTML = '';
    const grid = el('div', { className: 'grid-2' });
    for (const f of cfg.fields) {
      const val = item ? item[f.key] : f.default;
      grid.append(fieldControl(f, val));
    }
    form.append(grid);
    const cancel = el('button', { type: 'button', className: 'btn secondary' }, 'Cancel');
    cancel.addEventListener('click', closeModal);
    form.append(el('div', { className: 'actions' }, [cancel,
      el('button', { type: 'submit', className: 'btn' }, item ? 'Save' : 'Create')]));

    form.onsubmit = async (e) => {
      e.preventDefault();
      const body = {};
      for (const f of cfg.fields) {
        let v = form.elements[f.key].value;
        if (v === '' && !f.required) continue;
        if (f.type === 'number') v = Number(v);
        else if (f.type === 'checkbox') v = form.elements[f.key].checked;
        else if (f.type === 'json') { try { v = JSON.parse(v || '{}'); } catch { toast('Invalid JSON in ' + f.label); return; } }
        else if (f.type === 'datetime') v = new Date(v).toISOString();
        body[f.key] = v;
      }
      try {
        await api(item ? `${cfg.base}/${item.id}` : cfg.base,
          { method: item ? 'PUT' : 'POST', body: JSON.stringify(body) });
        toast(cfg.name + (item ? ' updated' : ' created'));
        closeModal();
        navigate(currentView);
      } catch (err) { toast('Error: ' + err.message); }
    };
    $('#modal').hidden = false;
  }

  function fieldControl(f, val) {
    if (f.type === 'checkbox') {
      const input = el('input', { type: 'checkbox', name: f.key, style: 'width:auto' });
      input.checked = val === undefined ? !!f.default : !!val;
      return el('label', { style: 'display:flex;gap:8px;align-items:center' }, [input, f.label]);
    }
    let input;
    if (f.type === 'select') {
      input = el('select', { name: f.key });
      for (const o of f.options) input.append(el('option', { value: o, selected: val === o }, o));
    } else if (f.type === 'textarea' || f.type === 'json') {
      const v = f.type === 'json' && val && typeof val === 'object' ? JSON.stringify(val, null, 2) : (val ?? '');
      input = el('textarea', { name: f.key, rows: 3, value: v });
    } else {
      let v = val ?? '';
      if (f.type === 'datetime' && val) v = new Date(val).toISOString().slice(0, 16);
      input = el('input', { name: f.key, type: f.type === 'datetime' ? 'datetime-local' : (f.type || 'text'),
        value: v, required: !!f.required });
    }
    return el('label', {}, [f.label + (f.required ? ' *' : ''), input]);
  }

  function closeModal() { $('#modal').hidden = true; $('#modal-form').innerHTML = ''; }
  $('#modal-close').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

  // Custom confirm dialog (replaces native confirm to avoid browser pop-ups)
  function confirmAction(msg) {
    return new Promise((resolve) => {
      const wrap = el('div', { className: 'confirm-wrap' });
      const yes = el('button', { className: 'btn danger' }, 'Delete');
      const no = el('button', { className: 'btn secondary' }, 'Cancel');
      wrap.append(el('div', { className: 'confirm-box' }, [
        el('p', {}, msg), el('div', { className: 'actions' }, [no, yes]),
      ]));
      const close = (v) => { wrap.remove(); resolve(v); };
      yes.addEventListener('click', () => close(true));
      no.addEventListener('click', () => close(false));
      wrap.addEventListener('click', (e) => { if (e.target === wrap) close(false); });
      document.body.append(wrap);
    });
  }

  // ── Small DOM builders ─────────────────────────────────────────────
  function tag(cls, text) {
    return el('span', { className: 'tag ' + cls, innerHTML: esc(text) });
  }
  function table(headers, rows, allowHtml) {
    const thead = el('tr', {}, headers.map((h) => el('th', {}, h)));
    const trs = rows.map((r) => el('tr', {}, r.map((c) => {
      const td = el('td');
      if (c && c.nodeType) td.append(c);
      else if (allowHtml) td.innerHTML = c;
      else td.textContent = c;
      return td;
    })));
    return el('table', {}, [el('thead', {}, thead), el('tbody', {}, trs)]);
  }

  // ── Field schemas ──────────────────────────────────────────────────
  const SCREENS = ['home', 'groups', 'trips', 'finances', 'settings', 'more'];

  var BANNER_FIELDS = [
    { key: 'title', label: 'Title', required: true },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'image', label: 'Image URL' },
    { key: 'cta', label: 'CTA text' },
    { key: 'destination', label: 'Destination (deep link/URL)' },
    { key: 'targetScreen', label: 'Target screen', type: 'select', options: SCREENS, default: 'home', required: true },
    { key: 'startDate', label: 'Start', type: 'datetime', required: true },
    { key: 'endDate', label: 'End', type: 'datetime', required: true },
    { key: 'priority', label: 'Priority', type: 'number', default: 0 },
    { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Inactive', 'Expired'], default: 'Draft' },
  ];

  var ELEMENT_FIELDS = [
    { key: 'type', label: 'Type', type: 'select',
      options: ['greeting', 'banner', 'card', 'announcement', 'tip', 'spotlight'], default: 'card', required: true },
    { key: 'title', label: 'Title' },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'body', label: 'Body (markdown)', type: 'textarea' },
    { key: 'image', label: 'Image URL' },
    { key: 'cta', label: 'CTA text' },
    { key: 'destination', label: 'Destination' },
    { key: 'targetScreen', label: 'Target screen', type: 'select', options: SCREENS, default: 'home' },
    { key: 'position', label: 'Position', type: 'number', default: 0 },
    { key: 'config', label: 'Config (JSON)', type: 'json', default: {} },
    { key: 'startDate', label: 'Start', type: 'datetime' },
    { key: 'endDate', label: 'End', type: 'datetime' },
    { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Active', 'Inactive'], default: 'Draft' },
  ];

  var AD_FIELDS = [
    { key: 'name', label: 'Name (unique key)', required: true },
    { key: 'adType', label: 'Ad type', type: 'select', options: ['banner', 'interstitial', 'native', 'rewarded'], default: 'banner', required: true },
    { key: 'platform', label: 'Platform', type: 'select', options: ['all', 'ios', 'android'], default: 'all' },
    { key: 'screen', label: 'Screen', type: 'select', options: SCREENS, default: 'home', required: true },
    { key: 'position', label: 'Position', type: 'select', options: ['top', 'bottom', 'inline', 'after_item'], default: 'bottom' },
    { key: 'adUnitIos', label: 'AdMob unit (iOS)' },
    { key: 'adUnitAndroid', label: 'AdMob unit (Android)' },
    { key: 'frequency', label: 'Frequency (every N)', type: 'number', default: 1 },
    { key: 'enabled', label: 'Enabled', type: 'checkbox', default: true },
    { key: 'adFreeSkip', label: 'Skip for ad-free users', type: 'checkbox', default: true },
  ];

  var PAGE_FIELDS = [
    { key: 'slug', label: 'Slug (URL key)', required: true },
    { key: 'title', label: 'Title', required: true },
    { key: 'body', label: 'Body (markdown / HTML)', type: 'textarea' },
    { key: 'category', label: 'Category', type: 'select', options: ['legal', 'info', 'support'], default: 'legal' },
    { key: 'published', label: 'Published', type: 'checkbox', default: false },
    { key: 'sortOrder', label: 'Sort order', type: 'number', default: 0 },
    { key: 'metaTitle', label: 'Meta title' },
    { key: 'metaDesc', label: 'Meta description' },
  ];

  VIEWS.pages = (host) => crud(host, {
    list: '/admin/content-pages', base: '/admin/content-pages', name: 'Content Page',
    columns: ['Title', 'Slug', 'Category', 'Published', 'Updated'],
    row: (p) => [esc(p.title), esc(p.slug), esc(p.category),
      tag(p.published ? 'Active' : 'Draft', p.published ? 'Yes' : 'No'),
      date(p.updatedAt)],
    fields: PAGE_FIELDS,
  });

  // ── Boot ────────────────────────────────────────────────────────────
  try { applyTheme(localStorage.getItem(THEME_KEY) || 'light'); } catch {}
  try { token = localStorage.getItem(TOKEN_KEY); } catch {}

  (async () => {
    if (token) {
      try { await api('/admin/me'); showApp(); return; } catch {}
    }
    showLogin();
  })();
})();
