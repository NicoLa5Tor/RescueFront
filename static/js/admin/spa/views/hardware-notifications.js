(() => {
  class AdminHardwareNotifications {
    constructor() {
      this.isActive = false;
      this.hardwareCache = new Map();
      this.refreshInterval = null;
      this.notificationBadge = null;
      this.alertsPanel = null;
      this.hardwareCount = 0;
      this.currentHardwareIds = new Set();
      this.shownHardwareIds = new Set();
      this.isHardwareFirstLoad = true;
      this.badgeInitAttempts = 0;
      this.maxBadgeInitAttempts = 10;
      this.userId = window.currentUser?.id || 'admin';
      this.hardwareStorageKey = `admin_hardware_shown_${this.userId}`;
    }

    async start() {
      if (this.isActive) return;
      if (!this.isAdminUser()) return;

      this.isActive = true;
      this.loadShownHardwareFromStorage();
      await this.createGlobalUI();
      await this.loadHardwareStatus();
      this.removeHardwarePopupElements();
      this.startAutoRefresh();
      this.setupGlobalListeners();
    }

    stop() {
      this.isActive = false;
      this.stopAutoRefresh();
      this.closeAlertsPanel();
    }

    isAdminUser() {
      const role = window.currentUser?.role;
      return role === 'admin'
        || role === 'super_admin'
        || role === 'superadmin'
        || window.location.pathname.startsWith('/admin')
        || window.location.pathname.startsWith('/super_admin');
    }

    async createGlobalUI() {
      this.createNotificationBadge();
      this.createFloatingAlertsPanel();
      this.injectStyles();
    }

    createNotificationBadge() {
      if (this.headerNotificationBtn || this.notificationBadge) return;

      const headerNotificationBtn = document.querySelector('.navbar__action[aria-label="Notifications"]');
      const notificationBadge = document.querySelector('.navbar__notification-badge');

      if (!headerNotificationBtn || !notificationBadge) {
        this.badgeInitAttempts += 1;
        if (this.badgeInitAttempts <= this.maxBadgeInitAttempts) {
          setTimeout(() => this.createNotificationBadge(), 300);
        }
        return;
      }

      headerNotificationBtn.addEventListener('click', (event) => {
        event.preventDefault();
        this.toggleAlertsPanel();
      });

      notificationBadge.id = 'alertsCount';
      notificationBadge.style.display = 'none';
      notificationBadge.style.position = 'absolute';
      notificationBadge.style.top = '-5px';
      notificationBadge.style.right = '-5px';
      notificationBadge.style.backgroundColor = '#ef4444';
      notificationBadge.style.color = 'white';
      notificationBadge.style.borderRadius = '50%';
      notificationBadge.style.minWidth = '18px';
      notificationBadge.style.height = '18px';
      notificationBadge.style.fontSize = '11px';
      notificationBadge.style.fontWeight = 'bold';
      notificationBadge.style.textAlign = 'center';
      notificationBadge.style.lineHeight = '18px';
      notificationBadge.style.zIndex = '10';

      this.notificationBadge = notificationBadge;
      this.headerNotificationBtn = headerNotificationBtn;
    }

    createFloatingAlertsPanel() {
      const panelHTML = `
        <div id="globalAlertsPanel" class="empresa-alerts-panel hidden">
          <div class="empresa-alerts-panel__header">
            <div class="empresa-alerts-panel__title">
              <i class="fas fa-microchip"></i>
              Estado fisico de hardware
            </div>
            <button class="empresa-alerts-panel__close" type="button" aria-label="Cerrar" onclick="window.adminHardwareNotifications.closeAlertsPanel()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="empresa-alerts-panel__body" id="globalHardwareList">
            <div class="empresa-alerts-panel__loading">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Verificando hardware...</span>
            </div>
          </div>

          <div class="empresa-alerts-panel__footer">
            <button class="empresa-alerts-panel__action" type="button" onclick="window.adminHardwareNotifications.goToHardware()">
              <i class="fas fa-list"></i>
              Ver hardware
            </button>
            <button class="empresa-alerts-panel__action empresa-alerts-panel__action--secondary" type="button" onclick="window.adminHardwareNotifications.refreshHardware()">
              <i class="fas fa-sync-alt"></i>
              Actualizar
            </button>
          </div>
        </div>

        <div id="globalAlertsPanelOverlay" class="empresa-alerts-overlay hidden" onclick="window.adminHardwareNotifications.closeAlertsPanel()"></div>
      `;

      document.body.insertAdjacentHTML('beforeend', panelHTML);
      this.alertsPanel = document.getElementById('globalAlertsPanel');
    }

    injectStyles() {
      const styles = `
        <style id="empresaAlertsGlobalStyles">
          @keyframes alertGlow {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 0 0 rgba(239, 68, 68, 0.4), 0 0 0 rgba(255, 255, 255, 0.2);
            }
            50% {
              transform: scale(1.1);
              box-shadow: 0 0 8px rgba(239, 68, 68, 0.8), 0 0 12px rgba(239, 68, 68, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.6);
            }
          }

          .empresa-alerts-panel {
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

          .empresa-alerts-panel.hidden {
            opacity: 0;
            transform: translateY(-50%) translateX(100%);
            pointer-events: none;
          }

          .empresa-alerts-panel__header {
            padding: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .empresa-alerts-panel__title {
            color: white;
            font-weight: 600;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
          }

          .empresa-alerts-panel__title i {
            color: #fbbf24;
          }

          .empresa-alerts-panel__close {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.6);
            font-size: 18px;
            cursor: pointer;
            padding: 4px;
            border-radius: 6px;
            transition: all 0.2s ease;
          }

          .empresa-alerts-panel__close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
          }

          .empresa-alerts-panel__body {
            flex: 1;
            overflow-y: auto;
            padding: 0;
            max-height: 400px;
          }

          .empresa-alerts-panel__loading {
            padding: 40px 20px;
            text-align: center;
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
          }

          .empresa-alerts-panel__loading i {
            font-size: 24px;
            margin-bottom: 12px;
            display: block;
          }

          .empresa-alerts-panel__item {
            padding: 16px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.2s ease;
            cursor: pointer;
          }

          .empresa-alerts-panel__item:hover {
            background: rgba(255, 255, 255, 0.05);
          }

          .empresa-alerts-panel__item:last-child {
            border-bottom: none;
          }

          .empresa-alerts-panel__item-title {
            color: white;
            font-weight: 600;
            font-size: 14px;
            flex: 1;
          }

          .empresa-alerts-panel__item-info {
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
            line-height: 1.4;
          }

          .empresa-alerts-panel__item-meta {
            color: rgba(255, 255, 255, 0.5);
            font-size: 11px;
            margin-top: 4px;
          }

          .empresa-alerts-panel__footer {
            padding: 16px 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            gap: 8px;
          }

          .empresa-alerts-panel__action {
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

          .empresa-alerts-panel__action--secondary {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .empresa-alerts-panel__action:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }

          .empresa-alerts-panel__action--secondary:hover {
            background: rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
          }

          .empresa-alerts-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.3);
            z-index: 1000;
          }

          .no-alerts-state {
            padding: 40px 20px;
            text-align: center;
            color: rgba(255, 255, 255, 0.6);
          }

          .no-alerts-state i {
            font-size: 48px;
            margin-bottom: 16px;
            display: block;
            color: #16a34a;
          }

          @media (max-width: 768px) {
            .empresa-alerts-panel {
              width: calc(100vw - 40px);
              right: 20px;
              left: 20px;
            }
          }
        </style>
      `;

      document.head.insertAdjacentHTML('beforeend', styles);
    }

    async loadHardwareStatus() {
      if (!this.isActive) return;

      try {
        const base = typeof window.__buildApiUrl === 'function'
          ? window.__buildApiUrl('')
          : (window.__APP_CONFIG?.apiUrl || '');
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
        const items = this.normalizeHardwareItems(data);

        this.checkForNewHardware(items);
        this.hardwareCache.set('current', {
          items,
          timestamp: Date.now()
        });
        this.updateHardwarePanel(items);
        this.hardwareCount = items.length;
        this.updateNotificationBadge();
        this.updateHardwareCards(items);
      } catch (error) {
        this.showHardwareError();
      }
    }

    updateNotificationBadge() {
      if (!this.notificationBadge) return;

      this.notificationBadge.textContent = this.hardwareCount;

      if (this.hardwareCount > 0) {
        this.notificationBadge.style.display = 'flex';
        this.notificationBadge.style.animation = 'alertGlow 2s infinite';
      } else {
        this.notificationBadge.style.display = 'none';
        this.notificationBadge.style.animation = 'none';
      }
    }

    updateHardwarePanel(items) {
      const panel = document.getElementById('globalHardwareList');
      if (!panel) return;

      if (!items || items.length === 0) {
        panel.innerHTML = `
          <div class="no-alerts-state">
            <i class="fas fa-check-circle"></i>
            <h3 style="color: white; margin-bottom: 8px; font-size: 16px;">Todo en orden</h3>
            <p style="font-size: 14px;">No hay incidencias fisicas en este momento</p>
          </div>
        `;
        return;
      }

      const itemsHTML = items.map((item) => `
        <div class="empresa-alerts-panel__item" role="button" tabindex="0" onclick="window.adminHardwareNotifications.goToHardware('${item.hardwareId || ''}')">
          <div class="empresa-alerts-panel__item-title">
            ${this.escapeHtml(item.hardwareName)}
          </div>
          <div class="empresa-alerts-panel__item-info">
            <div><strong>${this.escapeHtml(item.empresaName)}</strong> - ${this.escapeHtml(item.sedeName)}</div>
          </div>
          ${item.hardwareId ? `<div class="empresa-alerts-panel__item-meta">ID: ${this.escapeHtml(item.hardwareId)}</div>` : ''}
        </div>
      `).join('');

      panel.innerHTML = itemsHTML;
    }

    updateHardwareCards(items) {
      const inactiveIds = new Set(items.map(item => item.hardwareId || item.id).filter(Boolean));
      const section = document.querySelector('[data-spa-section="hardware"]');
      const scope = section || document;
      const cards = scope.querySelectorAll('.ios-hardware-card[data-hardware-id]');

      cards.forEach((card) => {
        const hardwareId = card.getAttribute('data-hardware-id');
        if (!hardwareId) return;
        const isPhysicalInactive = inactiveIds.has(hardwareId);
        this.applyPhysicalState(card, isPhysicalInactive);
      });
    }

    applyPhysicalState(card, isPhysicalInactive) {
      if (isPhysicalInactive) {
        card.dataset.physicalInactive = 'true';
        card.classList.add('hardware-physical-inactive');
        this.updateStatusBadge(card, 'ios-status-discontinued', 'Inactivo');
        return;
      }

      card.dataset.physicalInactive = 'false';
      card.classList.remove('hardware-physical-inactive');
      const statusData = this.getStatusFromDataset(card.dataset);
      this.updateStatusBadge(card, statusData.className, statusData.label);
    }

    updateStatusBadge(card, className, label) {
      const badge = card.querySelector('.ios-status-badge');
      if (!badge) return;

      badge.classList.remove('ios-status-available', 'ios-status-stock', 'ios-status-discontinued');
      badge.classList.add(className);
      badge.textContent = label;
    }

    getStatusFromDataset(dataset) {
      const status = dataset.status || '';
      const stock = parseInt(dataset.stock || '0', 10);
      const activa = dataset.activa !== 'false';

      if (!activa) {
        return { className: 'ios-status-discontinued', label: 'Inactivo' };
      }
      if (status === 'discontinued') {
        return { className: 'ios-status-discontinued', label: 'Descontinuado' };
      }
      if (stock === 0 || status === 'out_of_stock') {
        return { className: 'ios-status-stock', label: 'Sin Stock' };
      }
      return { className: 'ios-status-available', label: 'Disponible' };
    }

    showHardwareError() {
      const panel = document.getElementById('globalHardwareList');
      if (!panel) return;

      panel.innerHTML = `
        <div class="empresa-alerts-panel__loading" style="color: #f87171;">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Error cargando estado fisico</span>
        </div>
      `;
    }

    normalizeHardwareItems(data) {
      if (!data) return [];
      if (Array.isArray(data)) return data.map(item => this.normalizeHardwareItem(item));

      const candidates = [
        data.data,
        data.items,
        data.hardware,
        data.result,
        data.results
      ];

      const list = candidates.find(Array.isArray) || [];
      return list.map(item => this.normalizeHardwareItem(item));
    }

    normalizeHardwareItem(item) {
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

    checkForNewHardware(items) {
      if (!items || items.length === 0) {
        this.currentHardwareIds.clear();
        return;
      }

      const newIds = new Set(items.map(item => item.id));
      const newlyAppeared = [...newIds].filter(id => !this.currentHardwareIds.has(id));

      if (this.isHardwareFirstLoad) {
        if (newIds.size > 0) {
          this.removeHardwarePopupElements();
          this.openAlertsPanel();
          this.markHardwareAsShown(newlyAppeared.length ? newlyAppeared : Array.from(newIds));
        }
      } else if (newlyAppeared.length > 0) {
        this.removeHardwarePopupElements();
        this.openAlertsPanel();
        this.markHardwareAsShown(newlyAppeared);
      }

      this.currentHardwareIds = new Set(newIds);
      this.isHardwareFirstLoad = false;
    }

    removeHardwarePopupElements() {
      document.querySelectorAll('.hardware-popup').forEach(el => el.remove());
    }

    startAutoRefresh() {
      this.refreshInterval = setInterval(() => {
        this.loadHardwareStatus();
      }, 10000);
    }

    stopAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    }

    setupGlobalListeners() {
      window.addEventListener('beforeunload', () => {
        this.stopAutoRefresh();
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stopAutoRefresh();
        } else {
          this.startAutoRefresh();
          this.loadHardwareStatus();
        }
      });
    }

    toggleAlertsPanel() {
      const overlay = document.getElementById('globalAlertsPanelOverlay');
      if (!this.alertsPanel || !overlay) return;

      const isHidden = this.alertsPanel.classList.contains('hidden');
      if (isHidden) {
        this.openAlertsPanel();
      } else {
        this.closeAlertsPanel();
      }
    }

    openAlertsPanel() {
      const overlay = document.getElementById('globalAlertsPanelOverlay');
      if (this.alertsPanel && overlay) {
        this.alertsPanel.classList.remove('hidden');
        overlay.classList.remove('hidden');
      }
    }

    closeAlertsPanel() {
      const overlay = document.getElementById('globalAlertsPanelOverlay');
      if (this.alertsPanel && overlay) {
        this.alertsPanel.classList.add('hidden');
        overlay.classList.add('hidden');
      }
    }

    async refreshHardware() {
      await this.loadHardwareStatus();
    }

    goToHardware(hardwareId = '') {
      this.closeAlertsPanel();

      if (hardwareId) {
        sessionStorage.setItem('openHardwareId', hardwareId);
      }

      const isHardwareView = window.adminSpa?.getActiveView && window.adminSpa.getActiveView() === 'hardware';

      if (isHardwareView) {
        if (hardwareId && typeof window.openHardwareViewModal === 'function') {
          sessionStorage.removeItem('openHardwareId');
          window.openHardwareViewModal(hardwareId);
          return;
        }
        if (window.adminHardwareMain?.openHardwareFromSession) {
          window.adminHardwareMain.openHardwareFromSession();
          return;
        }
      }

      if (window.adminSpa?.setView) {
        window.adminSpa.setView('hardware');
      }
    }

    loadShownHardwareFromStorage() {
      try {
        const stored = localStorage.getItem(this.hardwareStorageKey);
        if (stored) {
          const shownIds = JSON.parse(stored);
          this.shownHardwareIds = new Set(shownIds);
        }
      } catch (error) {
        this.shownHardwareIds = new Set();
      }
    }

    saveShownHardwareToStorage() {
      try {
        const shownIds = Array.from(this.shownHardwareIds);
        localStorage.setItem(this.hardwareStorageKey, JSON.stringify(shownIds));
      } catch (error) {
        return;
      }
    }

    markHardwareAsShown(hardwareIds) {
      hardwareIds.forEach(id => {
        this.shownHardwareIds.add(id);
      });
      this.saveShownHardwareToStorage();
    }

    escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  }

  const initAdminHardwareNotifications = () => {
    if (window.adminHardwareNotifications) {
      return window.adminHardwareNotifications;
    }
    window.adminHardwareNotifications = new AdminHardwareNotifications();
    return window.adminHardwareNotifications;
  };

  window.initAdminHardwareNotifications = initAdminHardwareNotifications;

  if (!window.ADMIN_SPA_MANUAL_INIT) {
    initAdminHardwareNotifications();
  }
})();
