/**
 * NOTIFICACIONES GLOBALES DE HARDWARE PARA ADMIN
 * Consulta el endpoint cada 10s usando cookies (credentials: 'include').
 */

class AdminHardwareNotifications {
  constructor() {
    this.isActive = false;
    this.refreshInterval = null;
    this.notificationBadge = null;
    this.panel = null;
    this.currentIds = new Set();
    this.shownIds = new Set();
    this.isFirstLoad = true;
    this.userId = window.currentUser?.id || 'admin';
    this.localStorageKey = `admin_hw_notifications_shown_${this.userId}`;

    this.initialize();
  }

  initialize() {
    if (!this.isAdminUser()) return;

    this.isActive = true;
    this.loadShownFromStorage();
    this.createUI();
    this.fetchStatus();
    this.startAutoRefresh();
    this.setupListeners();
  }

  isAdminUser() {
    const role = window.currentUser?.role;
    return role === 'admin' ||
      role === 'super_admin' ||
      role === 'superadmin' ||
      window.location.pathname.startsWith('/admin') ||
      window.location.pathname.startsWith('/super_admin');
  }

  createUI() {
    this.setupBadge();
    this.createPanel();
    this.injectStyles();
  }

  setupBadge() {
    const headerButton = document.querySelector('.navbar__action[aria-label="Notifications"]');
    const badge = document.querySelector('.navbar__notification-badge');

    if (!headerButton || !badge) return;

    headerButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.togglePanel();
    });

    badge.id = 'adminHardwareNotificationsCount';
    badge.style.display = 'none';
    badge.style.position = 'absolute';
    badge.style.top = '-5px';
    badge.style.right = '-5px';
    badge.style.backgroundColor = '#ef4444';
    badge.style.color = 'white';
    badge.style.borderRadius = '50%';
    badge.style.minWidth = '18px';
    badge.style.height = '18px';
    badge.style.fontSize = '11px';
    badge.style.fontWeight = 'bold';
    badge.style.textAlign = 'center';
    badge.style.lineHeight = '18px';
    badge.style.zIndex = '10';

    this.notificationBadge = badge;
    this.headerButton = headerButton;
  }

  createPanel() {
    const panelHTML = `
      <div id="adminHardwareNotificationsPanel" class="admin-hw-panel hidden">
        <div class="admin-hw-panel__header">
          <div class="admin-hw-panel__title">
            <i class="fas fa-microchip"></i>
            Estado fisico de hardware
          </div>
          <button class="admin-hw-panel__close" onclick="window.adminHardwareNotifications.closePanel()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="admin-hw-panel__body" id="adminHardwareNotificationsList">
          <div class="admin-hw-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Verificando hardware...</span>
          </div>
        </div>

        <div class="admin-hw-panel__footer">
          <a href="/admin/hardware" class="admin-hw-panel__action">
            <i class="fas fa-list"></i>
            Ver hardware
          </a>
          <button class="admin-hw-panel__action admin-hw-panel__action--secondary" onclick="window.adminHardwareNotifications.refresh()">
            <i class="fas fa-sync-alt"></i>
            Actualizar
          </button>
        </div>
      </div>

      <div id="adminHardwareNotificationsOverlay" class="admin-hw-overlay hidden" onclick="window.adminHardwareNotifications.closePanel()"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', panelHTML);
    this.panel = document.getElementById('adminHardwareNotificationsPanel');
  }

  injectStyles() {
    const styles = `
      <style id="adminHardwareNotificationsStyles">
        @keyframes adminHwGlow {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(239, 68, 68, 0.4), 0 0 0 rgba(255, 255, 255, 0.2);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 0 8px rgba(239, 68, 68, 0.8), 0 0 12px rgba(239, 68, 68, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.6);
          }
        }

        .admin-hw-panel {
          position: fixed;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          width: 420px;
          max-height: 80vh;
          background: rgba(17, 24, 39, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
        }

        .admin-hw-panel.hidden {
          opacity: 0;
          transform: translateY(-50%) translateX(100%);
          pointer-events: none;
        }

        .admin-hw-panel__header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .admin-hw-panel__title {
          color: white;
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .admin-hw-panel__title i {
          color: #38bdf8;
        }

        .admin-hw-panel__close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .admin-hw-panel__close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .admin-hw-panel__body {
          flex: 1;
          overflow-y: auto;
          padding: 0;
          max-height: 420px;
        }

        .admin-hw-loading {
          padding: 40px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .admin-hw-loading i {
          font-size: 24px;
          margin-bottom: 12px;
          display: block;
        }

        .admin-hw-item {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .admin-hw-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .admin-hw-item:last-child {
          border-bottom: none;
        }

        .admin-hw-title {
          color: white;
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 6px;
        }

        .admin-hw-info {
          color: rgba(255, 255, 255, 0.7);
          font-size: 12px;
          line-height: 1.4;
        }

        .admin-hw-id {
          color: rgba(255, 255, 255, 0.45);
          font-size: 11px;
          margin-top: 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        .admin-hw-panel__footer {
          padding: 16px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 8px;
        }

        .admin-hw-panel__action {
          flex: 1;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .admin-hw-panel__action--secondary {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .admin-hw-panel__action:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .admin-hw-panel__action--secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
        }

        .admin-hw-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 1000;
        }

        .admin-hw-popup {
          position: fixed;
          top: 18px;
          right: 18px;
          background: linear-gradient(135deg, #ef4444, #b91c1c);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          box-shadow: 0 12px 24px rgba(185, 28, 28, 0.35);
          z-index: 1002;
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 320px;
          animation: adminHwPopupIn 0.35s ease;
        }

        .admin-hw-popup__icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .admin-hw-popup__title {
          font-weight: 700;
          font-size: 13px;
          margin-bottom: 2px;
        }

        .admin-hw-popup__text {
          font-size: 12px;
          opacity: 0.9;
        }

        @keyframes adminHwPopupIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .admin-hw-empty {
          padding: 40px 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
        }

        .admin-hw-empty i {
          font-size: 48px;
          margin-bottom: 16px;
          display: block;
          color: #16a34a;
        }

        @media (max-width: 768px) {
          .admin-hw-panel {
            width: calc(100vw - 40px);
            right: 20px;
            left: 20px;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  async fetchStatus() {
    if (!this.isActive) return;

    try {
      const base = window.__buildApiUrl ? window.__buildApiUrl('') : (window.__APP_CONFIG?.apiUrl || '');
      const baseUrl = base.endsWith('/') ? base.slice(0, -1) : base;
      const url = `${baseUrl}/api/hardware/physical-status/check`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const items = this.normalizeItems(data);

      this.checkForNew(items);
      this.updateUI(items);
    } catch (error) {
      this.showError();
    }
  }

  normalizeItems(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data.map(item => this.normalizeItem(item));

    const candidates = [
      data.data,
      data.items,
      data.hardware,
      data.result,
      data.results
    ];

    const list = candidates.find(Array.isArray) || [];
    return list.map(item => this.normalizeItem(item));
  }

  normalizeItem(item) {
    const hardwareId = item?.hardware_id || item?.hardwareId || item?.id || item?._id || '';
    const hardwareName = item?.hardware_nombre || item?.hardwareName || item?.nombre_hardware || item?.nombre || 'Hardware sin nombre';
    const empresaName = item?.empresa_nombre || item?.empresaName || item?.empresa || item?.company_name || 'Empresa sin nombre';
    const sedeName = item?.sede || item?.sede_nombre || item?.site || item?.location || 'Sede no especificada';
    const stableId = hardwareId || `${hardwareName}-${empresaName}-${sedeName}`.replace(/\s+/g, '_').toLowerCase();

    return {
      id: stableId,
      hardwareId,
      hardwareName,
      empresaName,
      sedeName
    };
  }

  updateUI(items) {
    const count = items.length;

    if (this.notificationBadge) {
      this.notificationBadge.textContent = count;
      if (count > 0) {
        this.notificationBadge.style.display = 'flex';
        this.notificationBadge.style.animation = 'adminHwGlow 2s infinite';
      } else {
        this.notificationBadge.style.display = 'none';
        this.notificationBadge.style.animation = 'none';
      }
    }

    this.updatePanel(items);
  }

  updatePanel(items) {
    const list = document.getElementById('adminHardwareNotificationsList');
    if (!list) return;

    if (items.length === 0) {
      list.innerHTML = `
        <div class="admin-hw-empty">
          <i class="fas fa-check-circle"></i>
          <h3 style="color: white; margin-bottom: 8px; font-size: 16px;">Sin alertas de hardware</h3>
          <p style="font-size: 14px;">No hay incidencias fisicas registradas</p>
        </div>
      `;
      return;
    }

    const itemsHTML = items.map(item => `
      <div class="admin-hw-item" role="button" tabindex="0" onclick="window.adminHardwareNotifications.goToHardware('${item.hardwareId || ''}')">
        <div class="admin-hw-title">${item.hardwareName}</div>
        <div class="admin-hw-info">
          <div><strong>${item.empresaName}</strong> - ${item.sedeName}</div>
        </div>
        ${item.hardwareId ? `<div class="admin-hw-id">ID: ${item.hardwareId}</div>` : ''}
      </div>
    `).join('');

    list.innerHTML = itemsHTML;
  }

  showError() {
    const list = document.getElementById('adminHardwareNotificationsList');
    if (list) {
      list.innerHTML = `
        <div class="admin-hw-loading" style="color: #f87171;">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Error consultando estado fisico</span>
        </div>
      `;
    }
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.fetchStatus();
    }, 10000);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  setupListeners() {
    window.addEventListener('beforeunload', () => {
      this.stopAutoRefresh();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopAutoRefresh();
      } else {
        this.startAutoRefresh();
        this.fetchStatus();
      }
    });
  }

  togglePanel() {
    const overlay = document.getElementById('adminHardwareNotificationsOverlay');
    if (!this.panel || !overlay) return;

    const isHidden = this.panel.classList.contains('hidden');
    if (isHidden) {
      this.panel.classList.remove('hidden');
      overlay.classList.remove('hidden');
      this.fetchStatus();
    } else {
      this.panel.classList.add('hidden');
      overlay.classList.add('hidden');
    }
  }

  openPanel() {
    const overlay = document.getElementById('adminHardwareNotificationsOverlay');
    if (this.panel && overlay) {
      this.panel.classList.remove('hidden');
      overlay.classList.remove('hidden');
    }
  }

  closePanel() {
    const overlay = document.getElementById('adminHardwareNotificationsOverlay');
    if (this.panel && overlay) {
      this.panel.classList.add('hidden');
      overlay.classList.add('hidden');
    }
  }

  async refresh() {
    const refreshBtn = document.querySelector('#adminHardwareNotificationsPanel .admin-hw-panel__action--secondary');
    if (refreshBtn) {
      const originalHTML = refreshBtn.innerHTML;
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
      refreshBtn.disabled = true;
      await this.fetchStatus();
      setTimeout(() => {
        refreshBtn.innerHTML = originalHTML;
        refreshBtn.disabled = false;
      }, 800);
    } else {
      await this.fetchStatus();
    }
  }

  goToHardware(hardwareId) {
    this.closePanel();
    if (hardwareId) {
      sessionStorage.setItem('openHardwareId', hardwareId);
    }
    window.location.href = '/admin/hardware';
  }

  checkForNew(items) {
    if (!items || items.length === 0) {
      this.currentIds.clear();
      return;
    }

    const newIds = new Set(items.map(item => item.id));
    const newlyAppeared = [...newIds].filter(id => !this.currentIds.has(id));

    if (this.isFirstLoad) {
      if (newIds.size > 0) {
        this.openPanel();
        this.showNewHardwarePopup(newlyAppeared.length || newIds.size);
      }
    } else if (newlyAppeared.length > 0) {
      this.openPanel();
      this.showNewHardwarePopup(newlyAppeared.length);
    }

    this.currentIds = new Set(newIds);
    this.isFirstLoad = false;
  }

  loadShownFromStorage() {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (stored) {
        const ids = JSON.parse(stored);
        this.shownIds = new Set(ids);
      }
    } catch (error) {
      this.shownIds = new Set();
    }
  }

  saveShownToStorage() {
    try {
      const ids = Array.from(this.shownIds);
      localStorage.setItem(this.localStorageKey, JSON.stringify(ids));
    } catch (error) {
      return;
    }
  }

  markShown(ids) {
    ids.forEach(id => {
      this.shownIds.add(id);
    });
    this.saveShownToStorage();
  }

  showNewHardwarePopup(count) {
    if (!count) return;
    const existing = document.querySelector('.admin-hw-popup');
    if (existing) {
      existing.remove();
    }

    const popup = document.createElement('div');
    popup.className = 'admin-hw-popup';
    popup.innerHTML = `
      <div class="admin-hw-popup__icon">
        <i class="fas fa-microchip"></i>
      </div>
      <div>
        <div class="admin-hw-popup__title">Nuevo estado de hardware</div>
        <div class="admin-hw-popup__text">Se detectaron ${count} cambio(s) nuevo(s)</div>
      </div>
    `;

    document.body.appendChild(popup);
    setTimeout(() => {
      popup.remove();
    }, 3500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.adminHardwareNotifications) return;

  const role = window.currentUser?.role;
  if (role === 'admin' || role === 'super_admin' || role === 'superadmin' ||
      window.location.pathname.startsWith('/admin') ||
      window.location.pathname.startsWith('/super_admin')) {
    window.adminHardwareNotifications = new AdminHardwareNotifications();
  }
});
