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
      location: '',
      status: '',
      activa: 'active'
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
    // Search input - UPDATED FOR NEW FILTER
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilters.search = e.target.value.toLowerCase();
        this.applyFilters();
      });
    }

    // Location filter - NEW
    const locationFilter = document.getElementById('locationFilter');
    if (locationFilter) {
      locationFilter.addEventListener('change', (e) => {
        this.currentFilters.location = e.target.value;
        this.applyFilters();
      });
    }

    // Status filter - UPDATED
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.currentFilters.status = e.target.value;
        this.applyFilters();
      });
    }

    // Include inactive filter - SAME
    const includeInactiveFilter = document.getElementById('includeInactiveFilter');
    if (includeInactiveFilter) {
      includeInactiveFilter.addEventListener('change', (e) => {
        this.currentFilters.activa = e.target.value;
        this.updateStatusFilterState();
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
    console.log('📍 DEBUG: Iniciando loadInitialData()');
    
    // Set initial filter states before loading data
    this.updateStatusFilterState();
    
    // PRIMERO: Cargar datos del backend
    await this.loadEmpresas();
    
    // SEGUNDO: Cargar tipos de empresa en paralelo
    await this.loadTiposEmpresa();
    
    // TERCERO: Populate location filter after loading empresas
    this.populateLocationFilter();
    
    console.log('📍 DEBUG: loadInitialData() terminado');
  }

  /**
   * Load empresas from backend
   */
  async loadEmpresas() {
    console.log('📍 DEBUG: Iniciando loadEmpresas()');
    
    if (this.isLoading) {
      console.log('⏳ Ya hay una carga en progreso...');
      return;
    }

    try {
      this.isLoading = true;
      console.log('🔄 Cargando empresas desde backend...');
      
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
        
        console.log(`✅ ${data.data.length} empresas cargadas desde backend`);
        
        // Renderizar empresas (igual que hardware)
        this.renderEmpresas();
        
        // Actualizar estadísticas inmediatamente con todos los datos (igual que hardware)
        this.updateEmpresaStats(data);
        
        // DESPUÉS aplicar filtros automáticos
        this.applyFilters();
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
   * Populate location filter - NEW FOR HARDWARE-STYLE FILTERS
   */
  populateLocationFilter() {
    const dropdown = document.getElementById('locationFilter');
    if (!dropdown || !this.empresasAll) return;

    // Get unique locations
    const locations = [...new Set(
      this.empresasAll
        .map(empresa => empresa.ubicacion)
        .filter(Boolean)
        .sort()
    )];

    dropdown.innerHTML = '<option value="">Todas las ubicaciones</option>';
    
    locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location;
      option.textContent = location;
      dropdown.appendChild(option);
    });

    console.log(`✅ ${locations.length} ubicaciones cargadas en filtro`);
  }


  /**
   * Update statistics
   */
  updateEmpresaStats(data = null) {
    console.log('📊 DEBUG updateEmpresaStats() en empresas:');
    console.log('  - data recibida:', data);
    
    // Usar datos del backend si están disponibles
    if (data && data.success && data.data && Array.isArray(data.data)) {
      const empresas = data.data;
      const totalCount = data.count || empresas.length;
      
      // Calcular activas/inactivas directamente desde el JSON
      const activasCount = empresas.filter(e => e.activa === true).length;
      const inactivasCount = empresas.filter(e => e.activa === false).length;
      
      // Calcular ubicaciones únicas
      const ubicaciones = new Set(empresas.map(e => e.ubicacion).filter(Boolean));
      
      // Calcular empresas creadas este mes
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const esteMesCount = empresas.filter(e => {
        if (!e.fecha_creacion) return false;
        try {
          const fechaCreacion = new Date(e.fecha_creacion);
          return fechaCreacion.getMonth() === thisMonth && fechaCreacion.getFullYear() === thisYear;
        } catch (err) {
          return false;
        }
      }).length;
      
      console.log('📊 Estadísticas calculadas desde backend:', {
        total: totalCount,
        activas: activasCount,
        inactivas: inactivasCount,
        ubicaciones: ubicaciones.size,
        esteMes: esteMesCount
      });
      
      // Actualizar directamente los elementos del DOM
      const elementos = {
        'empresasTotalCount': totalCount,
        'empresasActiveCount': activasCount,
        'empresasLocationsCount': ubicaciones.size,
        'empresasRecentCount': esteMesCount
      };
      
      console.log('🎨 Actualizando elementos del DOM:', elementos);
      
      Object.entries(elementos).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        console.log(`  - Buscando elemento ${elementId}:`, element ? 'ENCONTRADO' : 'NO ENCONTRADO');
        if (element) {
          element.textContent = value;
          console.log(`    ✓ Actualizado ${elementId} = ${value}`);
        } else {
          console.warn(`    ⚠️ Elemento ${elementId} no encontrado en el DOM`);
        }
      });
      
      return; // Salir temprano si usamos datos del backend
    }
    
    // Fallback: usar this.empresasAll si no hay data del backend
    console.log('⚠️ Usando fallback con this.empresasAll');
    console.log('  - this.empresasAll:', this.empresasAll);
    console.log('  - this.empresasAll.length:', this.empresasAll ? this.empresasAll.length : 'null');
    console.log('  - this.empresas.length:', this.empresas ? this.empresas.length : 'null');
    
    const stats = {
      total: this.empresasAll ? this.empresasAll.length : 0,
      active: this.empresasAll ? this.empresasAll.filter(e => e.activa === true).length : 0,
      inactive: this.empresasAll ? this.empresasAll.filter(e => e.activa === false).length : 0,
      filtered: this.empresas ? this.empresas.length : 0
    };
    
    console.log('📊 Estadísticas calculadas:', stats);

    // Update count in header
    const countElement = document.getElementById('empresasCount');
    if (countElement) {
      countElement.textContent = `${stats.filtered} empresas mostradas de ${stats.total} totales`;
    }

    // Update stats cards if they exist
    console.log('📊 Llamando updateStatsCards con:', stats);
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
    console.log('🎨 DEBUG updateStatsCards() en empresas:');
    console.log('  - stats recibidas:', stats);
    
    // Imprimir TODOS los elementos disponibles en el DOM
    console.log('🔍 Buscando elementos de estadísticas en el DOM:');
    const todosLosElementos = [
      'empresasTotalCount',
      'empresasActiveCount',
      'empresasLocationsCount',
      'empresasRecentCount'
    ];
    
    todosLosElementos.forEach(id => {
      const elem = document.getElementById(id);
      console.log(`  - ${id}:`, elem ? `ENCONTRADO (texto actual: "${elem.textContent}")` : 'NO ENCONTRADO');
    });
    
    // Calculate additional stats
    const locations = new Set(this.empresasAll ? this.empresasAll.map(e => e.ubicacion).filter(Boolean) : []);
    const thisMonth = new Date();
    thisMonth.setDate(1); // First day of current month
    const recentEmpresas = this.empresasAll ? this.empresasAll.filter(e => {
      if (!e.fecha_creacion) return false;
      const createdDate = new Date(e.fecha_creacion);
      return createdDate >= thisMonth;
    }) : [];

    const elements = {
      'empresasTotalCount': stats.total,
      'empresasActiveCount': stats.active,
      'empresasLocationsCount': locations.size,
      'empresasRecentCount': recentEmpresas.length
    };
    
    console.log('🎨 Elementos a actualizar:', elements);

    Object.entries(elements).forEach(([elementId, value]) => {
      const element = document.getElementById(elementId);
      console.log(`🔍 Procesando elemento ${elementId}:`);
      console.log(`  - Elemento:`, element);
      console.log(`  - Valor a asignar:`, value);
      console.log(`  - Texto actual:`, element ? element.textContent : 'N/A');
      
      if (element) {
        const valorAnterior = element.textContent;
        element.textContent = value;
        
        // Forzar actualización visual
        element.style.display = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.display = '';
        
        // Verificar que realmente se actualizó
        const valorDespues = element.textContent;
        console.log(`    ✓ ACTUALIZADO ${elementId}: "${valorAnterior}" -> "${value}"`);
        console.log(`    ✓ VERIFICADO ${elementId}: contenido actual = "${valorDespues}"`);
        
        // Agregar clase para destacar el cambio
        element.classList.add('stat-updated');
        setTimeout(() => element.classList.remove('stat-updated'), 1000);
      } else {
        console.error(`    ❌ ERROR: Elemento ${elementId} NO ENCONTRADO en el DOM`);
      }
    });
    
    // Verificar que se actualizaron los elementos
    console.log('🔍 Verificando elementos actualizados:');
    Object.keys(elements).forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) {
        console.log(`  - ${elementId}: "${element.textContent}"`);
        console.log(`    - Visible: ${element.offsetWidth > 0 && element.offsetHeight > 0}`);
        console.log(`    - CSS Display: ${getComputedStyle(element).display}`);
        console.log(`    - CSS Visibility: ${getComputedStyle(element).visibility}`);
        console.log(`    - CSS Opacity: ${getComputedStyle(element).opacity}`);
      }
    });
    
    // Forzar repintado de toda la sección de estadísticas
    const statsGrid = document.getElementById('empresasStatsGrid');
    if (statsGrid) {
      console.log('🔄 Forzando repintado de statsGrid...');
      statsGrid.style.display = 'none';
      statsGrid.offsetHeight; // Trigger reflow
      statsGrid.style.display = 'grid';
      console.log('🔄 Repintado forzado completado');
    }

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
                onclick="empresasMain.toggleEmpresaStatus('${empresa._id}', ${empresa.activa !== false}, '${empresa.nombre}')" 
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
            <button class="p-2 text-gray-400 hover:text-${empresa.activa !== false ? 'orange' : 'green'}-600" onclick="empresasMain.toggleEmpresaStatus('${empresa._id}', ${empresa.activa !== false}, '${empresa.nombre}')" title="${empresa.activa !== false ? 'Desactivar' : 'Activar'}">
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
   * Apply filters to empresas list
   */
  applyFilters() {
    console.log('🔍 DEBUG: Iniciando applyFilters() en empresas');
    console.log('  - this.empresasAll:', this.empresasAll);
    console.log('  - this.empresasAll.length:', this.empresasAll ? this.empresasAll.length : 'null');
    console.log('  - this.currentFilters:', this.currentFilters);
    
    if (!this.empresasAll || this.empresasAll.length === 0) {
      console.log('📋 No hay empresas para filtrar');
      this.empresas = [];
      this.renderEmpresas();
      this.updateEmpresaStats();
      return;
    }

    let filteredEmpresas = [...this.empresasAll];

    // 1. FILTRO PRINCIPAL: Include inactive filter (jerarquía más alta)
    if (this.currentFilters.activa === 'active') {
      filteredEmpresas = filteredEmpresas.filter(empresa => {
        // Usar 'activo' si existe, sino usar 'activa' como fallback
        const isActive = empresa.hasOwnProperty('activo') 
          ? (empresa.activo === true || empresa.activo === 1 || empresa.activo === 'true')
          : (empresa.activa !== false);
        return isActive;
      });
    }
    // Si es 'all', se incluyen todas (activas e inactivas)

    // 2. FILTRO SECUNDARIO: Status filter específico
    if (this.currentFilters.status) {
      filteredEmpresas = filteredEmpresas.filter(empresa => {
        const isActive = empresa.hasOwnProperty('activo') 
          ? (empresa.activo === true || empresa.activo === 1 || empresa.activo === 'true')
          : (empresa.activa !== false);
        
        if (this.currentFilters.status === 'active') {
          return isActive;
        } else if (this.currentFilters.status === 'inactive') {
          return !isActive;
        }
        return true;
      });
    }

    // 3. FILTRO DE UBICACIÓN
    if (this.currentFilters.location) {
      filteredEmpresas = filteredEmpresas.filter(empresa => 
        (empresa.ubicacion || '').toLowerCase().includes(this.currentFilters.location.toLowerCase())
      );
    }

    // 4. FILTRO DE BÚSQUEDA: Search filter (última prioridad)
    if (this.currentFilters.search) {
      const searchTerm = this.currentFilters.search.toLowerCase();
      filteredEmpresas = filteredEmpresas.filter(empresa => 
        (empresa.nombre || '').toLowerCase().includes(searchTerm) ||
        (empresa.email || '').toLowerCase().includes(searchTerm) ||
        (empresa.ubicacion || '').toLowerCase().includes(searchTerm) ||
        (empresa.descripcion || '').toLowerCase().includes(searchTerm)
      );
    }

    this.empresas = filteredEmpresas;
    console.log(`🔍 RESULTADO FINAL: ${filteredEmpresas.length} empresas filtradas de ${this.empresasAll.length} totales`);
    console.log('🔍 Empresas finales:', filteredEmpresas.map(e => e.nombre));
    
    this.renderEmpresas();
    this.updateEmpresaStats();

    console.log(`🔍 Filtros aplicados: ${filteredEmpresas.length}/${this.empresasAll.length} empresas`);
    console.log('🔍 Filtros actuales:', this.currentFilters);
  }

  /**
   * Update status filter state based on includeInactive filter
   */
  updateStatusFilterState() {
    const statusFilter = document.getElementById('statusFilter');
    if (!statusFilter) return;
    
    if (this.currentFilters.activa === 'active') {
      // Si está en "Solo Activas", deshabilitar y resetear el filtro de estado
      statusFilter.disabled = true;
      statusFilter.value = '';
      this.currentFilters.status = '';
      statusFilter.style.opacity = '0.5';
      statusFilter.style.cursor = 'not-allowed';
    } else {
      // Si está en "Todas", habilitar el filtro de estado
      statusFilter.disabled = false;
      statusFilter.style.opacity = '1';
      statusFilter.style.cursor = 'pointer';
    }
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.currentFilters = {
      search: '',
      location: '',
      status: '',
      activa: 'active'
    };

    // Reset form elements
    const searchInput = document.getElementById('searchInput');
    const locationFilter = document.getElementById('locationFilter');
    const statusFilter = document.getElementById('statusFilter');
    const includeInactiveFilter = document.getElementById('includeInactiveFilter');

    if (searchInput) searchInput.value = '';
    if (locationFilter) locationFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (includeInactiveFilter) includeInactiveFilter.value = 'active';

    this.updateStatusFilterState();
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
  toggleEmpresaStatus(id, currentStatus, empresaName) {
    if (window.empresasModals) {
      window.empresasModals.showToggleModal(id, currentStatus, empresaName);
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
    const rows = this.empresasAll.map(empresa => {
      // Determinar estado usando ambos campos posibles
      const isActive = empresa.hasOwnProperty('activo') 
        ? (empresa.activo === true || empresa.activo === 1 || empresa.activo === 'true')
        : (empresa.activa !== false);
      
      return [
        empresa.nombre || '',
        empresa.email || '',
        empresa.ubicacion || '',
        isActive ? 'Activa' : 'Inactiva',
        this.formatDate(empresa.fecha_creacion),
        empresa.sedes ? empresa.sedes.join('; ') : 'Principal'
      ];
    });

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
    notification.className = `enhanced-notification fixed top-4 right-4 max-w-sm w-full`;
    notification.style.zIndex = '999999'; // Muy alto para estar siempre adelante
    
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
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-xl';
    errorDiv.style.zIndex = '999999'; // Muy alto para estar siempre adelante
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
window.toggleEmpresaStatus = (id, currentStatus, empresaName) => {
  if (window.empresasModals && window.empresasModals.showToggleModal) {
    window.empresasModals.showToggleModal(id, currentStatus, empresaName);
  } else {
    console.warn('Toggle modal not available');
  }
};

// Global filter functions - SAME AS HARDWARE
window.clearEmpresasFilters = () => {
  if (window.empresasMain) {
    window.empresasMain.clearFilters();
  }
};

window.exportEmpresas = () => {
  if (window.empresasMain) {
    window.empresasMain.exportEmpresas();
  }
};

window.openCreateEmpresaModal = () => {
  if (window.empresasMain) {
    window.empresasMain.openCreateModal();
  }
};

// Global function for SPA navigation - Version robusta similar a hardware
window.loadEmpresas = function() {
  console.log('🔄 SPA: Iniciando carga dinámica de empresas...');
  if (window.empresasMain) {
    window.empresasMain.loadEmpresas();
  } else {
    console.error('❌ SPA: empresasMain no está disponible');
  }
};
window.editEmpresa = (id) => empresasMain.editEmpresa(id);
window.viewEmpresa = (id) => empresasMain.viewEmpresa(id);
window.clearFilters = () => empresasMain.clearFilters();

console.log('🏢 Empresas main module loaded');