/* ============================================================
   LMS EJS — Main JavaScript
   Handles: dropdowns, modals, tabs, countdown, toggles, etc.
   ============================================================ */

// ── Dropdown (3-dot action menu) ──────────────────────────
function initDropdowns() {
  document.querySelectorAll('[data-dropdown-toggle]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const target = document.getElementById(btn.dataset.dropdownToggle);
      if (!target) return;
      const isOpen = !target.classList.contains('hidden');
      // Close all first
      document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.add('hidden'));
      if (!isOpen) {
        target.classList.remove('hidden');
        // Detect if near bottom
        const rect = btn.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        target.classList.toggle('drop-up', spaceBelow < 150);
        target.classList.toggle('drop-down', spaceBelow >= 150);
      }
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.add('hidden'));
  });
}

// ── Modals ────────────────────────────────────────────────
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('hidden'); m.classList.remove('flex'); }
}
function initModals() {
  // Open buttons
  document.querySelectorAll('[data-modal-open]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.modalOpen));
  });
  // Close buttons
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modalClose));
  });
  // Click overlay to close
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });
  });
}

// ── Tabs ──────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('[data-tab-group]').forEach(group => {
    const groupName = group.dataset.tabGroup;
    const tabs = group.querySelectorAll('[data-tab]');
    const panels = document.querySelectorAll(`[data-tab-panel="${groupName}"]`);

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        const activeClass = tab.dataset.activeClass || 'active-blue';

        tabs.forEach(t => {
          t.classList.remove('active-blue', 'active-green', 'active-red');
        });
        tab.classList.add(activeClass);

        panels.forEach(p => {
          p.classList.toggle('hidden', p.dataset.tabContent !== target);
        });
      });
    });
  });
}

// ── Sidebar Tab (Settings page style) ────────────────────
function showSettingsTab(tab) {
  document.querySelectorAll('.settings-content').forEach(c => c.classList.add('hidden'));
  document.querySelectorAll('.settings-tab-btn').forEach(b => {
    b.classList.remove('active-settings');
  });
  const panel = document.getElementById('settings-' + tab);
  if (panel) panel.classList.remove('hidden');
  const btn = document.querySelector(`[data-settings-tab="${tab}"]`);
  if (btn) btn.classList.add('active-settings');
}

// ── Toggle password visibility ────────────────────────────
function initPasswordToggles() {
  document.querySelectorAll('[data-pw-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.pwToggle);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.querySelector('.eye-on').classList.toggle('hidden', show);
      btn.querySelector('.eye-off').classList.toggle('hidden', !show);
    });
  });
}

// ── Countdown Timer ───────────────────────────────────────
function initCountdown(deadlineISO, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const days    = container.querySelector('[data-cd-days]');
  const hours   = container.querySelector('[data-cd-hours]');
  const minutes = container.querySelector('[data-cd-minutes]');
  const seconds = container.querySelector('[data-cd-seconds]');
  const expired = container.querySelector('[data-cd-expired]');
  const units   = container.querySelectorAll('.countdown-unit');

  function update() {
    const diff = new Date(deadlineISO).getTime() - Date.now();
    if (diff <= 0) {
      if (expired) expired.classList.remove('hidden');
      container.querySelectorAll('[data-cd-live]').forEach(el => el.classList.add('hidden'));
      clearInterval(timer);
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff / 3600000) % 24);
    const m = Math.floor((diff / 60000) % 60);
    const s = Math.floor((diff / 1000) % 60);
    if (days) days.textContent = String(d).padStart(2, '0');
    if (hours) hours.textContent = String(h).padStart(2, '0');
    if (minutes) minutes.textContent = String(m).padStart(2, '0');
    if (seconds) seconds.textContent = String(s).padStart(2, '0');

    // Warn if < 1 hour
    units.forEach(u => u.classList.toggle('warn', d === 0 && h < 1));
  }
  update();
  const timer = setInterval(update, 1000);
}

// ── User Management Actions ───────────────────────────────
function prepareRoleModal(userId, currentRole) {
  document.getElementById('role-user-id').value = userId;
  document.getElementById('role-select').value = currentRole;
  openModal('modal-role');
}
function prepareStatusModal(userId, currentStatus, email) {
  document.getElementById('status-user-id').value = userId;
  document.getElementById('status-email-display').textContent = email;
  const isActive = currentStatus === 'ACTIVE';
  document.getElementById('status-action-label').textContent = isActive ? 'khóa' : 'mở khóa';
  document.getElementById('status-btn').textContent = isActive ? 'Xác nhận khóa' : 'Mở khóa tài khoản';
  document.getElementById('status-btn').className = isActive
    ? 'btn btn-red' : 'btn btn-green';
  openModal('modal-status');
}
function prepareDeleteModal(userId, email) {
  document.getElementById('delete-user-id').value = userId;
  document.getElementById('delete-email-display').textContent = email;
  openModal('modal-delete');
}

// ── Grading: Select submission ────────────────────────────
function selectSubmission(id) {
  document.querySelectorAll('.submission-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.subId === String(id));
  });
  document.querySelectorAll('.grading-panel').forEach(p => {
    p.classList.toggle('hidden', p.dataset.subPanel !== String(id));
  });
  document.getElementById('grading-empty')?.classList.add('hidden');
}

// ── Question Bank: toggle answer form ────────────────────
function toggleQuestionType(val) {
  const mcSection = document.getElementById('mc-options-section');
  if (mcSection) mcSection.classList.toggle('hidden', val !== 'multiple_choice');
}

// ── Score distribution bar chart animation ───────────────
function animateBars() {
  document.querySelectorAll('[data-bar-width]').forEach(bar => {
    setTimeout(() => {
      bar.style.width = bar.dataset.barWidth + '%';
    }, 100);
  });
}

// ── Search filter ─────────────────────────────────────────
function initSearch(inputId, rowSelector, cellIndex) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    document.querySelectorAll(rowSelector).forEach(row => {
      const cell = row.querySelectorAll('td')[cellIndex];
      const text = cell ? cell.textContent.toLowerCase() : '';
      row.style.display = text.includes(q) ? '' : 'none';
    });
  });
}

// ── Pagination (client-side simple) ──────────────────────
function initPagination(tableBodyId, pageSize) {
  const tbody = document.getElementById(tableBodyId);
  if (!tbody) return;
  const rows = Array.from(tbody.querySelectorAll('tr'));
  let currentPage = 1;
  const totalPages = Math.ceil(rows.length / pageSize);

  function render() {
    rows.forEach((r, i) => {
      const page = Math.floor(i / pageSize) + 1;
      r.style.display = page === currentPage ? '' : 'none';
    });
    const info = document.getElementById(tableBodyId + '-page-info');
    if (info) info.textContent = `Trang ${currentPage} / ${Math.max(totalPages, 1)}`;
    document.getElementById(tableBodyId + '-prev')?.toggleAttribute('disabled', currentPage <= 1);
    document.getElementById(tableBodyId + '-next')?.toggleAttribute('disabled', currentPage >= totalPages);
  }

  document.getElementById(tableBodyId + '-prev')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; render(); }
  });
  document.getElementById(tableBodyId + '-next')?.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; render(); }
  });

  render();
}

// ── Toast notification ────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed; bottom:1.5rem; right:1.5rem; z-index:9999;
    padding:.75rem 1.25rem; border-radius:8px; font-size:.875rem; font-weight:500;
    color:#fff; animation:slideIn .3s ease;
    background:${type === 'success' ? '#238636' : type === 'error' ? '#da3633' : '#1f6feb'};
    box-shadow:0 4px 12px rgba(0,0,0,.4);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Role Selection page: hover effect ─────────────────────
function initRoleCards() {
  document.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', () => {
      const href = card.dataset.href;
      if (href) window.location.href = href;
    });
  });
}

// ── Admin: localhost guard (checked server-side too) ──────
function initAdminGuard() {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  if (!isLocal) {
    document.body.innerHTML = `
      <div style="display:flex;height:100vh;align-items:center;justify-content:center;background:#0d1117;color:#f85149;font-family:monospace;text-align:center;padding:2rem;">
        <div>
          <div style="font-size:4rem;margin-bottom:1rem;">🔒</div>
          <h1 style="font-size:1.5rem;font-weight:700;">403 — Forbidden</h1>
          <p style="color:#8b949e;margin-top:.5rem;">Admin portal only accessible from localhost.</p>
        </div>
      </div>`;
  }
}

// ── Main Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDropdowns();
  initModals();
  initTabs();
  initPasswordToggles();
  initRoleCards();
  animateBars();

  // Auto-init search on user list page
  initSearch('user-search', '#user-table-body tr', 0);
  initPagination('user-table-body', 10);
});
