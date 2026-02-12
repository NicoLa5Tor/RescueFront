(() => {
  class AdminHardwareMain {
    constructor() {
      this.apiClient = null;
      this.hardware = [];
      this.filteredHardware = [];
      this.hardwareTypes = [];
      this.empresas = [];
      this.filters = {
        search: '',
        type: '',
        status: '',
        includeInactive: 'active'
      };
      this.batchSize = 3;
      this.visibleHardwareCount = 0;
      this.lazyObserver = null;
      this.lazySentinel = null;
      this.lazyButton = null;
      this.initialized = false;
      this.isLoading = false;
      this.sessionOpenPending = false;
      this.elements = {};
      this.buildApiUrl = window.__buildApiUrl || ((path = '') => {
        const base = window.__APP_CONFIG && window.__APP_CONFIG.apiUrl;
        if (!base) {
          throw new Error('API URL no configurada');
        }
        const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
        if (!path) {
          return normalizedBase;
        }
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        return `${normalizedBase}${normalizedPath}`;
      });

      this.init();
    }

    async init() {
      if (this.initialized) {
        this.activate();
        return;
      }

      this.cacheElements();
      this.bindEvents();

      try {
        await this.setupApiClient();
        await Promise.all([
          this.loadHardwareTypes(),
          this.loadEmpresas()
        ]);
        await this.loadHardware();
      } catch (error) {
        this.renderEmptyState('No se pudo cargar el hardware', 'Revisa tu conexión y vuelve a intentar.');
      }

      this.initialized = true;
    }

    activate() {
      this.cacheElements();
      this.applyFilters();
      this.openHardwareFromSession();
    }

    cacheElements() {
      const root = document.querySelector('[data-spa-section="hardware"]') || document;
      this.elements.sectionRoot = root;
      this.elements.searchInput = root.querySelector('#searchInput');
      this.elements.typeFilter = root.querySelector('#typeFilter');
      this.elements.statusFilter = root.querySelector('#statusFilter');
      this.elements.includeInactiveFilter = root.querySelector('#includeInactiveFilter');
      this.elements.hardwareGrid = root.querySelector('#hardwareGrid');
      this.elements.totalItemsCount = root.querySelector('#totalItemsCount');
      this.elements.availableItemsCount = root.querySelector('#availableItemsCount');
      this.elements.outOfStockCount = root.querySelector('#outOfStockCount');
      this.elements.totalValueCount = root.querySelector('#totalValueCount');
    }

    bindEvents() {
      if (this.elements.searchInput) {
        this.elements.searchInput.addEventListener('input', (event) => {
          this.filters.search = event.target.value || '';
          this.applyFilters();
        });
      }

      if (this.elements.typeFilter) {
        this.elements.typeFilter.addEventListener('change', (event) => {
          this.filters.type = event.target.value || '';
          this.applyFilters();
        });
      }

      if (this.elements.statusFilter) {
        this.elements.statusFilter.addEventListener('change', (event) => {
          this.filters.status = event.target.value || '';
          this.applyFilters();
        });
      }

      if (this.elements.includeInactiveFilter) {
        this.elements.includeInactiveFilter.addEventListener('change', (event) => {
          this.filters.includeInactive = event.target.value || 'active';
          this.loadHardware();
        });
      }
    }

    async setupApiClient() {
      if (window.AdminSpaApi?.getClient) {
        const apiClient = window.AdminSpaApi.getClient();
        if (apiClient) {
          this.apiClient = apiClient;
          return;
        }
      }

      if (window.apiClient) {
        this.apiClient = window.apiClient;
        return;
      }

      if (typeof EndpointTestClient !== 'undefined') {
        this.apiClient = new EndpointTestClient();
        return;
      }

      this.apiClient = {
        get_hardware_list: () => fetch(this.buildApiUrl('/api/hardware'), { credentials: 'include' }),
        get_hardware_list_including_inactive: () => fetch(this.buildApiUrl('/api/hardware/all-including-inactive'), { credentials: 'include' }),
        get_hardware_types: () => fetch(this.buildApiUrl('/api/hardware-types'), { credentials: 'include' }),
        get_empresas: () => fetch(this.buildApiUrl('/api/empresas'), { credentials: 'include' })
      };
    }

    async loadHardwareTypes() {
      try {
        const response = await this.apiClient.get_hardware_types();
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          this.hardwareTypes = data.data;
          this.populateTypeDropdowns(this.hardwareTypes);
        }
      } catch (error) {
        return;
      }
    }

    async loadEmpresas() {
      try {
        const response = await this.apiClient.get_empresas();
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          this.empresas = data.data;
          this.populateEmpresaDropdown(this.empresas);
        }
      } catch (error) {
        return;
      }
    }

    async loadHardware() {
      if (this.isLoading) return;
      this.isLoading = true;
      this.renderLoadingState();

      try {
        const response = this.filters.includeInactive === 'all'
          ? await this.apiClient.get_hardware_list_including_inactive()
          : await this.apiClient.get_hardware_list();
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          this.hardware = data.data;
          this.updateStats(this.hardware);
          this.applyFilters();
          this.openHardwareFromSession();
        } else {
          this.hardware = [];
          this.updateStats([]);
          this.renderEmptyState('No hay hardware disponible', 'Aún no se han registrado equipos.');
        }
      } catch (error) {
        this.hardware = [];
        this.updateStats([]);
        this.renderEmptyState('No se pudo cargar el hardware', 'Inténtalo de nuevo en unos segundos.');
      } finally {
        this.isLoading = false;
      }
    }

    renderLoadingState() {
      if (!this.elements.hardwareGrid) return;
      this.resetLazyState();
      this.elements.hardwareGrid.innerHTML = `
        <div class="col-span-full text-center py-16">
          <i class="fas fa-spinner fa-spin text-3xl text-blue-400 mb-4"></i>
          <h2 class="text-2xl font-bold text-white mb-2">Cargando hardware...</h2>
          <p class="text-gray-400">Preparando el inventario</p>
        </div>
      `;
    }

    renderEmptyState(title, message) {
      if (!this.elements.hardwareGrid) return;
      this.resetLazyState();
      this.elements.hardwareGrid.innerHTML = `
        <div class="col-span-full text-center py-16">
          <i class="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
          <h2 class="text-2xl font-bold text-white mb-2">${this.escapeHtml(title)}</h2>
          <p class="text-gray-400">${this.escapeHtml(message)}</p>
        </div>
      `;
    }

    populateTypeDropdowns(types) {
      const typeSelect = document.getElementById('hardwareType');
      const filterSelect = this.elements.typeFilter;
      const buildOptions = (select, placeholder) => {
        if (!select) return;
        select.innerHTML = `<option value="">${placeholder}</option>`;
        types.forEach((type) => {
          const option = document.createElement('option');
          option.value = type.nombre || type.name || '';
          option.textContent = type.nombre || type.name || '';
          select.appendChild(option);
        });
      };

      buildOptions(typeSelect, 'Seleccionar tipo');
      buildOptions(filterSelect, 'Todos los tipos');
    }

    populateEmpresaDropdown(empresas) {
      const empresaSelect = document.getElementById('hardwareEmpresa');
      if (!empresaSelect) return;
      empresaSelect.innerHTML = '<option value="">Seleccionar empresa</option>';
      empresas.forEach((empresa) => {
        const option = document.createElement('option');
        option.value = empresa._id;
        option.textContent = empresa.nombre;
        option.dataset.nombre = empresa.nombre;
        empresaSelect.appendChild(option);
      });
    }

    loadSedesByEmpresa() {
      const empresaSelect = document.getElementById('hardwareEmpresa');
      const sedeSelect = document.getElementById('hardwareSede');
      if (!empresaSelect || !sedeSelect) return;

      const selectedEmpresaId = empresaSelect.value;
      sedeSelect.innerHTML = '<option value="">Seleccionar sede</option>';
      sedeSelect.disabled = true;

      if (!selectedEmpresaId) return;

      const selectedEmpresa = this.empresas.find((empresa) => empresa._id === selectedEmpresaId);
      if (!selectedEmpresa) return;

      const sedes = Array.isArray(selectedEmpresa.sedes) ? selectedEmpresa.sedes : [];
      if (sedes.length === 0) {
        const option = document.createElement('option');
        option.value = 'Principal';
        option.textContent = 'Principal';
        sedeSelect.appendChild(option);
        sedeSelect.disabled = false;
        return;
      }

      sedes.forEach((sede) => {
        const option = document.createElement('option');
        option.value = sede;
        option.textContent = sede;
        sedeSelect.appendChild(option);
      });
      sedeSelect.disabled = false;
    }

    applyFilters() {
      const search = this.filters.search.trim().toLowerCase();
      const type = this.filters.type;
      const status = this.filters.status;
      const hasFilters = Boolean(search || type || status);

      if (!this.hardware.length) {
        this.renderEmptyState('No hay hardware disponible', 'Aun no se han registrado equipos.');
        return;
      }

      const filtered = this.hardware.filter((hardware) => {
        const datos = this.extractDatos(hardware);
        const name = (hardware.nombre || '').toLowerCase();
        const brand = (datos.brand || datos.marca || '').toLowerCase();
        const model = (datos.model || datos.modelo || '').toLowerCase();
        const sede = (hardware.sede || '').toLowerCase();
        const empresaNombre = (hardware.empresa_nombre || '').toLowerCase();

        const matchesSearch = !search
          || name.includes(search)
          || brand.includes(search)
          || model.includes(search)
          || sede.includes(search)
          || empresaNombre.includes(search)
          || (hardware.tipo || '').toLowerCase().includes(search);

        const matchesType = !type || hardware.tipo === type;

        const statusValue = datos.status || hardware.status || 'available';
        const stock = parseInt(datos.stock || hardware.stock || 0, 10);
        const activa = hardware.activa !== false;
        let matchesStatus = true;

        if (status) {
          switch (status) {
            case 'available':
              matchesStatus = activa && stock > 0 && statusValue !== 'discontinued';
              break;
            case 'out_of_stock':
              matchesStatus = stock === 0 || statusValue === 'out_of_stock';
              break;
            case 'discontinued':
              matchesStatus = statusValue === 'discontinued';
              break;
            case 'inactive':
              matchesStatus = !activa;
              break;
            default:
              matchesStatus = true;
          }
        }

        return matchesSearch && matchesType && matchesStatus;
      });

      if (!filtered.length) {
        this.resetLazyState();
        this.renderFilterEmptyMessage(0, hasFilters);
        return;
      }

      this.renderHardware(filtered, hasFilters);
    }

    renderFilterEmptyMessage(visibleCount, hasFilters) {
      if (!this.elements.hardwareGrid) return;
      const existing = document.getElementById('hardwareFilterEmpty');
      if (existing) existing.remove();

      if (!hasFilters || visibleCount > 0) return;

      const emptyMessage = document.createElement('div');
      emptyMessage.id = 'hardwareFilterEmpty';
      emptyMessage.className = 'col-span-full text-center py-8';
      emptyMessage.innerHTML = `
        <div class="text-center">
          <i class="fas fa-search text-4xl mb-4 text-gray-400"></i>
          <h2 class="text-2xl font-bold text-white mb-2">No se encontró hardware con este filtro</h2>
          <p class="text-sm text-gray-400">Prueba ajustando los criterios de búsqueda.</p>
          <button onclick="clearHardwareFilters()" class="mt-4 ios-action-btn">
            <i class="fas fa-filter-circle-xmark"></i>
            Limpiar filtros
          </button>
        </div>
      `;
      this.elements.hardwareGrid.appendChild(emptyMessage);
    }

    renderHardware(hardwareList, hasFilters) {
      if (!this.elements.hardwareGrid) return;
      this.filteredHardware = hardwareList;
      this.visibleHardwareCount = 0;
      this.elements.hardwareGrid.innerHTML = '';
      this.removeLazySentinel();
      this.renderNextBatch();
      this.renderFilterEmptyMessage(hardwareList.length, hasFilters);
    }

    renderNextBatch() {
      if (!this.elements.hardwareGrid) return;
      if (!this.filteredHardware.length) return;

      const start = this.visibleHardwareCount;
      const nextItems = this.filteredHardware.slice(start, start + this.batchSize);

      if (!nextItems.length) {
        this.removeLazySentinel();
        return;
      }

      const fragment = document.createDocumentFragment();
      nextItems.forEach((hardware) => {
        const card = this.createHardwareCard(hardware);
        if (card) {
          fragment.appendChild(card);
        }
      });

      this.elements.hardwareGrid.appendChild(fragment);
      this.visibleHardwareCount += nextItems.length;

      if (this.visibleHardwareCount < this.filteredHardware.length) {
        this.ensureLazySentinel();
      } else {
        this.removeLazySentinel();
      }
    }

    ensureLazySentinel() {
      if (!this.elements.hardwareGrid) return;

      if (!this.lazySentinel) {
        const sentinel = document.createElement('div');
        sentinel.id = 'hardwareLazySentinel';
        this.lazySentinel = sentinel;
      }

      const useManual = !('IntersectionObserver' in window);
      if (useManual) {
        this.lazySentinel.className = 'col-span-full flex justify-center py-4';
        if (!this.lazyButton) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'ios-action-btn';
          button.textContent = 'Cargar mas';
          button.addEventListener('click', () => this.renderNextBatch());
          this.lazyButton = button;
        }
        this.lazySentinel.innerHTML = '';
        this.lazySentinel.appendChild(this.lazyButton);
      } else {
        this.lazySentinel.className = 'col-span-full h-6';
        this.lazySentinel.innerHTML = '';
      }

      if (this.lazySentinel.parentElement !== this.elements.hardwareGrid) {
        this.elements.hardwareGrid.appendChild(this.lazySentinel);
      }

      if (!useManual) {
        this.setupLazyObserver();
      }
    }

    setupLazyObserver() {
      if (!this.lazySentinel || !('IntersectionObserver' in window)) return;

      if (this.lazyObserver) {
        this.lazyObserver.disconnect();
      }

      this.lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.renderNextBatch();
          }
        });
      }, { root: null, rootMargin: '200px 0px', threshold: 0.1 });

      this.lazyObserver.observe(this.lazySentinel);
    }

    removeLazySentinel() {
      if (this.lazyObserver) {
        this.lazyObserver.disconnect();
      }
      if (this.lazySentinel && this.lazySentinel.parentElement) {
        this.lazySentinel.parentElement.removeChild(this.lazySentinel);
      }
    }

    resetLazyState() {
      this.visibleHardwareCount = 0;
      this.filteredHardware = [];
      if (this.elements.hardwareGrid) {
        this.elements.hardwareGrid.innerHTML = '';
      }
      this.removeLazySentinel();
    }

    createHardwareCard(hardware) {
      const datos = this.extractDatos(hardware);
      const statusValue = datos.status || 'available';
      const stock = parseInt(datos.stock || 0, 10);
      const active = hardware.activa !== false;

      const physicalInactive = this.isPhysicalInactive(hardware, datos);

      let statusClass = 'ios-status-available';
      let statusText = 'Disponible';

      if (!active || physicalInactive) {
        statusClass = 'ios-status-discontinued';
        statusText = 'Inactivo';
      } else if (statusValue === 'discontinued') {
        statusClass = 'ios-status-discontinued';
        statusText = 'Descontinuado';
      } else if (statusValue === 'out_of_stock' || stock === 0) {
        statusClass = 'ios-status-stock';
        statusText = 'Sin Stock';
      }

      const locationUrl = hardware.direccion_url || hardware.direccion_open_maps || '';
      const name = this.escapeHtml(hardware.nombre || 'Sin nombre');
      const brand = this.escapeHtml(datos.brand || datos.marca || 'N/A');
      const model = this.escapeHtml(datos.model || datos.modelo || 'N/A');
      const price = datos.price || datos.precio || 0;

      const card = document.createElement('div');
      card.className = 'ios-hardware-card hardware-item';
      card.dataset.type = hardware.tipo || '';
      card.dataset.status = statusValue;
      card.dataset.name = (hardware.nombre || '').toLowerCase();
      card.dataset.brand = (brand || '').toLowerCase();
      card.dataset.model = (model || '').toLowerCase();
      card.dataset.sede = (hardware.sede || '').toLowerCase();
      card.dataset.stock = String(stock);
      card.dataset.activa = active ? 'true' : 'false';
      card.dataset.hardwareId = hardware._id || '';
      card.dataset.physicalInactive = physicalInactive ? 'true' : 'false';

      if (physicalInactive) {
        card.classList.add('hardware-physical-inactive');
      }

      card.innerHTML = `
        <div class="ios-card-header">
          <div class="ios-card-icon">
            <i class="fas fa-microchip"></i>
          </div>
          <span class="ios-status-badge ${statusClass}">${statusText}</span>
        </div>
        <h3 class="ios-card-title">${name}</h3>
        <p class="ios-card-subtitle">${brand} • ${model}</p>
        <div class="ios-card-info">
          <div class="ios-info-item">
            <span class="ios-info-label">Precio</span>
            <span class="ios-info-value">$${this.escapeHtml(String(price || 0))}</span>
          </div>
          <div class="ios-info-item">
            <span class="ios-info-label">Stock</span>
            <span class="ios-info-value">${this.escapeHtml(String(stock))}</span>
          </div>
          <div class="ios-info-item">
            <span class="ios-info-label">Tipo</span>
            <span class="ios-info-value">${this.escapeHtml(hardware.tipo || 'N/A')}</span>
          </div>
          <div class="ios-info-item">
            <span class="ios-info-label">Estado</span>
            <span class="ios-info-value">${active ? 'Activo' : 'Inactivo'}</span>
          </div>
        </div>
        <div class="ios-card-actions">
          <button class="ios-card-btn" onclick="openHardwareViewModal('${hardware._id}')" title="Ver detalles">
            <i class="fas fa-eye"></i>
          </button>
          <button class="ios-card-btn ios-card-btn-primary" onclick="openHardwareEditModal('${hardware._id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="ios-card-btn ${active ? 'ios-card-btn-warning' : 'ios-card-btn-success'}" onclick="openHardwareToggleModal('${hardware._id}', ${!active})" title="${active ? 'Desactivar' : 'Activar'}">
            <i class="fas ${active ? 'fa-power-off' : 'fa-play'}"></i>
          </button>
          ${locationUrl ? `<button class="ios-card-btn" onclick="openHardwareLocationModal('${hardware._id}', '${this.escapeQuotes(locationUrl)}')" title="Ver ubicación">
            <i class="fas fa-map-location-dot"></i>
          </button>` : ''}
        </div>
        <div class="ios-card-shimmer"></div>
      `;

      if (window.applyCardOptimizations) {
        window.applyCardOptimizations(card);
      }

      return card;
    }

    updateStats(hardwareList) {
      const total = hardwareList.length;
      let availableCount = 0;
      let outOfStockCount = 0;
      let totalValue = 0;

      hardwareList.forEach((hardware) => {
        const datos = this.extractDatos(hardware);
        const stock = parseInt(datos.stock || 0, 10);
        const price = parseFloat(datos.price || 0);
        const status = datos.status || 'available';
        const active = hardware.activa !== false;

        if (active && stock > 0 && status !== 'discontinued') {
          availableCount += 1;
        } else if (stock === 0 || status === 'out_of_stock') {
          outOfStockCount += 1;
        }

        totalValue += price * stock;
      });

      if (this.elements.totalItemsCount) this.elements.totalItemsCount.textContent = total;
      if (this.elements.availableItemsCount) this.elements.availableItemsCount.textContent = availableCount;
      if (this.elements.outOfStockCount) this.elements.outOfStockCount.textContent = outOfStockCount;
      if (this.elements.totalValueCount) {
        this.elements.totalValueCount.textContent = `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }

    clearFilters() {
      this.filters.search = '';
      this.filters.type = '';
      this.filters.status = '';

      if (this.elements.searchInput) this.elements.searchInput.value = '';
      if (this.elements.typeFilter) this.elements.typeFilter.value = '';
      if (this.elements.statusFilter) this.elements.statusFilter.value = '';

      this.applyFilters();
    }

    extractDatos(hardware) {
      if (!hardware || !hardware.datos) return {};
      if (typeof hardware.datos === 'object') {
        return hardware.datos.datos || hardware.datos;
      }
      if (typeof hardware.datos === 'string') {
        try {
          const parsed = JSON.parse(hardware.datos);
          return parsed.datos || parsed;
        } catch (error) {
          return {};
        }
      }
      return {};
    }

    isPhysicalInactive(hardware, datos) {
      const physicalStatusRaw = hardware.physical_status
        || hardware.physicalStatus
        || hardware.estado_fisico
        || datos.physical_status
        || datos.physicalStatus
        || datos.estado_fisico;

      if (!physicalStatusRaw) return false;
      let physicalStatus = physicalStatusRaw;
      if (typeof physicalStatusRaw === 'string') {
        try {
          physicalStatus = JSON.parse(physicalStatusRaw);
        } catch (error) {
          physicalStatus = physicalStatusRaw;
        }
      }

      if (typeof physicalStatus === 'string') {
        const normalized = physicalStatus.trim().toLowerCase();
        return normalized === 'inactivo' || normalized === 'inactive';
      }

      if (typeof physicalStatus === 'object') {
        const values = Object.values(physicalStatus);
        return values.some((value) => String(value).trim().toLowerCase() === 'inactivo' || String(value).trim().toLowerCase() === 'inactive');
      }

      return false;
    }

    openHardwareFromSession() {
      if (this.sessionOpenPending) return;

      const hardwareId = sessionStorage.getItem('openHardwareId');
      if (!hardwareId) return;

      const maxRetries = 20;
      let attempts = 0;

      const tryOpen = () => {
        if (typeof window.openHardwareViewModal === 'function') {
          sessionStorage.removeItem('openHardwareId');
          window.openHardwareViewModal(hardwareId);
          return;
        }

        attempts += 1;
        if (attempts < maxRetries) {
          setTimeout(tryOpen, 400);
        } else {
          sessionStorage.removeItem('openHardwareId');
        }
      };

      this.sessionOpenPending = true;
      setTimeout(() => {
        this.sessionOpenPending = false;
        tryOpen();
      }, 400);
    }

    escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    escapeQuotes(value) {
      return String(value).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    }
  }

  window.initAdminHardwareMain = () => {
    if (window.adminHardwareMain) {
      window.adminHardwareMain.activate();
      return window.adminHardwareMain;
    }
    window.adminHardwareMain = new AdminHardwareMain();
    return window.adminHardwareMain;
  };

  window.clearHardwareFilters = () => {
    if (window.adminHardwareMain) {
      window.adminHardwareMain.clearFilters();
    }
  };

  window.loadHardwareSedesByEmpresa = () => {
    if (window.adminHardwareMain) {
      window.adminHardwareMain.loadSedesByEmpresa();
    }
  };
})();
