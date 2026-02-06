(() => {
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

  document.addEventListener('DOMContentLoaded', () => {
    bindModalControls();
  });
})();
