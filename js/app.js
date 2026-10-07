/**
 * SevaSetu NGO Platform — Application Controller
 * Formal, Enterprise-Grade Civic NGO Management Interface
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ── State ── */
  const S = {
    view: 'dashboard',
    theme: localStorage.getItem('ss_theme') || 'light',
    vFilter: { search: '', skill: 'All', status: 'All' },
    dFilter: { search: '', tier: 'All', type: 'All' },
    txFilter: { search: '', campaign: 'All' },
    openVolId: null, openDonorId: null
  };

  /* ── Helpers ── */
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function initials(name) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');
  }

  function toast(title, msg, kind = 'info') {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const t = document.createElement('div');
    t.className = `toast s-${kind}`;
    t.innerHTML = `
      <div class="toast-body">
        <div class="toast-title">${esc(title)}</div>
        <div class="toast-msg">${esc(msg)}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Dismiss">✕</button>
    `;
    stack.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }, 4200);
  }

  window.toast = toast;

  /* ── Theme ── */
  function applyTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    localStorage.setItem('ss_theme', name);
    S.theme = name;
    const btn = document.getElementById('themeBtn');
    if (btn) btn.innerHTML = name === 'dark'
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    if (S.view === 'dashboard') renderCharts();
  }

  document.getElementById('themeBtn')?.addEventListener('click', () => {
    applyTheme(S.theme === 'dark' ? 'light' : 'dark');
    toast('Appearance', `Switched to ${S.theme === 'dark' ? 'dark' : 'light'} mode.`);
  });

  applyTheme(S.theme);

  /* ── Navigation ── */
  document.querySelectorAll('.nav-link[data-view]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigate(el.dataset.view); });
  });

  document.getElementById('mobileToggleBtn')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.toggle('open');
  });

  document.addEventListener('click', e => {
    const sb = document.querySelector('.sidebar');
    if (sb && !sb.contains(e.target) && !document.getElementById('mobileToggleBtn')?.contains(e.target))
      sb.classList.remove('open');
  });

  function navigate(viewName) {
    S.view = viewName;
    document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.view === viewName));

    const titles = {
      dashboard: { title: 'Dashboard', trail: 'Overview' },
      volunteers: { title: 'Volunteer Directory', trail: 'Operations' },
      donors: { title: 'Donor Roster', trail: 'Philanthropy' },
      donations: { title: 'Donations Ledger', trail: 'Finance' },
      events: { title: 'Campaigns & Drives', trail: 'Operations' },
      reports: { title: 'Reports & Data Hub', trail: 'Audit' }
    };
    const info = titles[viewName] || { title: viewName, trail: '' };
    const heading  = document.getElementById('pageHeading');
    const trail    = document.getElementById('breadTrail');
    if (heading) heading.textContent = info.title;
    if (trail)   trail.innerHTML = `<span>SevaSetu</span><span class="sep">›</span><span>${info.trail}</span><span class="sep">›</span><span style="color:var(--text-primary);font-weight:600">${info.title}</span>`;

    const vp = document.getElementById('viewport');
    if (!vp) return;

    const renders = { dashboard, volunteers, donors, donations, events, reports };
    (renders[viewName] || (() => {}))(vp);

    document.querySelector('.main-area')?.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('.sidebar')?.classList.remove('open');
  }

  /* ═══════════════════════════════════════════════
     VIEWS
  ═══════════════════════════════════════════════ */

  /* ── 1. Dashboard ── */
  function dashboard(vp) {
    const st = window.SS.dashboardStats();

    vp.innerHTML = `
      <!-- Welcome Overview -->
      <div class="dash-welcome">
        <div class="dash-welcome-text">
          <h2>Executive Operations Dashboard</h2>
          <p>${st.activeVols} active personnel deployed in field operations &nbsp;·&nbsp; <strong>${window.inr(st.totalRaised)}</strong> total charitable contributions managed this cycle</p>
        </div>
        <div class="dash-welcome-actions">
          <button class="btn btn-primary" id="wbDonation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Record Donation
          </button>
          <button class="btn btn-secondary" id="wbVol">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Enroll Volunteer
          </button>
          <button class="btn btn-secondary" id="wbHours">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Log Service Hours
          </button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card c-indigo">
          <div class="kpi-top">
            <span class="kpi-label">Total Contributions</span>
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="kpi-value">${window.inr(st.totalRaised)}</div>
          <div class="kpi-footer"><span class="kpi-delta">↑ 28%</span><span>vs previous fiscal year</span></div>
        </div>

        <div class="kpi-card c-emerald">
          <div class="kpi-top">
            <span class="kpi-label">Active Volunteers</span>
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
          <div class="kpi-value">${st.activeVols} <span style="font-size:0.95rem;font-weight:500;color:var(--text-muted);">/ ${st.totalVols}</span></div>
          <div class="kpi-footer"><span class="badge b-green"><span class="badge-dot"></span> Ready for Dispatch</span></div>
        </div>

        <div class="kpi-card c-amber">
          <div class="kpi-top">
            <span class="kpi-label">Hours Logged</span>
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <div class="kpi-value">${st.totalHours.toLocaleString('en-IN')} <span style="font-size:0.95rem;font-weight:500;color:var(--text-muted);">hrs</span></div>
          <div class="kpi-footer"><span class="kpi-delta">↑ 19%</span><span>Across 5 active programs</span></div>
        </div>

        <div class="kpi-card c-rose">
          <div class="kpi-top">
            <span class="kpi-label">Active Campaigns</span>
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
          </div>
          <div class="kpi-value">${st.totalEvents}</div>
          <div class="kpi-footer"><span class="badge b-blue"><span class="badge-dot"></span> 2 upcoming drives</span></div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-row">
        <div class="chart-card">
          <div class="chart-card-hd">
            <div>
              <h3>Monthly Contributions Flow</h3>
              <p>Monthly donation inflows over past 8 billing periods</p>
            </div>
            <div class="chart-legend">
              <div style="display:flex;align-items:center;gap:5px;"><div class="leg-dot" style="background:#1d4ed8;"></div> Current Month</div>
              <div style="display:flex;align-items:center;gap:5px;"><div class="leg-dot" style="background:#3b82f6;"></div> Prior Periods</div>
            </div>
          </div>
          <div class="chart-wrap"><canvas id="barChart"></canvas></div>
        </div>

        <div class="chart-card">
          <div class="chart-card-hd">
            <div>
              <h3>Service Hours by Programme</h3>
              <p>Distribution across community initiatives</p>
            </div>
          </div>
          <div class="chart-wrap"><canvas id="donutChart"></canvas></div>
        </div>
      </div>

      <!-- Activity Split -->
      <div class="split-row">
        <!-- Recent Donations -->
        <div class="panel">
          <div class="panel-header">
            <div><div class="panel-title">Recent Contributions</div><div class="panel-subtitle">Latest verified monetary transactions</div></div>
            <button class="btn btn-ghost btn-sm" id="goDonations">View All →</button>
          </div>
          <div class="tbl-wrap">
            <table class="dt">
              <thead><tr><th>Donor</th><th>Allocated Campaign</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                ${st.recentDonations.map(d => `
                  <tr>
                    <td>
                      <div class="id-name">${esc(d.donorName)}</div>
                      <div class="id-sub" style="font-family:var(--font-mono);font-size:0.6875rem;">${esc(d.receiptNo)}</div>
                    </td>
                    <td><span class="badge b-blue">${esc(d.campaign)}</span></td>
                    <td class="amt amt-primary">${window.inr(d.amount)}</td>
                    <td style="font-size:0.75rem;color:var(--text-muted);">${d.date}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Hours -->
        <div class="panel">
          <div class="panel-header">
            <div><div class="panel-title">Recent Volunteer Deployments</div><div class="panel-subtitle">Latest field shifts verified</div></div>
            <button class="btn btn-ghost btn-sm" id="goVols">Directory →</button>
          </div>
          <div class="tbl-wrap">
            <table class="dt">
              <thead><tr><th>Volunteer</th><th>Operational Role</th><th>Hours</th></tr></thead>
              <tbody>
                ${st.recentParticipation.map(p => `
                  <tr>
                    <td>
                      <div class="id-name">${esc(p.volunteerName)}</div>
                      <div class="id-sub">${esc(p.eventTitle)}</div>
                    </td>
                    <td><span class="badge b-slate">${esc(p.role)}</span></td>
                    <td><span class="badge b-green">+${p.hoursLogged}h</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    setTimeout(renderCharts, 40);
    document.getElementById('wbDonation')?.addEventListener('click', () => openModal('modalDonation'));
    document.getElementById('wbVol')?.addEventListener('click',      () => openModal('modalVolunteer'));
    document.getElementById('wbHours')?.addEventListener('click',    () => openModal('modalHours'));
    document.getElementById('goDonations')?.addEventListener('click', () => navigate('donations'));
    document.getElementById('goVols')?.addEventListener('click',      () => navigate('volunteers'));
  }

  function renderCharts() {
    const st = window.SS.dashboardStats();
    Charts.renderBar('barChart', st.monthly);
    Charts.renderDonut('donutChart', st.progHours);
  }

  /* ── 2. Volunteers ── */
  function volunteers(vp) {
    const list = window.SS.getVolunteers(S.vFilter);
    const skills = ['Medical','Community Health','Logistics','Teaching','Digital Media','Public Health','Civil Works','Event Coordination','Youth Mentorship','Environmental','IT Support'];

    vp.innerHTML = `
      <div class="page-hd-row">
        <div class="page-hd-text">
          <h2>Volunteer Personnel Directory (${list.length})</h2>
          <p>Registered community staff — credentials, operational availability, and deployment records</p>
        </div>
        <div class="page-hd-actions">
          <button class="btn btn-outline" id="exportVolBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button class="btn btn-primary" id="addVolBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Enroll Volunteer
          </button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div class="panel-controls" style="flex-wrap:wrap;gap:8px;">
            <div class="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="volSearch" placeholder="Search name, competency, location..." value="${esc(S.vFilter.search)}">
            </div>
            <select class="f-select" id="volSkill" style="width:auto;padding:6px 11px;font-size:0.8125rem;">
              <option value="All">All Competencies</option>
              ${skills.map(s => `<option value="${s}" ${S.vFilter.skill===s?'selected':''}>${s}</option>`).join('')}
            </select>
            <select class="f-select" id="volStatus" style="width:auto;padding:6px 11px;font-size:0.8125rem;">
              <option value="All">All Statuses</option>
              <option value="Active"   ${S.vFilter.status==='Active'   ?'selected':''}>Active</option>
              <option value="On-Leave" ${S.vFilter.status==='On-Leave' ?'selected':''}>On Leave</option>
              <option value="Inactive" ${S.vFilter.status==='Inactive' ?'selected':''}>Inactive</option>
            </select>
          </div>
        </div>

        <div class="tbl-wrap">
          ${list.length === 0
            ? `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div><div class="empty-title">No volunteer personnel match criteria</div><div class="empty-desc">Clear search filters or enroll a new volunteer.</div></div>`
            : `<table class="dt">
                <thead><tr><th>Personnel</th><th>Contact Information</th><th>Location</th><th>Competencies</th><th>Availability</th><th>Status</th><th>Logged Hours</th><th style="text-align:right">Actions</th></tr></thead>
                <tbody>
                  ${list.map(v => {
                    const ini = initials(v.name);
                    const stBadge = v.status==='Active' ? 'b-green' : v.status==='On-Leave' ? 'b-amber' : 'b-red';
                    const avBadge = v.availability==='Flexible' ? 'b-blue' : 'b-slate';
                    return `
                      <tr class="vol-tbl-row" data-id="${v.id}" style="cursor:pointer;">
                        <td>
                          <div class="id-cell">
                            <div class="avatar" style="background:#1e3a8a;">${ini}</div>
                            <div>
                              <div class="id-name">${esc(v.name)}</div>
                              <div class="id-sub">Joined ${v.joinedDate}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div class="id-name" style="font-size:0.78125rem;">${esc(v.email)}</div>
                          <div class="id-sub">${esc(v.phone)}</div>
                        </td>
                        <td style="font-size:0.8125rem;">${esc(v.city)}</td>
                        <td>
                          <div style="display:flex;flex-wrap:wrap;gap:4px;max-width:220px;">
                            ${(Array.isArray(v.skills)?v.skills:[v.skills]).slice(0,2).map(s=>`<span class="skill-chip">${esc(s)}</span>`).join('')}
                          </div>
                        </td>
                        <td><span class="badge ${avBadge}">${esc(v.availability)}</span></td>
                        <td><span class="badge ${stBadge}"><span class="badge-dot"></span>${v.status}</span></td>
                        <td>
                          <span style="font-weight:600;color:var(--brand-700);font-size:0.875rem;">${v.totalHours}h</span>
                          <div style="font-size:0.7rem;color:var(--text-muted);">${v.eventsCount} drives</div>
                        </td>
                        <td style="text-align:right;" onclick="event.stopPropagation()">
                          <button class="btn btn-secondary btn-sm open-vol-drawer" data-id="${v.id}">View Profile</button>
                        </td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>`}
        </div>
      </div>
    `;

    // Filters
    let debounce;
    document.getElementById('volSearch')?.addEventListener('input', e => {
      clearTimeout(debounce);
      debounce = setTimeout(() => { S.vFilter.search = e.target.value; volunteers(vp); }, 200);
    });
    document.getElementById('volSkill')?.addEventListener('change', e => { S.vFilter.skill = e.target.value; volunteers(vp); });
    document.getElementById('volStatus')?.addEventListener('change', e => { S.vFilter.status = e.target.value; volunteers(vp); });

    vp.querySelectorAll('.vol-tbl-row, .open-vol-drawer').forEach(el => {
      el.addEventListener('click', () => openVolDrawer(el.closest('[data-id]')?.dataset.id || el.dataset.id));
    });

    document.getElementById('addVolBtn')?.addEventListener('click',    () => openModal('modalVolunteer'));
    document.getElementById('exportVolBtn')?.addEventListener('click', () => { const n=Exporter.exportVolunteers(); toast('Export Generated', `${n} volunteer records exported.`, 'green'); });
  }

  /* ── 3. Donors ── */
  function donors(vp) {
    const list = window.SS.getDonors(S.dFilter);

    vp.innerHTML = `
      <div class="page-hd-row">
        <div class="page-hd-text">
          <h2>Institutional &amp; Individual Donor Roster (${list.length})</h2>
          <p>Donor profiles, giving tier classifications, and philanthropic records</p>
        </div>
        <div class="page-hd-actions">
          <button class="btn btn-outline" id="exportDonorBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button class="btn btn-primary" id="addDonorBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Enroll Donor
          </button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div class="panel-controls" style="gap:8px;flex-wrap:wrap;">
            <div class="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="donorSearch" placeholder="Search organization, trustee, email..." value="${esc(S.dFilter.search)}">
            </div>
            <select class="f-select" id="donorTier" style="width:auto;padding:6px 11px;font-size:0.8125rem;">
              <option value="All">All Giving Tiers</option>
              <option value="Platinum">Platinum (₹15L+)</option>
              <option value="Gold">Gold (₹5L+)</option>
              <option value="Silver">Silver (₹1L+)</option>
              <option value="Bronze">Bronze (Grassroots)</option>
            </select>
            <select class="f-select" id="donorType" style="width:auto;padding:6px 11px;font-size:0.8125rem;">
              <option value="All">All Entity Types</option>
              <option value="Individual">Individual</option>
              <option value="Corporate">Corporate Sponsor</option>
              <option value="Foundation">Foundation / Trust</option>
            </select>
          </div>
        </div>

        <div class="tbl-wrap">
          ${list.length === 0
            ? `<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg></div><div class="empty-title">No donor records found</div></div>`
            : `<table class="dt">
                <thead><tr><th>Donor / Organization</th><th>Entity Type</th><th>Giving Tier</th><th>Lifetime Contributions</th><th>Total Gifts</th><th>Last Contribution</th><th style="text-align:right">Actions</th></tr></thead>
                <tbody>
                  ${list.map(d => {
                    const tierBadge = {Platinum:'b-purple',Gold:'b-amber',Silver:'b-blue',Bronze:'b-green'}[d.tier]||'b-slate';
                    const typeBadge = d.type==='Corporate'?'b-blue':d.type==='Foundation'?'b-purple':'b-slate';
                    return `
                      <tr class="donor-tbl-row" data-id="${d.id}" style="cursor:pointer;">
                        <td>
                          <div class="id-name">${esc(d.name)}</div>
                          <div class="id-sub">${esc(d.contactPerson)}</div>
                        </td>
                        <td><span class="badge ${typeBadge}">${esc(d.type)}</span></td>
                        <td><span class="badge ${tierBadge}">★ ${esc(d.tier)}</span></td>
                        <td class="amt amt-primary">${window.inr(d.lifetimeTotal)}</td>
                        <td style="font-size:0.8125rem;color:var(--text-secondary);">${d.totalGifts} gifts</td>
                        <td style="font-size:0.75rem;color:var(--text-muted);">${d.lastDonationDate}</td>
                        <td style="text-align:right;" onclick="event.stopPropagation()">
                          <button class="btn btn-secondary btn-sm open-donor-drawer" data-id="${d.id}">View Ledger</button>
                        </td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>`}
        </div>
      </div>
    `;

    let debounce;
    document.getElementById('donorSearch')?.addEventListener('input', e => { clearTimeout(debounce); debounce = setTimeout(() => { S.dFilter.search=e.target.value; donors(vp); }, 200); });
    document.getElementById('donorTier')?.addEventListener('change',  e => { S.dFilter.tier=e.target.value; donors(vp); });
    document.getElementById('donorType')?.addEventListener('change',  e => { S.dFilter.type=e.target.value; donors(vp); });

    vp.querySelectorAll('.donor-tbl-row, .open-donor-drawer').forEach(el => {
      el.addEventListener('click', () => openDonorDrawer(el.closest('[data-id]')?.dataset.id || el.dataset.id));
    });

    document.getElementById('addDonorBtn')?.addEventListener('click',    () => openModal('modalDonor'));
    document.getElementById('exportDonorBtn')?.addEventListener('click', () => { const n=Exporter.exportDonors(); toast('Export Generated', `${n} donor records exported.`, 'green'); });
  }

  /* ── 4. Donations Ledger ── */
  function donations(vp) {
    const list = window.SS.getDonations(S.txFilter);
    const campaigns = ['Gramin Swasthya Abhiyan','Beti Padhao Scholarship','Shiksha Kiran (Education)','Annadaan Yojana','Nadi Safai Abhiyan','Jal Jeevan Mission Support','Aapda Rahat Kosh','Mahila Utthan Programme','General Fund'];

    vp.innerHTML = `
      <div class="page-hd-row">
        <div class="page-hd-text">
          <h2>Donations Financial Ledger (${list.length})</h2>
          <p>Verified transactions, receipt numbers, and designated allocation causes</p>
        </div>
        <div class="page-hd-actions">
          <button class="btn btn-outline" id="exportTxBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button class="btn btn-primary" id="addDonationBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Record Contribution
          </button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div class="panel-controls" style="gap:8px;flex-wrap:wrap;">
            <div class="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="txSearch" placeholder="Search donor, receipt no, fund..." value="${esc(S.txFilter.search)}">
            </div>
            <select class="f-select" id="txCampaign" style="width:auto;padding:6px 11px;font-size:0.8125rem;">
              <option value="All">All Designated Funds</option>
              ${campaigns.map(c=>`<option value="${c}" ${S.txFilter.campaign===c?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="tbl-wrap">
          <table class="dt">
            <thead><tr><th>Receipt No</th><th>Donor</th><th>Designated Fund</th><th>Amount</th><th>Method</th><th>Date</th><th style="text-align:right">Receipt</th></tr></thead>
            <tbody>
              ${list.map(tx => `
                <tr>
                  <td style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted);">${esc(tx.receiptNo)}</td>
                  <td><div class="id-name">${esc(tx.donorName)}</div></td>
                  <td><span class="badge b-blue">${esc(tx.campaign)}</span></td>
                  <td class="amt amt-primary">${window.inr(tx.amount)}</td>
                  <td><span class="badge b-slate">${esc(tx.paymentMethod)}</span></td>
                  <td style="font-size:0.75rem;color:var(--text-muted);">${tx.date}</td>
                  <td style="text-align:right;">
                    <button class="btn btn-ghost btn-sm receipt-btn" data-r="${esc(tx.receiptNo)}" data-name="${esc(tx.donorName)}" data-amt="${tx.amount}" data-date="${tx.date}" data-camp="${esc(tx.campaign)}">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      Receipt
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    let db;
    document.getElementById('txSearch')?.addEventListener('input', e => { clearTimeout(db); db=setTimeout(() => { S.txFilter.search=e.target.value; donations(vp); }, 200); });
    document.getElementById('txCampaign')?.addEventListener('change', e => { S.txFilter.campaign=e.target.value; donations(vp); });
    document.getElementById('addDonationBtn')?.addEventListener('click', () => openModal('modalDonation'));
    document.getElementById('exportTxBtn')?.addEventListener('click', () => { const n=Exporter.exportDonations(); toast('Export Generated', `${n} ledger entries exported.`, 'green'); });

    vp.querySelectorAll('.receipt-btn').forEach(btn => {
      btn.addEventListener('click', () => showReceipt(btn.dataset.r, btn.dataset.name, btn.dataset.amt, btn.dataset.date, btn.dataset.camp));
    });
  }

  /* ── 5. Events / Drives ── */
  function events(vp) {
    const list = window.SS.getEvents();

    vp.innerHTML = `
      <div class="page-hd-row">
        <div class="page-hd-text">
          <h2>Operational Field Drives &amp; Campaigns (${list.length})</h2>
          <p>Community operations, volunteer staffing quotas, and service hour records</p>
        </div>
        <div class="page-hd-actions">
          <button class="btn btn-outline" id="exportParticBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Hours Log
          </button>
          <button class="btn btn-primary" id="addEventBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Schedule Drive
          </button>
        </div>
      </div>

      <div class="events-grid">
        ${list.map(evt => {
          const stBadge = evt.status==='Completed'?'b-green':evt.status==='In Progress'?'b-amber':'b-blue';
          const progress = evt.targetVolunteers > 0 ? Math.min(100, (evt.volunteerCount/evt.targetVolunteers)*100).toFixed(0) : 0;
          return `
            <div class="event-card">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span class="badge ${stBadge}"><span class="badge-dot"></span>${evt.status}</span>
                <span class="badge b-slate">${esc(evt.category)}</span>
              </div>

              <div>
                <div style="font-size:0.9375rem;font-weight:600;color:var(--text-primary);margin-bottom:4px;">${esc(evt.title)}</div>
                <div style="font-size:0.78125rem;color:var(--text-muted);line-height:1.45;">${esc(evt.description)}</div>
              </div>

              <div style="font-size:0.75rem;color:var(--text-muted);display:flex;flex-direction:column;gap:5px;">
                <div style="display:flex;gap:6px;align-items:center;">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  ${evt.date}
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  ${esc(evt.location)}
                </div>
              </div>

              <div>
                <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">
                  <span>Staffing Quota: ${evt.volunteerCount} / ${evt.targetVolunteers}</span>
                  <span>${progress}%</span>
                </div>
                <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
              </div>

              <div class="event-stats">
                <div>
                  <div class="event-stat-num">${evt.volunteerCount}</div>
                  <div style="font-size:0.7rem;color:var(--text-muted);">Deployed</div>
                </div>
                <div>
                  <div class="event-stat-val">${evt.volunteerHoursLogged}h</div>
                  <div style="font-size:0.7rem;color:var(--text-muted);">Verified Service</div>
                </div>
              </div>

              <button class="btn btn-secondary btn-sm log-hours-btn" data-eid="${evt.id}" data-etitle="${esc(evt.title)}" style="width:100%;">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Log Volunteer Shift
              </button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    document.getElementById('addEventBtn')?.addEventListener('click', () => openModal('modalEvent'));
    document.getElementById('exportParticBtn')?.addEventListener('click', () => { const n=Exporter.exportParticipation(); toast('Export Generated', `${n} shift logs exported.`, 'green'); });
    vp.querySelectorAll('.log-hours-btn').forEach(btn => {
      btn.addEventListener('click', () => openModal('modalHours', { eventId: btn.dataset.eid }));
    });
  }

  /* ── 6. Reports ── */
  function reports(vp) {
    vp.innerHTML = `
      <div class="page-hd-row">
        <div class="page-hd-text">
          <h2>Data Hub — Official Reports &amp; Audit Exports</h2>
          <p>Statutory-compliant CSV registries, institutional giving ledgers, and database backups</p>
        </div>
      </div>

      <div class="reports-grid">
        ${[
          { icon:'#1d4ed8', iconBg:'var(--brand-50)', id:'rVol', title:'Volunteer Personnel Directory', desc:'Complete roster of registered personnel: contact information, skill sets, availability, emergency contacts, and cumulative service hours.', meta:'CSV · RFC-4180 Standard · UTF-8 with BOM', btn:'Export Volunteers CSV' },
          { icon:'#1e40af', iconBg:'var(--brand-50)', id:'rDnr', title:'Donor Philanthropic Roster', desc:'All institutional and individual donor accounts: tier classifications, contact trustees, and lifetime contributions.', meta:'CSV · RFC-4180 Standard', btn:'Export Donors CSV' },
          { icon:'#0284c7', iconBg:'var(--tk-blue-bg)', id:'rTx', title:'Donations Financial Ledger', desc:'Complete audited financial transaction log with receipt references, allocation campaigns, payment channels, and values.', meta:'CSV · Statutory Audit Ready', btn:'Export Ledger CSV' },
          { icon:'#d97706', iconBg:'var(--tk-amber-bg)', id:'rPart', title:'Field Shift Hours Log', desc:'Chronological record connecting volunteers to operational drives, specialized roles, logged hours, and performance notes.', meta:'CSV · Operations Log', btn:'Export Shift Log CSV' },
          { icon:'#059669', iconBg:'var(--tk-green-bg)', id:'rJson', title:'Full Database Snapshot', desc:'Complete JSON backup of platform relational storage including volunteers, donors, contributions, drives, and shifts.', meta:'JSON · Machine-Readable Backup', btn:'Download JSON Backup' },
          { icon:'#dc2626', iconBg:'var(--tk-red-bg)', id:'rReset', title:'Reference Data Reset', desc:'Reset platform storage to bundled reference dataset for demonstration, testing, and initial onboarding.', meta:'Action: Irreversible', btn:'Reset to Reference Dataset', danger: true }
        ].map(c => `
          <div class="report-card">
            <div class="report-icon" style="background:${c.iconBg};color:${c.icon};">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <div>
              <h4>${c.title}</h4>
              <p style="margin-top:4px;">${c.desc}</p>
            </div>
            <div class="report-meta">${c.meta}</div>
            <button class="btn ${c.danger?'btn-danger':'btn-primary'} btn-sm" id="${c.id}" style="margin-top:auto;">${c.btn}</button>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('rVol')?.addEventListener('click',   () => { const n=Exporter.exportVolunteers();    toast('Export Generated','Volunteer roster CSV downloaded.','green'); });
    document.getElementById('rDnr')?.addEventListener('click',   () => { const n=Exporter.exportDonors();        toast('Export Generated','Donor directory CSV downloaded.','green'); });
    document.getElementById('rTx')?.addEventListener('click',    () => { const n=Exporter.exportDonations();     toast('Export Generated','Financial ledger CSV downloaded.','green'); });
    document.getElementById('rPart')?.addEventListener('click',  () => { const n=Exporter.exportParticipation(); toast('Export Generated','Service hours log CSV downloaded.','green'); });
    document.getElementById('rJson')?.addEventListener('click',  () => { Exporter.exportJSONBackup();            toast('Backup Exported','Database snapshot downloaded.','info'); });
    document.getElementById('rReset')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all platform data to the default reference dataset? This action cannot be undone.')) {
        window.SS.resetToSeed();
        toast('System Reset','Platform restored to reference dataset.','info');
        navigate('dashboard');
      }
    });
  }

  /* ═══════════════════════════════════════════════
     DRAWERS
  ═══════════════════════════════════════════════ */

  function openVolDrawer(id) {
    const v = window.SS.getVolunteerDetails(id);
    if (!v) return;
    S.openVolId = id;

    const ini = initials(v.name);
    const stBadge = v.status==='Active'?'b-green':v.status==='On-Leave'?'b-amber':'b-red';

    document.getElementById('volDrawerBody').innerHTML = `
      <div class="drawer-profile-banner">
        <div class="drawer-avatar-xl" style="background:#1e3a8a;">${ini}</div>
        <div class="drawer-profile-info">
          <h3>${esc(v.name)}</h3>
          <p>${esc(v.city)} &nbsp;·&nbsp; Joined ${v.joinedDate}</p>
          <div style="display:flex;gap:6px;margin-top:6px;">
            <span class="badge ${stBadge}"><span class="badge-dot"></span>${v.status}</span>
            <span class="badge b-slate">${esc(v.availability)}</span>
          </div>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Logged Hours</div><div class="meta-value" style="color:var(--brand-700);font-size:1rem;">${v.totalHours}h</div></div>
        <div class="meta-item"><div class="meta-label">Drives Attended</div><div class="meta-value">${v.eventsCount} operations</div></div>
        <div class="meta-item"><div class="meta-label">Telephone</div><div class="meta-value" style="font-size:0.78125rem;">${esc(v.phone)}</div></div>
        <div class="meta-item"><div class="meta-label">Emergency Contact</div><div class="meta-value" style="font-size:0.75rem;">${esc(v.emergencyContact)}</div></div>
      </div>

      <div>
        <div class="section-label">Key Competencies</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px;">${v.skills.map(s=>`<span class="skill-chip">${esc(s)}</span>`).join('')}</div>
      </div>

      <div>
        <div class="meta-label" style="margin-bottom:4px;">Official Email</div>
        <a href="mailto:${esc(v.email)}" style="font-size:0.8125rem;color:var(--brand-600);text-decoration:none;">${esc(v.email)}</a>
      </div>

      ${v.notes ? `
        <div>
          <div class="section-label">Coordinator Evaluation</div>
          <p style="font-size:0.78125rem;color:var(--text-secondary);background:var(--bg-alt);border:1px solid var(--border);border-radius:var(--r-sm);padding:12px;line-height:1.5;">${esc(v.notes)}</p>
        </div>
      ` : ''}

      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div class="section-label" style="margin-bottom:0;">Service Record History (${v.history.length})</div>
          <button class="btn btn-secondary btn-sm" id="logShiftBtn">+ Log Shift</button>
        </div>
        ${v.history.length === 0
          ? `<p style="font-size:0.78125rem;color:var(--text-muted);">No verified service records on file yet.</p>`
          : `<div class="timeline">${v.history.map(h=>`
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="tl-date">${h.date} &nbsp;·&nbsp; <strong style="color:var(--brand-700)">${h.hoursLogged}h</strong></div>
                <div class="tl-title">${esc(h.eventTitle)}</div>
                <div style="margin:3px 0;"><span class="badge b-slate">${esc(h.role)}</span></div>
                ${h.notes?`<div class="tl-desc">${esc(h.notes)}</div>`:''}
              </div>`).join('')}</div>`}
      </div>
    `;

    document.getElementById('logShiftBtn')?.addEventListener('click', () => { closeDrawers(); openModal('modalHours', { volunteerId: id }); });
    document.getElementById('delVolBtn')?.dataset && (document.getElementById('delVolBtn').dataset.id = id);

    document.getElementById('drawerOverlay').classList.add('open');
    document.getElementById('volDrawer').classList.add('open');
  }

  function openDonorDrawer(id) {
    const d = window.SS.getDonorDetails(id);
    if (!d) return;
    S.openDonorId = id;

    const tierBadge = {Platinum:'b-purple',Gold:'b-amber',Silver:'b-blue',Bronze:'b-green'}[d.tier]||'b-slate';

    document.getElementById('donorDrawerBody').innerHTML = `
      <div class="drawer-profile-banner">
        <div class="drawer-profile-info">
          <div style="display:flex;gap:6px;margin-bottom:6px;">
            <span class="badge ${tierBadge}">★ ${esc(d.tier)}</span>
            <span class="badge b-slate">${esc(d.type)}</span>
          </div>
          <h3>${esc(d.name)}</h3>
          <p>${esc(d.contactPerson)}</p>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Lifetime Contributions</div><div class="meta-value" style="color:var(--brand-700);font-size:1.05rem;">${window.inr(d.lifetimeTotal)}</div></div>
        <div class="meta-item"><div class="meta-label">Total Gifts</div><div class="meta-value">${d.totalGifts} records</div></div>
        <div class="meta-item"><div class="meta-label">Official Email</div><div class="meta-value" style="font-size:0.75rem;">${esc(d.email)}</div></div>
        <div class="meta-item"><div class="meta-label">Telephone / PBX</div><div class="meta-value" style="font-size:0.75rem;">${esc(d.phone)}</div></div>
      </div>

      ${d.notes ? `<div><div class="section-label">Institutional Notes</div><p style="font-size:0.78125rem;color:var(--text-secondary);background:var(--bg-alt);border:1px solid var(--border);border-radius:var(--r-sm);padding:12px;line-height:1.5;">${esc(d.notes)}</p></div>` : ''}

      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div class="section-label" style="margin-bottom:0;">Giving Ledger (${d.donations.length})</div>
          <button class="btn btn-secondary btn-sm" id="addDonFromDrawer">+ Record Contribution</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${d.donations.map(tx => `
            <div class="hist-item">
              <div class="hist-top">
                <span class="hist-title">${esc(tx.campaign)}</span>
                <span class="hist-amt">${window.inr(tx.amount)}</span>
              </div>
              <div class="hist-meta">${tx.date} &nbsp;·&nbsp; ${esc(tx.paymentMethod)} &nbsp;·&nbsp; <span style="font-family:var(--font-mono);">${esc(tx.receiptNo)}</span></div>
              ${tx.notes?`<div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">${esc(tx.notes)}</div>`:''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('addDonFromDrawer')?.addEventListener('click', () => { closeDrawers(); openModal('modalDonation', { donorId: id }); });
    document.getElementById('delDonorBtn')?.dataset && (document.getElementById('delDonorBtn').dataset.id = id);

    document.getElementById('drawerOverlay').classList.add('open');
    document.getElementById('donorDrawer').classList.add('open');
  }

  function closeDrawers() {
    document.querySelectorAll('.drawer-panel').forEach(p => p.classList.remove('open'));
    document.getElementById('drawerOverlay')?.classList.remove('open');
    S.openVolId = S.openDonorId = null;
  }

  document.getElementById('drawerOverlay')?.addEventListener('click', closeDrawers);
  document.querySelectorAll('.drawer-close').forEach(b => b.addEventListener('click', closeDrawers));

  // Drawer footer delete buttons
  document.getElementById('delVolBtn')?.addEventListener('click', () => {
    const id = document.getElementById('delVolBtn').dataset.id;
    if (id && confirm('Are you sure you want to delete this volunteer profile? Associated participation history will also be removed.')) {
      window.SS.deleteVolunteer(id);
      closeDrawers();
      toast('Profile Deleted', 'Volunteer record has been removed.', 'info');
      navigate(S.view);
    }
  });

  document.getElementById('delDonorBtn')?.addEventListener('click', () => {
    const id = document.getElementById('delDonorBtn').dataset.id;
    if (id && confirm('Are you sure you want to delete this donor account?')) {
      window.SS.deleteDonor(id);
      closeDrawers();
      toast('Profile Deleted', 'Donor record has been removed.', 'info');
      navigate(S.view);
    }
  });

  /* ═══════════════════════════════════════════════
     MODALS
  ═══════════════════════════════════════════════ */

  function openModal(modalId, opts = {}) {
    const m = document.getElementById(modalId);
    if (!m) return;

    if (modalId === 'modalDonation') {
      const sel = document.getElementById('donDonorSel');
      if (sel) {
        const dnrs = window.SS.getDonors();
        sel.innerHTML = dnrs.map(d => `<option value="${d.id}" ${opts.donorId===d.id?'selected':''}>${esc(d.name)} (${d.tier})</option>`).join('');
      }
      const dInput = document.getElementById('donDate');
      if (dInput) dInput.value = new Date().toISOString().split('T')[0];
    }

    if (modalId === 'modalHours') {
      const vSel = document.getElementById('hrVolSel');
      const eSel = document.getElementById('hrEvtSel');
      if (vSel) { const vs=window.SS.getVolunteers(); vSel.innerHTML=vs.map(v=>`<option value="${v.id}" ${opts.volunteerId===v.id?'selected':''}>${esc(v.name)} (${v.status})</option>`).join(''); }
      if (eSel) { const es=window.SS.getEvents();     eSel.innerHTML=es.map(e=>`<option value="${e.id}" ${opts.eventId===e.id?'selected':''}>${esc(e.title)} (${e.date})</option>`).join(''); }
      const dInput = document.getElementById('hrDate');
      if (dInput) dInput.value = new Date().toISOString().split('T')[0];
    }

    m.classList.add('open');
  }

  function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.querySelectorAll('.modal-close, .modal-cancel').forEach(b => b.addEventListener('click', () => m.classList.remove('open')));
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });

  // ESC key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeDrawers();
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      document.getElementById('cmdPaletteOverlay')?.classList.remove('open');
    }
  });

  /* Form Submissions */
  document.getElementById('formVolunteer')?.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    const v = window.SS.addVolunteer({ name:f.name.value, email:f.email.value, phone:f.phone.value, city:f.city.value, skills:f.skills.value, availability:f.availability.value, status:f.status.value, emergencyContact:f.emergencyContact.value, notes:f.notes.value });
    closeModal('modalVolunteer'); f.reset();
    toast('Volunteer Enrolled', `${v.name} added to directory.`, 'green');
    navigate(S.view);
  });

  document.getElementById('formDonor')?.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    const d = window.SS.addDonor({ name:f.name.value, type:f.type.value, tier:f.tier.value, email:f.email.value, phone:f.phone.value, contactPerson:f.contactPerson.value, notes:f.notes.value });
    closeModal('modalDonor'); f.reset();
    toast('Donor Registered', `${d.name} (${d.tier}) added to roster.`, 'green');
    navigate(S.view);
  });

  document.getElementById('formDonation')?.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    const tx = window.SS.addDonation({ donorId:f.donorId.value, amount:f.amount.value, date:f.date.value, campaign:f.campaign.value, paymentMethod:f.paymentMethod.value, notes:f.notes.value });
    closeModal('modalDonation'); f.reset();
    toast('Donation Verified', `${window.inr(tx.amount)} — ${tx.receiptNo}`, 'green');
    navigate(S.view);
  });

  document.getElementById('formHours')?.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    const r = window.SS.logParticipation({ volunteerId:f.volunteerId.value, eventId:f.eventId.value, date:f.date.value, hoursLogged:f.hoursLogged.value, role:f.role.value, notes:f.notes.value });
    closeModal('modalHours'); f.reset();
    toast('Shift Recorded', `${r.hoursLogged}h verified for ${r.volunteerName}`, 'green');
    navigate(S.view);
  });

  document.getElementById('formEvent')?.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    const ev = window.SS.addEvent({ title:f.title.value, date:f.date.value, location:f.location.value, category:f.category.value, targetVolunteers:f.targetVolunteers.value, status:f.status.value, description:f.description.value });
    closeModal('modalEvent'); f.reset();
    toast('Drive Scheduled', `"${ev.title}" scheduled for ${ev.date}.`, 'green');
    navigate(S.view);
  });

  /* ── Quick Action ── */
  document.getElementById('quickAddBtn')?.addEventListener('click', () => openModal('modalDonation'));

  /* ── Command Palette ── */
  const paletteOverlay = document.getElementById('cmdPaletteOverlay');
  const paletteInput   = document.getElementById('cmdInput');
  const paletteResults = document.getElementById('cmdResults');
  const paletteTrigger = document.getElementById('searchPillBtn');

  function openPalette() { paletteOverlay?.classList.add('open'); paletteInput?.focus(); paletteInput.value=''; renderPalette(''); }
  function closePalette() { paletteOverlay?.classList.remove('open'); }

  paletteTrigger?.addEventListener('click', openPalette);
  document.addEventListener('keydown', e => { if ((e.metaKey||e.ctrlKey) && e.key==='k') { e.preventDefault(); paletteOverlay?.classList.contains('open')?closePalette():openPalette(); } });
  paletteOverlay?.addEventListener('click', e => { if (e.target===paletteOverlay) closePalette(); });
  paletteInput?.addEventListener('input', e => renderPalette(e.target.value));

  function renderPalette(q) {
    const sq = q.toLowerCase();
    const vs = window.SS.getVolunteers().filter(v => v.name.toLowerCase().includes(sq)||v.city.toLowerCase().includes(sq)).slice(0,4);
    const ds = window.SS.getDonors().filter(d => d.name.toLowerCase().includes(sq)).slice(0,4);

    let html = '';
    if (vs.length) {
      html += `<div class="p-group-label">Volunteers</div>`;
      vs.forEach(v => { html += `<div class="p-item" data-t="v" data-id="${v.id}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><span>${esc(v.name)}</span><span class="p-item-sub">${v.city} · ${v.totalHours}h</span></div>`; });
    }
    if (ds.length) {
      html += `<div class="p-group-label">Donors</div>`;
      ds.forEach(d => { html += `<div class="p-item" data-t="d" data-id="${d.id}"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg><span>${esc(d.name)}</span><span class="p-item-sub">${d.tier} · ${window.inr(d.lifetimeTotal)}</span></div>`; });
    }
    if (!html) html = `<div style="padding:20px;text-align:center;font-size:0.8125rem;color:var(--text-muted);">No records found for "${esc(q)}"</div>`;

    paletteResults.innerHTML = html;
    paletteResults.querySelectorAll('.p-item').forEach(el => {
      el.addEventListener('click', () => {
        const { t, id } = el.dataset;
        closePalette();
        if (t==='v') { navigate('volunteers'); setTimeout(() => openVolDrawer(id), 80); }
        else         { navigate('donors');     setTimeout(() => openDonorDrawer(id), 80); }
      });
    });
  }

  /* ── Receipt Modal ── */
  function showReceipt(receiptNo, donorName, amount, date, campaign) {
    const body = document.getElementById('receiptBody');
    if (!body) return;
    body.innerHTML = `
      <div style="border:1px dashed var(--border);border-radius:var(--r-md);padding:24px;text-align:center;">
        <div style="width:40px;height:40px;border-radius:var(--r-sm);background:var(--tk-green-bg);color:var(--emerald-500);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;border:1px solid var(--tk-green-br);">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h4 style="font-size:1rem;font-weight:600;margin-bottom:3px;color:var(--text-primary);">Official Donation Receipt</h4>
        <p style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono);">${esc(receiptNo)}</p>

        <div style="margin:20px 0;background:var(--bg-alt);border:1px solid var(--border);border-radius:var(--r-sm);padding:14px;display:flex;flex-direction:column;gap:9px;text-align:left;">
          ${[['Donor Account','',donorName],['Contribution Amount','',window.inr(Number(amount))],['Designated Cause','',campaign],['Value Date','',date],['Tax Exemption Status','','80G Eligible (FCRA Standard)']].map(([l,,v]) =>
            `<div style="display:flex;justify-content:space-between;font-size:0.8125rem;"><span style="color:var(--text-secondary);">${l}:</span><strong style="color:var(--text-primary);">${esc(String(v))}</strong></div>`).join('')}
        </div>
        <p style="font-size:0.72rem;color:var(--text-muted);line-height:1.45;">SevaSetu Charitable Trust, India<br>FCRA Registered · CIN U85300MH2019NPL000001<br>Official statutory receipt acknowledged under Indian Trust Laws.</p>
      </div>
    `;
    document.getElementById('modalReceipt')?.classList.add('open');
  }

  /* ── Bootstrap ── */
  navigate('dashboard');

});
