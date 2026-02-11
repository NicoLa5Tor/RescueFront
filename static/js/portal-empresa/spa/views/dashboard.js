(() => {
  const viewName = 'dashboard';
  let initialized = false;

  const updateSystemInfo = () => {
    const kpisLoadedElement = document.getElementById('kpisLoadedStatus');
    const lastUpdateElement = document.getElementById('lastUpdateStatus');

    if (kpisLoadedElement) {
      const isLoaded = Boolean(window.DASHBOARD_SUMMARY);
      kpisLoadedElement.textContent = isLoaded ? 'Sí' : 'No';
      kpisLoadedElement.style.color = isLoaded ? '#10b981' : '#ef4444';
    }

    if (lastUpdateElement) {
      const now = new Date();
      lastUpdateElement.textContent = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  };

  const showSystemInfo = () => {
    updateSystemInfo();

    const modal = document.getElementById('systemInfoModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.offsetHeight;

    document.body.classList.add('ios-modal-open');
  };

  const hideSystemInfo = () => {
    const modal = document.getElementById('systemInfoModal');
    if (!modal) return;

    modal.classList.add('hidden');
    document.body.classList.remove('ios-modal-open');
  };

  const bindModalControls = () => {
    document.addEventListener('click', (event) => {
      const actionButton = event.target.closest('[data-dashboard-action]');
      if (!actionButton) return;

      const action = actionButton.getAttribute('data-dashboard-action');
      if (action === 'system-info') {
        showSystemInfo();
      }

      if (action === 'close-modal') {
        hideSystemInfo();
      }
    });

    const modal = document.getElementById('systemInfoModal');
    if (modal) {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          hideSystemInfo();
        }
      });
    }

    document.addEventListener('keydown', (event) => {
      const modal = document.getElementById('systemInfoModal');
      if (!modal) return;
      if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
        hideSystemInfo();
      }
    });
  };

  const init = () => {
    if (initialized) return;
    initialized = true;

    const summaryElement = document.getElementById('dashboardSummaryData');
    if (summaryElement) {
      try {
        const summaryText = summaryElement.textContent;
        window.DASHBOARD_SUMMARY = summaryText && summaryText !== 'null'
          ? JSON.parse(summaryText)
          : null;
      } catch (error) {
        window.DASHBOARD_SUMMARY = null;
      }
    }

    bindModalControls();
  };

  const mount = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
      return;
    }
    init();
  };

  const unmount = () => {};

  window.EmpresaSpaViews = window.EmpresaSpaViews || {};
  const existing = window.EmpresaSpaViews[viewName];
  if (Array.isArray(existing)) {
    existing.push({ mount, unmount });
  } else if (existing) {
    window.EmpresaSpaViews[viewName] = [existing, { mount, unmount }];
  } else {
    window.EmpresaSpaViews[viewName] = [{ mount, unmount }];
  }

  if (!window.EMPRESA_SPA_MANUAL_INIT) {
    mount();
  }
})();
