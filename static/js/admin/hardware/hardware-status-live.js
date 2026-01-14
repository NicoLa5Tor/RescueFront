class AdminHardwareStatusLive {
  constructor() {
    this.refreshInterval = null;
    this.activePhysicalIds = new Set();

    this.initialize();
  }

  initialize() {
    if (!window.location.pathname.startsWith('/admin/hardware')) return;
    this.fetchStatus();
    this.startAutoRefresh();
  }

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.fetchStatus();
    }, 10000);
  }

  async fetchStatus() {
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

      if (!response.ok) return;

      const data = await response.json();
      const items = this.normalizeItems(data);
      const nextIds = new Set(items.map(item => item.id));
      this.updateCards(nextIds);
      this.activePhysicalIds = nextIds;
    } catch (error) {
      return;
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
    const stableId = hardwareId || '';
    return { id: stableId };
  }

  updateCards(activeIds) {
    const cards = document.querySelectorAll('.ios-hardware-card[data-hardware-id]');
    cards.forEach(card => {
      const hardwareId = card.getAttribute('data-hardware-id');
      if (!hardwareId) return;

      const isPhysicalInactive = activeIds.has(hardwareId);
      this.applyPhysicalState(card, isPhysicalInactive);
    });
  }

  applyPhysicalState(card, isPhysicalInactive) {
    if (isPhysicalInactive) {
      this.markPhysicalInactive(card);
      return;
    }

    if (card.dataset.physicalInactive !== 'true') return;
    this.clearPhysicalInactive(card);
  }

  markPhysicalInactive(card) {
    if (card.dataset.physicalInactive === 'true') return;

    card.dataset.physicalInactive = 'true';
    if (!card.dataset.originalStyle) {
      card.dataset.originalStyle = card.style.cssText || '';
    }

    card.classList.add('hardware-physical-inactive');
    card.style.cssText += 'background: rgba(239, 68, 68, 0.18) !important; border: 1px solid rgba(239, 68, 68, 0.35) !important; box-shadow: 0 10px 28px rgba(239, 68, 68, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.35) !important;';

    this.updateStatusBadge(card, 'ios-status-discontinued', 'Inactivo');
  }

  clearPhysicalInactive(card) {
    card.dataset.physicalInactive = 'false';
    card.classList.remove('hardware-physical-inactive');
    card.style.cssText = card.dataset.originalStyle || '';

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
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.adminHardwareStatusLive) return;
  window.adminHardwareStatusLive = new AdminHardwareStatusLive();
});
