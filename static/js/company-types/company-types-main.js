/**
 * ===== COMPANY TYPES MAIN FUNCTIONALITY =====
 * 
 * Este archivo contiene la funcionalidad principal para la gestión de tipos de empresa:
 * - Carga de datos de tipos de empresa (activos e inactivos)
 * - Filtros y búsqueda
 * - Integración con estado activo/inactivo
 * - Renderizado de tarjetas de tipos de empresa
 * - Integración con modales de CRUD
 */

class CompanyTypesMain {
  constructor() {
    this.companyTypes = [];
    this.companyTypesAll = []; // Incluye inactivos para dashboard
    this.currentFilters = {
      search: '',
      status: '',
      activa: 'active' // Por defecto solo mostrar activos
    };
    this.apiClient = null;
    this.isLoading = false;
    this.includeInactive = false; // Valor inicial del filtro
    
    this.initializeComponents();
  }

  /**
   * Initialize all components
   */
  async initializeComponents() {
    try {
      console.log('🏗️ Inicializando sistema de tipos de empresa...');
      
      // Setup API client
      await this.setupApiClient();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadInitialData();
      
      console.log('✅ Sistema de tipos de empresa inicializado correctamente');
      
    } catch (error) {
      console.error('💥 Error al inicializar sistema de tipos de empresa:', error);
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
      get_tipos_empresa: () => fetch('/proxy/api/tipos_empresa'),
      get_tipos_empresa_dashboard_all: () => fetch('/proxy/api/tipos_empresa/dashboard/all'),
      get_tipo_empresa: (id) => fetch(`/proxy/api/tipos_empresa/${id}`),
      toggle_tipo_empresa_status: (id, activo) => 
        fetch(`/proxy/api/tipos_empresa/${id}/toggle-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activo })
        }),
      create_tipo_empresa: (data) =>
        fetch('/proxy/api/tipos_empresa/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }),
      update_tipo_empresa: (id, data) =>
        fetch(`/proxy/api/tipos_empresa/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }),
      delete_tipo_empresa: (id) =>
        fetch(`/proxy/api/tipos_empresa/${id}`, {
          method: 'DELETE'
        })
    };
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Detectar si la página se cargó con include_inactive=true
    const urlParams = new URLSearchParams(window.location.search);
    this.includeInactive = urlParams.get('include_inactive') === 'true';
    
    console.log('🎯 Event listeners configurados para tipos de empresa');
    console.log('🔍 Estado inicial includeInactive:', this.includeInactive);
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    console.log('📍 DEBUG: Iniciando loadInitialData() para tipos de empresa');
    
    // SOLO cargar estadísticas del backend - NO renderizar tarjetas
    await this.loadCompanyTypesStats();
    
    console.log('📍 DEBUG: loadInitialData() terminado para tipos de empresa');
  }

  /**
   * Load company types stats only (no rendering)
   */
  async loadCompanyTypesStats() {
    console.log('📊 DEBUG: Cargando solo estadísticas de tipos de empresa');
    
    if (this.isLoading) {
      console.log('⏳ Ya hay una carga en progreso...');
      return;
    }

    try {
      this.isLoading = true;
      console.log('🔄 Cargando estadísticas desde backend...');
      
      // Load company types from API - siempre usar dashboard para traer todos
      let response;
      try {
        if (typeof this.apiClient.get_tipos_empresa_dashboard_all === 'function') {
          response = await this.apiClient.get_tipos_empresa_dashboard_all();
        } else {
          throw new Error('Dashboard endpoint not available');
        }
      } catch (dashboardError) {
        console.log('⚠️ Dashboard endpoint failed, using regular endpoint...');
        // Fallback to regular tipos empresa endpoint
        response = await this.apiClient.get_tipos_empresa();
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Respuesta de tipos de empresa (solo stats):', data);

      if (data.success && Array.isArray(data.data)) {
        this.companyTypesAll = data.data;
        
        console.log(`✅ ${data.data.length} tipos de empresa cargados para estadísticas`);
        
        // SOLO actualizar estadísticas - NO renderizar tarjetas
        this.updateCompanyTypeStats(data);
        
      } else {
        console.warn('⚠️ Respuesta inesperada del servidor:', data);
      }

    } catch (error) {
      console.error('💥 Error cargando estadísticas de tipos de empresa:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load company types from backend
   */
  async loadCompanyTypes() {
    console.log('📍 DEBUG: Iniciando loadCompanyTypes()');
    
    if (this.isLoading) {
      console.log('⏳ Ya hay una carga en progreso...');
      return;
    }

    try {
      this.isLoading = true;
      console.log('🔄 Cargando tipos de empresa desde backend...');
      
      this.showLoadingState();

      // Load company types from API - siempre usar dashboard para traer todos
      let response;
      try {
        if (typeof this.apiClient.get_tipos_empresa_dashboard_all === 'function') {
          response = await this.apiClient.get_tipos_empresa_dashboard_all();
        } else {
          throw new Error('Dashboard endpoint not available');
        }
      } catch (dashboardError) {
        console.log('⚠️ Dashboard endpoint failed, using regular endpoint...');
        // Fallback to regular tipos empresa endpoint
        response = await this.apiClient.get_tipos_empresa();
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Respuesta de tipos de empresa:', data);

      if (data.success && Array.isArray(data.data)) {
        this.companyTypesAll = data.data;
        
        console.log(`✅ ${data.data.length} tipos de empresa cargados desde backend`);
        
        // Renderizar tipos de empresa
        this.renderCompanyTypes();
        
        // Actualizar estadísticas
        this.updateCompanyTypeStats(data);
        
        // DESPUÉS aplicar filtros automáticos
        this.applyFilters();
        this.hideLoadingState();
        
      } else {
        console.warn('⚠️ Respuesta inesperada del servidor:', data);
        this.showError('Formato de respuesta inesperado del servidor');
      }

    } catch (error) {
      console.error('💥 Error cargando tipos de empresa:', error);
      this.showError('Error al cargar tipos de empresa: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Apply filters to company types list
   */
  applyFilters() {
    console.log('🔍 DEBUG: Iniciando applyFilters() en tipos de empresa');
    console.log('  - this.companyTypesAll:', this.companyTypesAll);
    console.log('  - this.companyTypesAll.length:', this.companyTypesAll ? this.companyTypesAll.length : 'null');
    console.log('  - this.includeInactive:', this.includeInactive);
    
    if (!this.companyTypesAll || this.companyTypesAll.length === 0) {
      console.log('📋 No hay tipos de empresa para filtrar');
      this.companyTypes = [];
      this.renderCompanyTypes();
      this.updateCompanyTypeStats();
      return;
    }

    let filteredTypes = [...this.companyTypesAll];

    // FILTRO PRINCIPAL: Solo mostrar activos por defecto (similar al app.py)
    if (!this.includeInactive) {
      filteredTypes = filteredTypes.filter(tipo => {
        // Usar 'activo' como campo principal para tipos de empresa
        const isActive = tipo.hasOwnProperty('activo') 
          ? (tipo.activo === true || tipo.activo === 1 || tipo.activo === 'true')
          : true; // Por defecto activo si no existe el campo
        console.log(`  - Tipo "${tipo.nombre}": activo=${tipo.activo}, isActive=${isActive}`);
        return isActive;
      });
    }
    // Si includeInactive es true, se incluyen todos (activos e inactivos)

    this.companyTypes = filteredTypes;
    console.log(`🔍 RESULTADO FINAL: ${filteredTypes.length} tipos de empresa filtrados de ${this.companyTypesAll.length} totales`);
    console.log('🔍 Tipos finales:', filteredTypes.map(t => `${t.nombre} (activo: ${t.activo})`));
    
    this.renderCompanyTypes();
    this.updateCompanyTypeStats();

    console.log(`🔍 Filtros aplicados: ${filteredTypes.length}/${this.companyTypesAll.length} tipos de empresa`);
  }

  /**
   * Render company types cards
   */
  renderCompanyTypes() {
    const gridContainer = document.getElementById('companyTypesGrid');
    
    if (!gridContainer) {
      console.error('❌ Grid container no encontrado');
      return;
    }
    
    gridContainer.className = 'ios-hardware-grid';
    gridContainer.innerHTML = '';
    
    if (!this.companyTypes || this.companyTypes.length === 0) {
      this.showEmptyState(gridContainer);
      return;
    }
    
    this.companyTypes.forEach((companyType, index) => {
      try {
        const gridCard = this.createCompanyTypeCard(companyType);
        if (gridCard) {
          gridCard.setAttribute('data-type-id', companyType._id || companyType.id);
          gridCard.className = 'ios-hardware-card company-type-item';
          gridContainer.appendChild(gridCard);
        }
      } catch (error) {
        console.error(`Error renderizando tipo de empresa ${index + 1}:`, error);
      }
    });
  }

  /**
   * Create company type card element (similar to hardware/empresas)
   */
  createCompanyTypeCard(companyType) {
    const card = document.createElement('div');
    card.className = 'ios-hardware-card company-type-item';
    card.dataset.typeId = companyType._id || companyType.id;
    card.dataset.status = (companyType.activo !== false) ? 'true' : 'false';
    card.dataset.nombre = companyType.nombre || '';

    const statusClass = (companyType.activo !== false) ? 'ios-status-available' : 'ios-status-discontinued';
    const statusText = (companyType.activo !== false) ? '✅ Activo' : '⚫ Inactivo';
    const fechaCreacion = this.formatDate(companyType.fecha_creacion);
    const empresasCount = companyType.empresas_count || 0;

    card.innerHTML = `
      <div class="ios-card-header">
        <div class="ios-card-icon">
          <i class="fas fa-layer-group"></i>
        </div>
        <span class="ios-status-badge ${statusClass} text-xs font-semibold">
          ${statusText}
        </span>
      </div>
      
      <h3 class="ios-card-title text-xl font-semibold text-gray-900 dark:text-white">${companyType.nombre || 'Sin nombre'}</h3>
      <p class="ios-card-subtitle text-sm text-gray-600 dark:text-gray-400 leading-relaxed">${companyType.descripcion || 'Sin descripción'}</p>
      
      <!-- Sección específica para tipos de empresa -->
      <div class="ios-card-info">
        <!-- Empresas asociadas - FILA COMPLETA -->
        <div class="ios-info-item full-width">
          <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
            <i class="fas fa-building text-purple-400 mr-1"></i>
            Empresas asociadas
          </span>
          <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${empresasCount}</span>
        </div>
        
        <!-- Características y Estado - MISMA FILA -->
        ${companyType.caracteristicas && companyType.caracteristicas.length > 0 ? `
        <div class="ios-info-item">
          <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
            <i class="fas fa-tags text-blue-400 mr-1"></i>
            Características
          </span>
          <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${companyType.caracteristicas.length}</span>
        </div>
        ` : ''}
        <div class="ios-info-item">
          <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
            <i class="fas fa-toggle-on text-green-400 mr-1"></i>
            Estado
          </span>
          <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${companyType.activo ? 'Activo' : 'Inactivo'}</span>
        </div>
        
        <!-- Fecha de creación - FILA COMPLETA -->
        <div class="ios-info-item full-width">
          <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
            <i class="fas fa-calendar text-orange-400 mr-1"></i>
            Fecha de creación
          </span>
          <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${fechaCreacion}</span>
        </div>
      </div>
      
      <!-- Características destacadas (si existen) -->
      ${companyType.caracteristicas && companyType.caracteristicas.length > 0 ? `
        <div class="mt-3 mb-3">
          <div class="text-xs font-semibold text-blue-800 dark:text-blue-400 mb-2">
            <i class="fas fa-tags mr-1 text-blue-700 dark:text-blue-400"></i>
            Características principales:
          </div>
          <div class="flex flex-wrap gap-1">
            ${companyType.caracteristicas.slice(0, 3).map(caracteristica => 
              `<span class="inline-block px-2 py-1 bg-blue-700 dark:bg-blue-500/20 text-white dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-800 dark:border-blue-500/30">
                ${caracteristica}
              </span>`
            ).join('')}
            ${companyType.caracteristicas.length > 3 ? 
              `<span class="inline-block px-2 py-1 bg-gray-700 dark:bg-gray-500/20 text-white dark:text-gray-300 text-xs font-semibold rounded-full border border-gray-800 dark:border-gray-500/30">
                +${companyType.caracteristicas.length - 3} más
              </span>`
            : ''}
          </div>
        </div>
      ` : ''}
      
      <!-- Botones de acción específicos para tipos de empresa -->
      <div class="ios-card-actions">
        <button class="ios-card-btn" onclick="companyTypesMain.viewCompanyType('${companyType._id || companyType.id}')" title="Ver detalles completos">
          <i class="fas fa-eye"></i>
        </button>
        ${empresasCount > 0 ? `
        <button class="ios-card-btn ios-card-btn-info" onclick="companyTypesMain.viewCompaniesOfType('${companyType._id || companyType.id}', '${companyType.nombre}')" title="Ver empresas de este tipo">
          <i class="fas fa-building"></i>
        </button>
        ` : ''}
        <button class="ios-card-btn ios-card-btn-primary" onclick="companyTypesMain.editCompanyType('${companyType._id || companyType.id}')" title="Editar tipo">
          <i class="fas fa-edit"></i>
        </button>
        <button class="ios-card-btn ${(companyType.activo !== false) ? 'ios-card-btn-warning' : 'ios-card-btn-success'}" 
                onclick="companyTypesMain.toggleCompanyTypeStatus('${companyType._id || companyType.id}', ${companyType.activo !== false}, '${companyType.nombre}')" 
                title="${(companyType.activo !== false) ? 'Desactivar tipo' : 'Activar tipo'}">
          <i class="fas ${(companyType.activo !== false) ? 'fa-power-off' : 'fa-play'}"></i>
        </button>
      </div>
      
      <!-- iOS Card Shimmer Effect -->
      <div class="ios-card-shimmer"></div>
    `;

    return card;
  }

  /**
   * Show empty state
   */
  showEmptyState(container) {
    const hasFilters = !this.includeInactive;

    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'text-center py-12';
    
    if (hasFilters) {
      emptyDiv.innerHTML = `
        <div class="text-center">
          <i class="fas fa-search text-4xl mb-4 text-gray-400"></i>
          <h2 class="text-2xl font-bold text-white mb-2">No se encontraron tipos de empresa activos</h2>
          <p class="text-sm text-gray-400">Prueba incluyendo los tipos inactivos.</p>
          <button onclick="toggleIncludeInactive()" class="mt-4 ios-action-btn">
            <i class="fas fa-eye"></i>
            Ver Todos
          </button>
        </div>
      `;
    } else {
      emptyDiv.innerHTML = `
        <div class="text-center">
          <i class="fas fa-layer-group text-4xl mb-4 text-gray-400"></i>
          <h2 class="text-2xl font-bold text-white mb-2">No hay tipos de empresa registrados</h2>
          <p class="text-sm text-gray-400">Crea el primer tipo de empresa para comenzar.</p>
          <button onclick="openCreateModal()" class="mt-4 ios-action-btn">
            <i class="fas fa-plus"></i>
            Crear Primer Tipo
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
    const container = document.getElementById('companyTypesGrid');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p class="text-gray-500 dark:text-gray-400 mt-4">Cargando tipos de empresa...</p>
        </div>
      `;
    }
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    // Loading state is replaced by content in renderCompanyTypes()
  }

  /**
   * Show error state
   */
  showError(message) {
    const container = document.getElementById('companyTypesGrid');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <h3 class="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p class="text-gray-500">${message}</p>
          <button onclick="companyTypesMain.loadCompanyTypes()" class="mt-4 ios-action-btn">
            <i class="fas fa-refresh"></i>
            Reintentar
          </button>
        </div>
      `;
    }
  }

  /**
   * Update company type statistics
   */
  updateCompanyTypeStats(data) {
    console.log('📊 Actualizando estadísticas de tipos de empresa...');
    
    if (data && data.data && Array.isArray(data.data)) {
      const allTypes = data.data;
      const activeTypes = allTypes.filter(tipo => tipo.activo !== false);
      const totalCompanies = allTypes.reduce((sum, tipo) => sum + (tipo.empresas_count || 0), 0);
      
      // Actualizar contadores en la UI
      const totalElement = document.getElementById('totalTypesCount');
      const activeElement = document.getElementById('activeTypesCount');
      const companiesElement = document.getElementById('totalCompaniesCount');
      const avgElement = document.getElementById('avgCompaniesCount');
      
      if (totalElement) totalElement.textContent = allTypes.length;
      if (activeElement) activeElement.textContent = activeTypes.length;
      if (companiesElement) companiesElement.textContent = totalCompanies;
      if (avgElement && allTypes.length > 0) {
        avgElement.textContent = Math.round(totalCompanies / allTypes.length * 10) / 10;
      }
    }
  }

  /**
   * Action methods (to be called from template buttons)
   */
  viewCompanyType(id) {
    console.log('👁️ Ver tipo de empresa:', id);
    // TODO: Implementar modal de vista
  }

  viewCompaniesOfType(id, nombre) {
    console.log('🏢 Ver empresas del tipo:', nombre, 'ID:', id);
    // Redirigir a la página de empresas con filtro por tipo
    window.location.href = `/admin/empresas?tipo_empresa_id=${id}&tipo_empresa_nombre=${encodeURIComponent(nombre)}`;
  }

  editCompanyType(id) {
    console.log('✏️ Editar tipo de empresa:', id);
    // TODO: Implementar modal de edición
  }

  toggleCompanyTypeStatus(id, currentStatus, nombre) {
    console.log('🔄 Toggle estado tipo de empresa:', nombre, 'Estado actual:', currentStatus);
    // TODO: Implementar modal de confirmación
  }

  /**
   * Show fallback error
   */
  showFallbackError() {
    console.error('💥 Error crítico en tipos de empresa');
    const container = document.getElementById('companyTypesGrid');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <h3 class="text-lg font-semibold text-red-600 mb-2">Error Crítico</h3>
          <p class="text-gray-500">No se pudo inicializar el sistema de tipos de empresa</p>
        </div>
      `;
    }
  }

  /**
   * Utility functions
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    } catch (e) {
      return 'N/A';
    }
  }
}

// Función global para toggle incluir inactivos - REMOVIDA
// El template ya tiene su propio sistema de filtrado dinámico
// que funciona sin recargar la página

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Crear instancia global
  window.companyTypesMain = new CompanyTypesMain();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompanyTypesMain;
}
