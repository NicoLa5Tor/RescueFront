/**
 * ===== EMPRESAS MAIN FUNCTIONALITY =====
 * 
 * Este archivo contiene la funcionalidad principal para la gestión de empresas:
 * - Carga de datos de empresas (activas e inactivas)
 * - Filtros y búsqueda
 * - Integración con estado activo/inactivo
 * - Renderizado de tarjetas de empresas
 * - Integración con modales de CRUD
 */

class EmpresasMain {
  constructor() {
    this.empresas = [];
    this.empresasAll = []; // Incluye inactivas para dashboard
    this.tiposEmpresa = [];
    this.currentFilters = {
      search: '',
      tipo: '',
      status: 'all',
      activa: 'all'
    };
    this.currentView = 'dashboard'; // 'dashboard' shows all, 'forms' shows only active
    this.apiClient = null;
    this.isLoading = false;
    
    this.initializeComponents();
  }

  /**
   * Initialize all components
   */
  async initializeComponents() {
    try {
      console.log('🏢 Inicializando sistema de empresas...');
      
      // Setup API client
      await this.setupApiClient();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadInitialData();
      
      console.log('✅ Sistema de empresas inicializado correctamente');
      
    } catch (error) {
      console.error('💥 Error al inicializar sistema de empresas:', error);
      this.showFallbackError();
    }
  }

  /**
   * Setup API client
   */
  async setupApiClient() {
    try {
      // Use global API client if available
      if (window.apiClient) {
        this.apiClient = window.apiClient;
        console.log('✅ API client global encontrado');
        return;
      }
      
      // Check if we have the endpoint test client
      if (typeof EndpointTestClient !== 'undefined') {
        this.apiClient = new EndpointTestClient('/proxy');
        console.log('✅ API client creado usando EndpointTestClient');
        return;
      }
      
      // Fallback: Create basic API client
      this.apiClient = this.createBasicApiClient();
      console.log('⚠️ Usando API client básico como fallback');
      
    } catch (error) {
      console.error('❌ Error configurando API client:', error);
      throw error;
    }
  }

  /**
   * Create basic API client
   */
  createBasicApiClient() {
    return {
      get_empresas: () => fetch('/proxy/api/empresas/'),
      get_empresas_dashboard: () => fetch('/proxy/api/empresas/dashboard/all'),
      get_empresa: (id) => fetch(`/proxy/api/empresas/${id}`),
      toggle_empresa_status: (id, activa) => 
        fetch(`/proxy/api/empresas/${id}/toggle-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activa })
        }),
      create_empresa: (data) =>
        fetch('/proxy/api/empresas/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }),
      update_empresa: (id, data) =>
        fetch(`/proxy/api/empresas/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }),
      delete_empresa: (id) =>
        fetch(`/proxy/api/empresas/${id}`, {
          method: 'DELETE'
        }),
      get_tipos_empresa: () => fetch('/proxy/api/tipos_empresa')
    };
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('empresasSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilters.search = e.target.value.toLowerCase();
        this.applyFilters();
      });
    }

    // Type filter
    const typeFilter = document.getElementById('empresasTipoFilter');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.currentFilters.tipo = e.target.value;
        this.applyFilters();
      });
    }

    // Status filter
    const statusFilter = document.getElementById('empresasStatusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.currentFilters.status = e.target.value;
        this.applyFilters();
      });
    }

    // Include inactive filter
    const includeInactiveFilter = document.getElementById('includeInactiveFilter');
    if (includeInactiveFilter) {
      includeInactiveFilter.addEventListener('change', (e) => {
        this.currentFilters.activa = e.target.value;
        this.applyFilters();
      });
    }

    // Create button
    const createBtn = document.getElementById('createEmpresaBtn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.openCreateModal());
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshEmpresasBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadEmpresas());
    }

    // View toggle buttons
    const gridViewBtn = document.getElementById('gridViewBtn');
    const tableViewBtn = document.getElementById('tableViewBtn');
    
    if (gridViewBtn) {
      gridViewBtn.addEventListener('click', () => this.switchToGridView());
    }
    
    if (tableViewBtn) {
      tableViewBtn.addEventListener('click', () => this.switchToTableView());
    }

    console.log('🎯 Event listeners configurados');
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    await Promise.all([
      this.loadEmpresas(),
      this.loadTiposEmpresa()
    ]);
  }

  /**
   * Load empresas from backend
   */
  async loadEmpresas() {
    if (this.isLoading) {
      console.log('⏳ Ya hay una carga en progreso...');
      return;
    }

    try {
      this.isLoading = true;
      console.log('🔄 Cargando empresas...');
      
      this.showLoadingState();

      // Load empresas from API
      let response;
      try {
        // Try dashboard endpoint first (if available)
        if (typeof this.apiClient.get_empresas_dashboard === 'function') {
          response = await this.apiClient.get_empresas_dashboard();
        } else {
          throw new Error('Dashboard endpoint not available');
        }
      } catch (dashboardError) {
        console.log('⚠️ Dashboard endpoint failed, using regular endpoint...');
        // Fallback to regular empresas endpoint
        response = await this.apiClient.get_empresas();
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Respuesta de empresas:', data);

      if (data.success && Array.isArray(data.data)) {
        this.empresasAll = data.data;
        this.empresas = data.data; // Start with all, filtering happens in UI
        
        console.log(`✅ ${this.empresas.length} empresas cargadas`);
        
        this.updateStats();
        this.renderEmpresas();
        this.hideLoadingState();
        
      } else {
        console.warn('⚠️ Respuesta inesperada del servidor:', data);
        this.showError('Formato de respuesta inesperado del servidor');
      }

    } catch (error) {
      console.error('💥 Error cargando empresas:', error);
      this.showError('Error al cargar empresas: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load tipos de empresa for filtering
   */
  async loadTiposEmpresa() {
    try {
      console.log('🔄 Cargando tipos de empresa...');
      
      const response = await this.apiClient.get_tipos_empresa();
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          this.tiposEmpresa = data.data;
          this.populateTipoDropdown();
          console.log(`✅ ${this.tiposEmpresa.length} tipos de empresa cargados`);
        }
      }
    } catch (error) {
      console.error('⚠️ Error cargando tipos de empresa:', error);
    }
  }

  /**
   * Populate tipo dropdown
   */
  populateTipoDropdown() {
    const dropdown = document.getElementById('empresasTipoFilter');
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">Todos los tipos</option>';
    
    this.tiposEmpresa.forEach(tipo => {
      const option = document.createElement('option');
      option.value = tipo._id;
      option.textContent = tipo.nombre;
      dropdown.appendChild(option);
    });
  }

  /**
   * Apply filters to empresas list
   */
  applyFilters() {
    const filtered = this.empresasAll.filter(empresa => {
      // Search filter
      if (this.currentFilters.search) {
        const searchText = this.currentFilters.search;
        const matchesSearch = 
          (empresa.nombre || '').toLowerCase().includes(searchText) ||
          (empresa.ubicacion || '').toLowerCase().includes(searchText) ||
          (empresa.email || '').toLowerCase().includes(searchText) ||
          (empresa.descripcion || '').toLowerCase().includes(searchText);
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (this.currentFilters.tipo) {
        if (empresa.tipo_empresa_id !== this.currentFilters.tipo) {
          return false;
        }
      }

      // Active status filter
      if (this.currentFilters.activa !== 'all') {
        const isActive = empresa.activa !== false;
        if (this.currentFilters.activa === 'active' && !isActive) {
          return false;
        }
        if (this.currentFilters.activa === 'inactive' && isActive) {
          return false;
        }
      }

      return true;
    });

    this.empresas = filtered;
    this.renderEmpresas();
    this.updateStats();
    
    console.log(`🔍 Filtros aplicados: ${filtered.length} de ${this.empresasAll.length} empresas`);
  }

  /**
   * Update statistics
   */
  updateStats() {
    const stats = {
      total: this.empresasAll.length,
      active: this.empresasAll.filter(e => e.activa !== false).length,
      inactive: this.empresasAll.filter(e => e.activa === false).length,
      filtered: this.empresas.length
    };

    // Update count in header
    const countElement = document.getElementById('empresasCount');
    if (countElement) {
      countElement.textContent = `${stats.filtered} empresas mostradas de ${stats.total} totales`;
    }

    // Update stats cards if they exist
    this.updateStatsCards(stats);

    console.log('📊 Estadísticas actualizadas:', stats);
  }

  /**
   * Update header badge
   */
  updateHeaderBadge(count) {
    const badge = document.getElementById('empresasCountBadge');
    if (badge) {
      badge.textContent = `${count} empresas registradas`;
    }
  }

  /**
   * Update stats cards
   */
  updateStatsCards(stats) {
    // Calculate additional stats
    const locations = new Set(this.empresasAll.map(e => e.ubicacion).filter(Boolean));
    const thisMonth = new Date();
    thisMonth.setDate(1); // First day of current month
    const recentEmpresas = this.empresasAll.filter(e => {
      if (!e.fecha_creacion) return false;
      const createdDate = new Date(e.fecha_creacion);
      return createdDate >= thisMonth;
    });

    const elements = {
      'totalEmpresasCount': stats.total,
      'activeEmpresasCount': stats.active,
      'locationsCount': locations.size,
      'recentEmpresasCount': recentEmpresas.length
    };

    Object.entries(elements).forEach(([elementId, value]) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = value;
      }
    });

    // Update header badge
    this.updateHeaderBadge(stats.total);
  }

  /**
   * Render empresas list
   */
  renderEmpresas() {
    const container = document.getElementById('empresasGrid') || 
                      document.getElementById('empresasList') || 
                      document.getElementById('empresasContainer');
    
    if (!container) {
      console.warn('⚠️ Contenedor de empresas no encontrado');
      return;
    }

    // Clear container
    container.innerHTML = '';

    if (this.empresas.length === 0) {
      this.showEmptyState(container);
      return;
    }

    // Determine if using grid or list view
    const isGridView = container.id === 'empresasGrid' || 
                       container.classList.contains('grid');

    if (isGridView) {
      this.renderEmpresasGrid(container);
    } else {
      this.renderEmpresasList(container);
    }

    console.log(`🎨 Renderizadas ${this.empresas.length} empresas`);
  }

  /**
   * Render empresas in grid format
   */
  renderEmpresasGrid(container) {
    this.empresas.forEach(empresa => {
      const card = this.createEmpresaCard(empresa);
      container.appendChild(card);
    });
  }

  /**
   * Render empresas in list format
   */
  renderEmpresasList(container) {
    this.empresas.forEach(empresa => {
      const item = this.createEmpresaListItem(empresa);
      container.appendChild(item);
    });
  }

  /**
   * Create empresa card element
   */
  createEmpresaCard(empresa) {
    const card = document.createElement('div');
    card.className = 'ios-hardware-card empresa-item';
    card.dataset.empresaId = empresa._id;
    card.dataset.status = empresa.activa !== false ? 'true' : 'false';
    card.dataset.nombre = empresa.nombre || '';
    card.dataset.ubicacion = empresa.ubicacion || '';

    const iniciales = this.getIniciales(empresa.nombre);
    const statusClass = empresa.activa !== false ? 'ios-status-available' : 'ios-status-discontinued';
    const statusText = empresa.activa !== false ? '✅ Activa' : '⚫ Inactiva';
    const fechaCreacion = this.formatDate(empresa.fecha_creacion);
    const sedesText = empresa.sedes && empresa.sedes.length > 0 ? empresa.sedes.join(', ') : 'Principal';

    card.innerHTML = `
      <div class="ios-card-header">
        <div class="ios-card-icon">
          <i class="fas fa-building"></i>
        </div>
        <span class="ios-status-badge ${statusClass} text-xs font-semibold">
          ${statusText}
        </span>
      </div>
      
      <h3 class="ios-card-title text-xl font-semibold text-gray-900 dark:text-white">${empresa.nombre || 'Sin nombre'}</h3>
      <p class="ios-card-subtitle text-sm text-gray-600 dark:text-gray-400 leading-relaxed">${empresa.descripcion || empresa.ubicacion || 'Sin descripción'}</p>
      
      <!-- Sección específica para empresas -->
      <div class="ios-card-info">
        <!-- Email - FILA COMPLETA -->
        <div class="ios-info-item full-width">
          <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
            <i class="fas fa-envelope text-blue-400 mr-1"></i>
            Email de contacto
          </span>
          <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${empresa.email || 'N/A'}</span>
        </div>
        
        <!-- Ubicación y Sedes - MISMA FILA -->
        <div class="ios-info-item">
          <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
            <i class="fas fa-map-marker-alt text-green-400 mr-1"></i>
            Ubicación
          </span>
          <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${empresa.ubicacion || 'N/A'}</span>
        </div>
        <div class="ios-info-item">
          <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
            <i class="fas fa-building text-purple-400 mr-1"></i>
            Sedes
          </span>
          <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${empresa.sedes?.length || 1}</span>
        </div>
        
        <!-- Fecha de creación - FILA COMPLETA -->
        <div class="ios-info-item full-width">
          <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
            <i class="fas fa-calendar text-orange-400 mr-1"></i>
            Fecha de registro
          </span>
          <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${fechaCreacion}</span>
        </div>
      </div>
      
      <!-- Sedes destacadas (si existen) -->
      ${empresa.sedes && empresa.sedes.length > 0 ? `
        <div class="mt-3 mb-3">
          <div class="text-xs font-semibold text-purple-800 dark:text-purple-400 mb-2">
            <i class="fas fa-building mr-1 text-purple-700 dark:text-purple-400"></i>
            Sedes principales:
          </div>
          <div class="flex flex-wrap gap-1">
            ${empresa.sedes.slice(0, 3).map(sede => 
              `<span class="inline-block px-2 py-1 bg-purple-700 dark:bg-purple-500/20 text-white dark:text-purple-300 text-xs font-semibold rounded-full border border-purple-800 dark:border-purple-500/30">
                ${sede}
              </span>`
            ).join('')}
            ${empresa.sedes.length > 3 ? 
              `<span class="inline-block px-2 py-1 bg-gray-700 dark:bg-gray-500/20 text-white dark:text-gray-300 text-xs font-semibold rounded-full border border-gray-800 dark:border-gray-500/30">
                +${empresa.sedes.length - 3} más
              </span>`
            : ''}
          </div>
        </div>
      ` : ''}
      
      <!-- Botones de acción específicos para empresas -->
      <div class="ios-card-actions">
        <button class="ios-card-btn" onclick="empresasMain.viewEmpresa('${empresa._id}')" title="Ver detalles completos">
          <i class="fas fa-eye"></i>
        </button>
        <button class="ios-card-btn ios-card-btn-primary" onclick="empresasMain.editEmpresa('${empresa._id}')" title="Editar empresa">
          <i class="fas fa-edit"></i>
        </button>
        <button class="ios-card-btn ${empresa.activa !== false ? 'ios-card-btn-warning' : 'ios-card-btn-success'}" 
                onclick="empresasMain.toggleEmpresaStatus('${empresa._id}', ${empresa.activa === false})" 
                title="${empresa.activa !== false ? 'Desactivar empresa' : 'Activar empresa'}">
          <i class="fas ${empresa.activa !== false ? 'fa-power-off' : 'fa-play'}"></i>
        </button>
      </div>
      
      <!-- iOS Card Shimmer Effect -->
      <div class="ios-card-shimmer"></div>
    `;

    return card;
  }

  /**
   * Create empresa list item element
   */
  createEmpresaListItem(empresa) {
    const item = document.createElement('div');
    item.className = 'empresa-list-item';
    item.dataset.empresaId = empresa._id;
    item.dataset.activa = empresa.activa !== false;

    const iniciales = this.getIniciales(empresa.nombre);
    const statusClass = empresa.activa !== false ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    const statusText = empresa.activa !== false ? 'Activa' : 'Inactiva';
    const fechaCreacion = this.formatDate(empresa.fecha_creacion);

    item.innerHTML = `
      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-lg">${iniciales}</span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-black dark:text-white">${empresa.nombre || 'Sin nombre'}</h3>
            <div class="flex items-center space-x-2 mt-1">
              <p class="text-sm text-gray-500 dark:text-gray-400">${empresa.ubicacion || 'Sin ubicación'}</p>
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500">Registrada: ${fechaCreacion}</p>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <div class="text-right">
            <p class="text-sm font-medium text-black dark:text-white">${empresa.email || 'Sin email'}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Contacto</p>
          </div>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            ${statusText}
          </span>
          <div class="flex space-x-2">
            <button class="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" onclick="empresasMain.viewEmpresa('${empresa._id}')" title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            <button class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" onclick="empresasMain.editEmpresa('${empresa._id}')" title="Editar empresa">
              <i class="fas fa-edit"></i>
            </button>
            <button class="p-2 text-gray-400 hover:text-${empresa.activa !== false ? 'orange' : 'green'}-600" onclick="empresasMain.toggleEmpresaStatus('${empresa._id}', ${empresa.activa === false})" title="${empresa.activa !== false ? 'Desactivar' : 'Activar'}">
              <i class="fas fa-power-off"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    return item;
  }

  /**
   * Show empty state
   */
  showEmptyState(container) {
    const hasFilters = this.currentFilters.search || 
                       this.currentFilters.tipo || 
                       this.currentFilters.activa !== 'all';

    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'text-center py-12';
    
    if (hasFilters) {
      emptyDiv.innerHTML = `
        <div class="text-center">
          <i class="fas fa-search text-4xl mb-4 text-gray-400"></i>
          <h2 class="text-2xl font-bold text-white mb-2">No se encontraron empresas</h2>
          <p class="text-sm text-gray-400">Prueba ajustando los criterios de búsqueda.</p>
          <button onclick="empresasMain.clearFilters()" class="mt-4 ios-action-btn">
            <i class="fas fa-filter-circle-xmark"></i>
            Limpiar Filtros
          </button>
        </div>
      `;
    } else {
      emptyDiv.innerHTML = `
        <div class="text-center">
          <i class="fas fa-building text-4xl mb-4 text-gray-400"></i>
          <h2 class="text-2xl font-bold text-white mb-2">No hay empresas registradas</h2>
          <p class="text-sm text-gray-400">Crea la primera empresa para comenzar.</p>
          <button onclick="empresasMain.openCreateModal()" class="mt-4 ios-action-btn">
            <i class="fas fa-plus"></i>
            Crear Primera Empresa
          </button>
        </div>
      `;
    }

    container.appendChild(emptyDiv);
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const containers = [
      document.getElementById('empresasGrid'),
      document.getElementById('empresasList'),
      document.getElementById('empresasContainer')
    ].filter(Boolean);

    containers.forEach(container => {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p class="text-gray-500 dark:text-gray-400 mt-4">Cargando empresas...</p>
        </div>
      `;
    });
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    // Loading state is replaced by content in renderEmpresas()
  }

  /**
   * Show error state
   */
  showError(message) {
    const containers = [
      document.getElementById('empresasGrid'),
      document.getElementById('empresasList'), 
      document.getElementById('empresasContainer')
    ].filter(Boolean);

    containers.forEach(container => {
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <h3 class="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p class="text-gray-500">${message}</p>
          <button onclick="empresasMain.loadEmpresas()" class="mt-4 ios-action-btn">
            <i class="fas fa-refresh"></i>
            Reintentar
          </button>
        </div>
      `;
    });
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.currentFilters = {
      search: '',
      tipo: '',
      status: 'all',
      activa: 'all'
    };

    // Reset form elements
    const searchInput = document.getElementById('empresasSearchInput');
    const typeFilter = document.getElementById('empresasTipoFilter');
    const statusFilter = document.getElementById('empresasStatusFilter');
    const includeInactiveFilter = document.getElementById('includeInactiveFilter');

    if (searchInput) searchInput.value = '';
    if (typeFilter) typeFilter.value = '';
    if (statusFilter) statusFilter.value = 'all';
    if (includeInactiveFilter) includeInactiveFilter.value = 'all';

    this.applyFilters();
  }

  /**
   * Switch to grid view
   */
  switchToGridView() {
    const gridBtn = document.getElementById('gridViewBtn');
    const tableBtn = document.getElementById('tableViewBtn');
    
    if (gridBtn) gridBtn.classList.add('active');
    if (tableBtn) tableBtn.classList.remove('active');
    
    // TODO: Implement view switching logic
    console.log('📱 Cambiando a vista de tarjetas');
  }

  /**
   * Switch to table view
   */
  switchToTableView() {
    const gridBtn = document.getElementById('gridViewBtn');
    const tableBtn = document.getElementById('tableViewBtn');
    
    if (gridBtn) gridBtn.classList.remove('active');
    if (tableBtn) tableBtn.classList.add('active');
    
    // TODO: Implement view switching logic
    console.log('📊 Cambiando a vista de tabla');
  }

  /**
   * Open create empresa modal
   */
  openCreateModal() {
    if (window.empresasModals) {
      window.empresasModals.openCreateModal();
    } else {
      console.warn('⚠️ Empresas modals module not available');
      this.showEnhancedNotification('Función de creación no disponible', 'error');
    }
  }

  /**
   * Edit empresa
   */
  editEmpresa(id) {
    if (window.empresasModals) {
      window.empresasModals.openEditModal(id);
    } else {
      console.warn('⚠️ Empresas modals module not available');
      this.showEnhancedNotification('Función de edición no disponible', 'error');
    }
  }

  /**
   * View empresa details
   */
  viewEmpresa(id) {
    if (window.empresasModals) {
      window.empresasModals.openViewModal(id);
    } else {
      console.warn('⚠️ Empresas modals module not available');
      this.showEnhancedNotification('Función de visualización no disponible', 'error');
    }
  }

  /**
   * Toggle empresa status
   */
  toggleEmpresaStatus(id, activa) {
    if (window.empresasModals) {
      window.empresasModals.showToggleModal(id, activa);
    } else {
      console.warn('⚠️ Empresas modals module not available');
      this.showEnhancedNotification('Función de cambio de estado no disponible', 'error');
    }
  }

  /**
   * Export empresas to CSV
   */
  exportEmpresas() {
    try {
      const csv = this.generateCSV();
      this.downloadCSV(csv, 'empresas.csv');
      this.showEnhancedNotification('Archivo CSV exportado exitosamente', 'success');
    } catch (error) {
      console.error('💥 Error al exportar empresas:', error);
      this.showEnhancedNotification('Error al exportar empresas', 'error');
    }
  }

  /**
   * Generate CSV content
   */
  generateCSV() {
    const headers = ['Nombre', 'Email', 'Ubicación', 'Estado', 'Fecha Creación', 'Sedes'];
    const rows = this.empresasAll.map(empresa => [
      empresa.nombre || '',
      empresa.email || '',
      empresa.ubicacion || '',
      empresa.activa !== false ? 'Activa' : 'Inactiva',
      this.formatDate(empresa.fecha_creacion),
      empresa.sedes ? empresa.sedes.join('; ') : 'Principal'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Download CSV file
   */
  downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Toggle filter visibility
   */
  toggleFilter() {
    // For now, just show a simple interface
    const filterState = this.currentFilters.activa !== 'all';
    
    if (filterState) {
      // Clear all filters
      this.clearFilters();
      this.showEnhancedNotification('Filtros removidos - mostrando todas las empresas', 'info');
    } else {
      // Apply active filter
      this.currentFilters.activa = 'active';
      this.applyFilters();
      this.showEnhancedNotification('Mostrando solo empresas activas', 'info');
    }
  }

  /**
   * Delete empresa
   */
  deleteEmpresa(id) {
    // For now, just show a confirmation
    if (confirm('¿Estás seguro de que quieres eliminar esta empresa?')) {
      console.log('🗑️ Eliminar empresa:', id);
      this.showEnhancedNotification('Función de eliminación en desarrollo', 'info');
    }
  }

  /**
   * Utility functions
   */
  getIniciales(nombre) {
    if (!nombre) return 'XX';
    const words = nombre.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    } catch (e) {
      return 'N/A';
    }
  }

  /**
   * Enhanced notification system
   */
  showEnhancedNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.enhanced-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `enhanced-notification fixed top-4 right-4 z-50 max-w-sm w-full`;
    
    let iconClass, bgClass, borderClass;
    if (type === 'error') {
      iconClass = 'fas fa-exclamation-circle';
      bgClass = 'bg-red-500';
      borderClass = 'border-red-600';
    } else {
      iconClass = 'fas fa-check-circle';
      bgClass = 'bg-green-500';
      borderClass = 'border-green-600';
    }
    
    notification.innerHTML = `
      <div class="${bgClass} ${borderClass} border-l-4 text-white p-4 rounded-lg shadow-xl backdrop-blur-sm">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="${iconClass} text-xl"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">${message}</p>
          </div>
          <div class="ml-auto pl-3">
            <button onclick="this.closest('.enhanced-notification').remove()" class="text-white hover:text-gray-200 transition-colors">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }

  /**
   * Show fallback error
   */
  showFallbackError() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-xl z-50';
    errorDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-triangle mr-3"></i>
        <span>Error al inicializar el sistema de empresas</span>
      </div>
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

// Initialize empresas system
const empresasMain = new EmpresasMain();

// Export for debugging
window.empresasMain = empresasMain;

// Backward compatibility functions
window.toggleEmpresaStatus = (id, activa) => {
  if (window.empresasModals && window.empresasModals.showToggleModal) {
    window.empresasModals.showToggleModal(id, activa);
  } else {
    console.warn('Toggle modal not available');
  }
};

window.loadEmpresas = () => empresasMain.loadEmpresas();
window.editEmpresa = (id) => empresasMain.editEmpresa(id);
window.viewEmpresa = (id) => empresasMain.viewEmpresa(id);
window.clearFilters = () => empresasMain.clearFilters();

console.log('🏢 Empresas main module loaded');
