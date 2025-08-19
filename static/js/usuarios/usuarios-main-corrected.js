/**
 * ===== USUARIOS MAIN FUNCTIONALITY - CORREGIDA =====
 * 
 * Este archivo contiene la funcionalidad principal corregida para la gestión de usuarios:
 * - Sincronización correcta con variables globales de empresa
 * - Carga de datos de usuarios con manejo robusto de errores
 * - Filtros y búsqueda optimizados
 * - Integración perfecta con sistema de modales
 * - Renderizado de tarjetas con estilos consistentes
 * - Gestión específica para usuarios tipo 'empresa'
 */

class UsuariosMain {
  constructor() {
    this.usuarios = [];
    this.currentEmpresa = null;
    this.currentFilters = {
      search: '',
      status: '',
      includeInactive: 'active' // default to only active
    };
    this.apiClient = null;
    this.isLoading = false;
    this.stats = {
      total: 0,
      active: 0,
      inactive: 0,
      roles: 0
    };
    
    this.initializeComponents();
  }

  /**
   * Initialize all components with proper error handling
   */
  async initializeComponents() {
    try {
      console.log('👥 Inicializando sistema de usuarios corregido...');
      
      // 1. Setup API client first
      this.setupApiClient();
      
      // 2. Initialize empresa context based on user role
      this.initializeEmpresaContext();
      
      // 3. Setup event listeners after DOM is ready
      this.setupEventListeners();
      
      // 4. Load initial data based on context
      await this.loadInitialData();
      
      console.log('✅ Sistema de usuarios inicializado correctamente');
      
    } catch (error) {
      console.error('💥 Error al inicializar sistema de usuarios:', error);
      this.showEnhancedNotification('Error al inicializar el sistema de usuarios', 'error');
    }
  }

  /**
   * Initialize empresa context based on user role and global variables
   */
  initializeEmpresaContext() {
    console.log('🏢 Inicializando contexto de empresa...');
    console.log('Variables globales disponibles:', {
      userRole: window.userRole,
      empresaId: window.empresaId,
      empresaNombre: window.empresaNombre
    });
    
    // If user is empresa type, set current empresa automatically
    if (window.userRole === 'empresa' && window.empresaId) {
      this.currentEmpresa = {
        _id: window.empresaId,
        nombre: window.empresaNombre || 'Mi Empresa'
      };
      console.log('🏢 Empresa configurada automáticamente:', this.currentEmpresa);
      
      // Update UI to show empresa info
      this.updateEmpresaInfo(this.currentEmpresa);
      
      // Show filters since we have empresa context
      this.showFilters();
      
    } else if (window.userRole === 'super_admin') {
      console.log('👑 Usuario super admin detectado - requerirá selección de empresa');
    } else {
      console.log('⚠️ Tipo de usuario no reconocido o sin empresa asignada');
    }
  }

  /**
   * Setup API client with fallback options
   */
  setupApiClient() {
    console.log('🔌 Configurando cliente API...');
    
    if (window.EndpointTestClient) {
      this.apiClient = new window.EndpointTestClient('/proxy');
      console.log('✅ Usando EndpointTestClient global');
    } else if (window.apiClient) {
      this.apiClient = window.apiClient;
      console.log('✅ Usando apiClient global');
    } else {
      // Create basic fallback client
      this.apiClient = this.createBasicApiClient();
      console.log('✅ Usando cliente API básico (fallback)');
    }
  }

  /**
   * Create basic API client fallback
   */
  createBasicApiClient() {
    return {
      get_usuarios_by_empresa: (empresaId) => 
        fetch(`/proxy/empresas/${empresaId}/usuarios`, { credentials: 'include' }),
      get_usuario: (empresaId, userId) => 
        fetch(`/proxy/empresas/${empresaId}/usuarios/${userId}`, { credentials: 'include' }),
      get_empresa: (empresaId) => 
        fetch(`/proxy/empresas/${empresaId}`, { credentials: 'include' }),
      get_empresas: () => 
        fetch('/proxy/empresas', { credentials: 'include' }),
      toggle_usuario_status: (empresaId, userId, activo) => 
        fetch(`/proxy/empresas/${empresaId}/usuarios/${userId}/toggle-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ activo })
        }),
      update_usuario: (empresaId, userId, data) =>
        fetch(`/proxy/empresas/${empresaId}/usuarios/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        }),
      create_usuario: (empresaId, data) =>
        fetch(`/proxy/empresas/${empresaId}/usuarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        })
    };
  }

  /**
   * Setup event listeners with proper error handling
   */
  setupEventListeners() {
    console.log('🎯 Configurando event listeners...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupDelayedEventListeners());
    } else {
      setTimeout(() => this.setupDelayedEventListeners(), 100);
    }
  }

  /**
   * Setup event listeners after DOM is ready
   */
  setupDelayedEventListeners() {
    console.log('🎯 Configurando event listeners diferidos...');
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilters.search = e.target.value.toLowerCase();
        this.applyFilters();
      });
      console.log('🔍 Search input listener configured');
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.currentFilters.status = e.target.value;
        this.applyFilters();
      });
      console.log('📊 Status filter listener configured');
    }
    
    // Include inactive filter
    const includeInactiveFilter = document.getElementById('includeInactiveFilter');
    if (includeInactiveFilter) {
      includeInactiveFilter.addEventListener('change', (e) => {
        this.currentFilters.includeInactive = e.target.value;
        this.applyFilters();
      });
      console.log('👥 Include inactive filter listener configured');
    }
    
    console.log('✅ Event listeners configurados exitosamente');
  }

  /**
   * Load initial data based on user context
   */
  async loadInitialData() {
    console.log('📊 Cargando datos iniciales...');
    
    if (this.currentEmpresa && this.currentEmpresa._id) {
      // Load usuarios for empresa user or selected empresa
      console.log('🏢 Cargando usuarios para empresa:', this.currentEmpresa.nombre);
      await this.loadUsuarios();
    } else {
      console.log('⏳ Sin empresa seleccionada, esperando selección...');
    }
  }

  /**
   * Load usuarios for current empresa
   */
  async loadUsuarios() {
    if (!this.currentEmpresa || !this.currentEmpresa._id) {
      console.warn('⚠️ No hay empresa seleccionada para cargar usuarios');
      this.showEnhancedNotification('Selecciona una empresa primero', 'error');
      return;
    }

    if (this.isLoading) {
      console.log('⏳ Carga ya en progreso...');
      return;
    }

    try {
      this.isLoading = true;
      console.log('📊 Cargando usuarios para empresa:', this.currentEmpresa._id);
      
      // Show loading state
      this.showLoadingState();
      
      const response = await this.apiClient.get_usuarios_by_empresa(this.currentEmpresa._id);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📦 Respuesta del servidor:', result);
      
      if (result.success && result.data) {
        this.usuarios = result.data;
        console.log(`✅ ${this.usuarios.length} usuarios cargados`);
        
        // Calculate and update stats
        this.updateStats();
        
        // Show the content containers
        this.showContentContainers();
        
        // Render usuarios
        this.renderUsuarios();
        
        // Apply initial filters
        this.applyFilters();
        
      } else {
        throw new Error(result.message || 'Respuesta inválida del servidor');
      }
      
    } catch (error) {
      console.error('💥 Error al cargar usuarios:', error);
      this.showEnhancedNotification(`Error al cargar usuarios: ${error.message}`, 'error');
      this.showErrorState();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Update statistics based on current usuarios
   */
  updateStats() {
    this.stats.total = this.usuarios.length;
    this.stats.active = this.usuarios.filter(u => u.activo === true).length;
    this.stats.inactive = this.usuarios.filter(u => u.activo === false).length;
    this.stats.roles = [...new Set(this.usuarios.map(u => u.rol).filter(r => r))].length;
    
    // Update stats in UI
    this.updateStatsUI();
    
    console.log('📊 Stats actualizadas:', this.stats);
  }

  /**
   * Update stats UI elements
   */
  updateStatsUI() {
    const totalElement = document.getElementById('usersTotalCount');
    const activeElement = document.getElementById('usersActiveCount');
    const rolesElement = document.getElementById('usersRolesCount');
    const newElement = document.getElementById('usersNewCount');
    
    if (totalElement) totalElement.textContent = this.stats.total;
    if (activeElement) activeElement.textContent = this.stats.active;
    if (rolesElement) rolesElement.textContent = this.stats.roles;
    if (newElement) newElement.textContent = '0'; // TODO: Calculate recent users
  }

  /**
   * Show content containers (stats and grid)
   */
  showContentContainers() {
    const statsGrid = document.getElementById('usuariosStatsGrid');
    if (statsGrid) {
      statsGrid.style.display = 'grid';
    }
    
    const grid = document.getElementById('usuariosGrid');
    if (grid) {
      grid.style.display = 'grid';
    }
  }

  /**
   * Show filters section
   */
  showFilters() {
    const filtersContainer = document.getElementById('usuariosFilters');
    if (filtersContainer) {
      filtersContainer.style.display = 'block';
      console.log('👀 Filtros mostrados');
    }
  }

  /**
   * Update empresa info in UI
   */
  updateEmpresaInfo(empresa) {
    const nameElement = document.getElementById('selectedEmpresaName');
    const initialsElement = document.getElementById('empresaInitials');
    
    if (nameElement) {
      nameElement.textContent = empresa.nombre || 'Empresa Sin Nombre';
    }
    
    if (initialsElement) {
      const initials = (empresa.nombre || 'EM').substring(0, 2).toUpperCase();
      initialsElement.textContent = initials;
    }
    
    console.log('🏢 Info de empresa actualizada en UI:', empresa.nombre);
  }

  /**
   * Render usuarios in grid
   */
  renderUsuarios() {
    const grid = document.getElementById('usuariosGrid');
    if (!grid) {
      console.error('❌ Grid container not found');
      return;
    }

    if (this.usuarios.length === 0) {
      grid.innerHTML = `
        <div class="text-center py-12 col-span-full">
          <i class="fas fa-users text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No hay usuarios</h3>
          <p class="text-gray-500">Esta empresa no tiene usuarios registrados</p>
          <button class="ios-action-btn ios-action-btn-primary mt-4" onclick="openCreateUsuarioModal()">
            <i class="fas fa-user-plus mr-2"></i>
            Crear Primer Usuario
          </button>
        </div>
      `;
      return;
    }

    const usuariosHTML = this.usuarios.map(user => this.generateUsuarioCard(user)).join('');
    grid.innerHTML = usuariosHTML;
    
    console.log(`✅ ${this.usuarios.length} usuarios renderizados`);
  }

  /**
   * Generate HTML for usuario card
   */
  generateUsuarioCard(user) {
    const statusClass = user.activo ? 'active' : 'inactive';
    const statusText = user.activo ? 'Activo' : 'Inactivo';
    const statusIcon = user.activo ? 'fa-check-circle' : 'fa-times-circle';
    
    // Safely handle especialidades
    const especialidades = Array.isArray(user.especialidades) ? user.especialidades : [];
    const especialidadesText = especialidades.length > 0 
      ? especialidades.slice(0, 2).join(', ') + (especialidades.length > 2 ? '...' : '')
      : 'Sin especialidades';
    
    return `
      <div class="ios-hardware-card usuario-item" data-usuario-id="${user._id}">
        <div class="ios-card-header">
          <div class="ios-card-status">
            <span class="ios-status-indicator ${statusClass}">
              <i class="fas ${statusIcon}"></i>
              <span>${statusText}</span>
            </span>
          </div>
        </div>
        
        <div class="ios-card-content">
          <div class="ios-card-title">
            <h3>${user.nombre || 'Sin nombre'}</h3>
          </div>
          
          <div class="ios-card-info">
            <div class="ios-info-item">
              <span class="ios-info-label">
                <i class="fas fa-envelope text-purple-400"></i>
                Email
              </span>
              <span class="ios-info-value">${user.email || 'N/A'}</span>
            </div>
            
            <div class="ios-info-item">
              <span class="ios-info-label">
                <i class="fas fa-id-card text-cyan-400"></i>
                Cédula
              </span>
              <span class="ios-info-value">${user.cedula || 'N/A'}</span>
            </div>
            
            <div class="ios-info-item">
              <span class="ios-info-label">
                <i class="fas fa-user-tag text-blue-400"></i>
                Rol
              </span>
              <span class="ios-info-value">${user.rol || 'N/A'}</span>
            </div>
            
            <div class="ios-info-item">
              <span class="ios-info-label">
                <i class="fas fa-building text-orange-400"></i>
                Sede
              </span>
              <span class="ios-info-value">${user.sede || 'N/A'}</span>
            </div>
            
            <div class="ios-info-item full-width">
              <span class="ios-info-label">
                <i class="fas fa-user-md text-yellow-400"></i>
                Especialidades
              </span>
              <span class="ios-info-value">${especialidadesText}</span>
            </div>
          </div>
        </div>
        
        <div class="ios-card-actions">
          <button class="ios-card-btn ios-card-btn-info" onclick="viewUser('${user._id}')" title="Ver detalles">
            <i class="fas fa-eye"></i>
          </button>
          <button class="ios-card-btn ios-card-btn-edit" onclick="editUser('${user._id}')" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="ios-card-btn ${user.activo ? 'ios-card-btn-danger' : 'ios-card-btn-success'}" 
                  onclick="toggleUser('${user._id}', ${user.activo}, '${user.nombre || 'Usuario'}')" 
                  title="${user.activo ? 'Desactivar' : 'Activar'}">
            <i class="fas ${user.activo ? 'fa-user-times' : 'fa-user-check'}"></i>
          </button>
        </div>
        
        <div class="ios-card-shimmer"></div>
      </div>
    `;
  }

  /**
   * Apply filters to usuarios display
   */
  applyFilters() {
    if (!this.usuarios || this.usuarios.length === 0) {
      return;
    }

    console.log('🔍 Aplicando filtros:', this.currentFilters);

    let filteredUsuarios = [...this.usuarios];

    // Filter by search term
    if (this.currentFilters.search) {
      filteredUsuarios = filteredUsuarios.filter(user => {
        const searchTerm = this.currentFilters.search.toLowerCase();
        return (
          (user.nombre && user.nombre.toLowerCase().includes(searchTerm)) ||
          (user.email && user.email.toLowerCase().includes(searchTerm)) ||
          (user.cedula && user.cedula.toLowerCase().includes(searchTerm)) ||
          (user.rol && user.rol.toLowerCase().includes(searchTerm)) ||
          (user.sede && user.sede.toLowerCase().includes(searchTerm))
        );
      });
    }

    // Filter by status
    if (this.currentFilters.status === 'active') {
      filteredUsuarios = filteredUsuarios.filter(user => user.activo === true);
    } else if (this.currentFilters.status === 'inactive') {
      filteredUsuarios = filteredUsuarios.filter(user => user.activo === false);
    }

    // Filter by include inactive
    if (this.currentFilters.includeInactive === 'active') {
      filteredUsuarios = filteredUsuarios.filter(user => user.activo === true);
    }

    // Update grid with filtered results
    this.renderFilteredUsuarios(filteredUsuarios);
    
    console.log(`✅ Filtros aplicados - ${filteredUsuarios.length}/${this.usuarios.length} usuarios mostrados`);
  }

  /**
   * Render filtered usuarios
   */
  renderFilteredUsuarios(filteredUsuarios) {
    const grid = document.getElementById('usuariosGrid');
    if (!grid) return;

    if (filteredUsuarios.length === 0) {
      grid.innerHTML = `
        <div class="text-center py-12 col-span-full">
          <i class="fas fa-search text-6xl text-gray-400 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No se encontraron usuarios</h3>
          <p class="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
          <button class="ios-action-btn ios-action-btn-secondary mt-4" onclick="usuariosMain.clearFilters()">
            <i class="fas fa-filter-circle-xmark mr-2"></i>
            Limpiar Filtros
          </button>
        </div>
      `;
      return;
    }

    const usuariosHTML = filteredUsuarios.map(user => this.generateUsuarioCard(user)).join('');
    grid.innerHTML = usuariosHTML;
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    console.log('🧹 Limpiando filtros...');
    
    this.currentFilters = {
      search: '',
      status: '',
      includeInactive: 'active'
    };
    
    // Update UI elements
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const includeInactiveFilter = document.getElementById('includeInactiveFilter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (includeInactiveFilter) includeInactiveFilter.value = 'active';
    
    // Re-render usuarios
    this.renderUsuarios();
    
    console.log('✅ Filtros limpiados');
  }

  /**
   * Refresh usuarios data
   */
  async refreshUsers() {
    console.log('🔄 Refrescando datos de usuarios...');
    await this.loadUsuarios();
  }

  /**
   * Reload filters (used by modals after operations)
   */
  reloadFilters() {
    console.log('🔄 Recargando filtros...');
    setTimeout(() => {
      this.applyFilters();
    }, 100);
  }

  /**
   * Show loading state
   */
  showLoadingState() {
    const grid = document.getElementById('usuariosGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="text-center py-12 col-span-full">
          <i class="fas fa-spinner fa-spin text-6xl text-blue-500 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Cargando usuarios...</h3>
          <p class="text-gray-500">Por favor espera mientras cargamos los datos</p>
        </div>
      `;
    }
  }

  /**
   * Show error state
   */
  showErrorState() {
    const grid = document.getElementById('usuariosGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="text-center py-12 col-span-full">
          <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Error al cargar usuarios</h3>
          <p class="text-gray-500">Ha ocurrido un problema al cargar los datos</p>
          <button class="ios-action-btn ios-action-btn-primary mt-4" onclick="usuariosMain.refreshUsers()">
            <i class="fas fa-refresh mr-2"></i>
            Reintentar
          </button>
        </div>
      `;
    }
  }

  /**
   * Show enhanced notification
   */
  showEnhancedNotification(message, type = 'info') {
    // Try to use existing notification system
    if (window.showNotification) {
      window.showNotification(message, type);
      return;
    }
    
    // Fallback to simple alert
    console.log(`${type.toUpperCase()}: ${message}`);
    if (type === 'error') {
      alert(`Error: ${message}`);
    }
  }

  /**
   * Export usuarios (placeholder)
   */
  exportUsuarios() {
    console.log('📊 Exportando usuarios...');
    this.showEnhancedNotification('Funcionalidad de exportación en desarrollo', 'info');
  }
}

// Initialize usuarios main system
console.log('👥 Inicializando UsuariosMain...');
const usuariosMain = new UsuariosMain();

// Export for global access
window.usuariosMain = usuariosMain;

// Backward compatibility functions
window.refreshUsers = () => usuariosMain.refreshUsers();
window.clearUsuariosFilters = () => usuariosMain.clearFilters();

console.log('✅ UsuariosMain inicializado y disponible globalmente');
