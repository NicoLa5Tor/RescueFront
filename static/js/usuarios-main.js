/**
 * ===== USUARIOS MAIN FUNCTIONALITY =====
 * 
 * Este archivo contiene la funcionalidad principal para la gestión de usuarios:
 * - Carga de datos de usuarios (activos e inactivos)
 * - Filtros y búsqueda
 * - Integración con estado activo/inactivo
 * - Renderizado de tarjetas de usuarios
 * - Integración con modales de CRUD
 * - Peticiones reales a la base de datos
 */

class UsuariosMain {
  constructor() {
    this.usuarios = [];
    this.usuariosAll = []; // Incluye inactivos para gestión completa
    this.empresas = []; // Lista de empresas disponibles
    this.currentEmpresa = null; // Empresa seleccionada actualmente
    this.currentFilters = {
      search: '',
      status: '',
      activa: 'active'
    };
    this.apiClient = null;
    this.isLoading = false;
    
    this.initializeComponents();
  }

  /**
   * Initialize all components
   */
  async initializeComponents() {
    try {
      console.log('👥 Inicializando sistema de usuarios...');      
      await this.setupApiClient();
      this.setupEventListeners();
      await this.loadInitialData();
      console.log('✅ Sistema de usuarios inicializado correctamente');
    } catch (error) {
      console.error('💥 Error al inicializar sistema de usuarios:', error);
    }
  }

  /**
   * Setup API client
   */
  async setupApiClient() {
    // Use global API client if available
    if (window.EndpointTestClient) {
      this.apiClient = new window.EndpointTestClient('/proxy');
      console.log('✅ Usando API client global');
    } else {
      console.error('❌ API client global no disponible');
      throw new Error('API client not available');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilters.search = e.target.value.toLowerCase();
        this.applyFilters();
      });
    }

    // Empresa selector
    const empresaSelector = document.getElementById('empresaSelector');
    if (empresaSelector) {
      empresaSelector.addEventListener('change', (e) => {
        const empresaId = e.target.value;
        if (empresaId) {
          this.selectEmpresa(empresaId);
        } else {
          this.clearUsuarios();
        }
      });
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
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
        this.loadUsuarios(); // Reload with different endpoint
      });
    }

    console.log('🎯 Event listeners configurados');
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    await this.loadEmpresas();
    // Load usuarios after empresa is selected
  }

  /**
   * Load empresas from backend
   */
  async loadEmpresas() {
    try {
      console.log('🏢 Cargando empresas...');
      
      const response = await this.apiClient.get_empresas();
      
      if (!response.ok) {
        throw new Error(`Error HTTP! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Respuesta de empresas:', data);

      if (data.success && Array.isArray(data.data)) {
        this.empresas = data.data;
        this.populateEmpresaSelector();
        console.log(`✅ ${this.empresas.length} empresas cargadas`);
      } else {
        console.warn('⚠️ Respuesta inesperada del servidor:', data);
        this.showError('Formato de respuesta inesperado del servidor');
      }

    } catch (error) {
      console.error('💥 Error al cargar empresas:', error);
      this.showError('Error al cargar empresas: ' + error.message);
    }
  }

  /**
   * Populate empresa selector
   */
  populateEmpresaSelector() {
    const selector = document.getElementById('empresaSelector');
    if (!selector) return;

    selector.innerHTML = '<option value="">Selecciona una empresa...</option>';
    
    this.empresas.forEach(empresa => {
      const option = document.createElement('option');
      option.value = empresa._id;
      option.textContent = empresa.nombre;
      selector.appendChild(option);
    });
  }

  /**
   * Select empresa and load its usuarios
   */
  async selectEmpresa(empresaId) {
    const empresa = this.empresas.find(e => e._id === empresaId);
    if (!empresa) return;

    this.currentEmpresa = empresa;
    this.updateEmpresaInfo(empresa);
    await this.loadUsuarios();
    this.updateHeaderBadge();
  }

  /**
   * Update empresa info display
   */
  updateEmpresaInfo(empresa) {
    const infoDiv = document.getElementById('selectedEmpresaInfo');
    const initialsSpan = document.getElementById('empresaInitials');
    const nameH3 = document.getElementById('selectedEmpresaName');
    const locationP = document.getElementById('selectedEmpresaLocation');
    
    if (infoDiv && initialsSpan && nameH3 && locationP) {
      const initials = this.getIniciales(empresa.nombre);
      initialsSpan.textContent = initials;
      nameH3.textContent = empresa.nombre;
      locationP.textContent = empresa.ubicacion || 'Sin ubicación';
      infoDiv.classList.remove('hidden');
    }
  }

  /**
   * Load usuarios from backend
   */
  async loadUsuarios() {
    if (!this.currentEmpresa) {
      console.log('⚠️ No hay empresa seleccionada');
      return;
    }

    if (this.isLoading) {
      console.log('⏳ Ya hay una carga en progreso...');
      return;
    }

    try {
      this.isLoading = true;
      console.log(`🔄 Cargando usuarios para empresa: ${this.currentEmpresa.nombre}`);

      this.showLoadingState();

      // Determine which endpoint to use based on filter
      let response;
      if (this.currentFilters.activa === 'all') {
        response = await this.apiClient.get_usuarios_including_inactive(this.currentEmpresa._id);
      } else {
        response = await this.apiClient.get_usuarios_by_empresa(this.currentEmpresa._id);
      }

      if (!response.ok) {
        throw new Error(`Error HTTP! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Respuesta de usuarios:', data);

      if (data.success && Array.isArray(data.data)) {
        this.usuariosAll = data.data;
        this.usuarios = data.data;
        console.log(`✅ ${this.usuarios.length} usuarios cargados`);
        this.updateStats();
        this.renderUsuarios();
        this.hideLoadingState();
      } else {
        this.showError('Formato de respuesta inesperado');
      }

    } catch (error) {
      console.error('💥 Error al cargar usuarios:', error);
      this.showError('Error al cargar usuarios: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Clear usuarios when no empresa selected
   */
  clearUsuarios() {
    this.usuarios = [];
    this.usuariosAll = [];
    this.currentEmpresa = null;
    
    const infoDiv = document.getElementById('selectedEmpresaInfo');
    if (infoDiv) {
      infoDiv.classList.add('hidden');
    }
    
    this.renderUsuarios();
    this.updateHeaderBadge();
  }

  /**
   * Update stats
   */
  updateStats() {
    const stats = {
      total: this.usuariosAll.length,
      active: this.usuariosAll.filter(u => u.activa !== false).length,
      inactive: this.usuariosAll.filter(u => u.activa === false).length,
      roles: new Set(this.usuariosAll.map(u => u.rol).filter(Boolean)).size
    };

    // Update stats elements if they exist
    const elements = {
      'totalUsersCount': stats.total,
      'activeUsersCount': stats.active,
      'uniqueRolesCount': stats.roles
    };

    Object.entries(elements).forEach(([elementId, value]) => {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = value;
      }
    });

    console.log('📊 Estadísticas actualizadas:', stats);
  }

  /**
   * Update header badge
   */
  updateHeaderBadge() {
    // El badge no existe en esta vista, pero podemos actualizar otros elementos
    console.log(`🏷️ Badge info: ${this.usuarios.length} usuarios`);
  }

  /**
   * Render usuarios list
   */
  renderUsuarios() {
    const container = document.getElementById('usuariosGrid');

    if (!container) {
      console.warn('⚠️ Contenedor de usuarios no encontrado');
      return;
    }

    container.innerHTML = '';

    if (this.usuarios.length === 0) {
      this.showEmptyState(container);
      return;
    }

    this.usuarios.forEach(usuario => {
      const card = this.createUsuarioCard(usuario);
      container.appendChild(card);
    });

    console.log(`🎨 Renderizados ${this.usuarios.length} usuarios`);
  }

  /**
   * Create usuario card element
   */
  createUsuarioCard(usuario) {
    const card = document.createElement('div');
    card.className = 'ios-hardware-card usuario-item';
    card.dataset.usuarioId = usuario._id;
    card.dataset.status = usuario.activa !== false ? 'true' : 'false';
    card.dataset.nombre = usuario.nombre || '';
    card.dataset.email = usuario.email || '';

    const iniciales = this.getIniciales(usuario.nombre);
    const statusClass = usuario.activa !== false ? 'ios-status-available' : 'ios-status-discontinued';
    const statusText = usuario.activa !== false ? '✅ Activo' : '⚫ Inactivo';
    const fechaCreacion = this.formatDate(usuario.fecha_creacion);

    card.innerHTML = `
      <div class="ios-card-header">
        <div class="ios-card-icon">
          <i class="fas fa-user"></i>
        </div>
        <span class="ios-status-badge ${statusClass} text-xs font-semibold">
          ${statusText}
        </span>
      </div>
      
      <h3 class="ios-card-title text-xl font-semibold text-gray-900 dark:text-white">${usuario.nombre || 'Sin nombre'}</h3>
      <p class="ios-card-subtitle text-sm text-gray-600 dark:text-gray-400 leading-relaxed">${usuario.email || 'Sin email'}</p>
      
      <!-- Sección específica para usuarios -->
      <div class="ios-card-info">
        <!-- Cédula - FILA COMPLETA -->
        <div class="ios-info-item full-width">
          <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
            <i class="fas fa-id-card text-blue-400 mr-1"></i>
            Cédula
          </span>
          <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${usuario.cedula || 'N/A'}</span>
        </div>
        
        <!-- Rol y Sede - MISMA FILA -->
        <div class="ios-info-item">
          <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
            <i class="fas fa-user-tag text-purple-400 mr-1"></i>
            Rol
          </span>
          <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${usuario.rol || 'N/A'}</span>
        </div>
        <div class="ios-info-item">
          <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
            <i class="fas fa-building text-green-400 mr-1"></i>
            Sede
          </span>
          <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${usuario.sede || 'Principal'}</span>
        </div>
        
        <!-- Fecha de registro - FILA COMPLETA -->
        <div class="ios-info-item full-width">
          <span class="ios-info-label text-xs font-medium text-gray-600 dark:text-gray-400">
            <i class="fas fa-calendar text-orange-400 mr-1"></i>
            Fecha de registro
          </span>
          <span class="ios-info-value text-sm font-bold text-gray-900 dark:text-white">${fechaCreacion}</span>
        </div>
      </div>
      
      <!-- Certificaciones destacadas (si existen) -->
      ${usuario.certificaciones && usuario.certificaciones.length > 0 ? `
        <div class="mt-3 mb-3">
          <div class="text-xs font-semibold text-blue-800 dark:text-blue-400 mb-2">
            <i class="fas fa-certificate mr-1 text-blue-700 dark:text-blue-400"></i>
            Certificaciones:
          </div>
          <div class="flex flex-wrap gap-1">
            ${usuario.certificaciones.slice(0, 2).map(cert => 
              `<span class="inline-block px-2 py-1 bg-blue-700 dark:bg-blue-500/20 text-white dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-800 dark:border-blue-500/30">
                ${cert}
              </span>`
            ).join('')}
            ${usuario.certificaciones.length > 2 ? 
              `<span class="inline-block px-2 py-1 bg-gray-700 dark:bg-gray-500/20 text-white dark:text-gray-300 text-xs font-semibold rounded-full border border-gray-800 dark:border-gray-500/30">
                +${usuario.certificaciones.length - 2} más
              </span>`
            : ''}
          </div>
        </div>
      ` : ''}
      
      <!-- Botones de acción específicos para usuarios -->
      <div class="ios-card-actions">
        <button class="ios-card-btn" onclick="usuariosMain.viewUsuario('${usuario._id}')" title="Ver detalles completos">
          <i class="fas fa-eye"></i>
        </button>
        <button class="ios-card-btn ios-card-btn-primary" onclick="usuariosMain.editUsuario('${usuario._id}')" title="Editar usuario">
          <i class="fas fa-edit"></i>
        </button>
        <button class="ios-card-btn ${usuario.activa !== false ? 'ios-card-btn-warning' : 'ios-card-btn-success'}" 
                onclick="usuariosMain.toggleUsuarioStatus('${usuario._id}')" 
                title="${usuario.activa !== false ? 'Desactivar usuario' : 'Activar usuario'}">
          <i class="fas ${usuario.activa !== false ? 'fa-power-off' : 'fa-play'}"></i>
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
    const hasFilters = this.currentFilters.search || 
                       this.currentFilters.status !== '';

    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'text-center py-12 col-span-full';
    
    if (hasFilters) {
      emptyDiv.innerHTML = `
        <div class="text-center">
          <i class="fas fa-search text-4xl mb-4 text-gray-400"></i>
          <h2 class="text-2xl font-bold text-white mb-2">No se encontraron usuarios</h2>
          <p class="text-sm text-gray-400">Prueba ajustando los criterios de búsqueda.</p>
          <button onclick="usuariosMain.clearFilters()" class="mt-4 ios-action-btn">
            <i class="fas fa-filter-circle-xmark"></i>
            Limpiar Filtros
          </button>
        </div>
      `;
    } else {
      emptyDiv.innerHTML = `
        <div class="text-center">
          <i class="fas fa-users text-4xl mb-4 text-gray-400"></i>
          <h2 class="text-2xl font-bold text-white mb-2">No hay usuarios registrados</h2>
          <p class="text-sm text-gray-400">Esta empresa aún no tiene usuarios.</p>
          <button onclick="openCreateUsuarioModal()" class="mt-4 ios-action-btn">
            <i class="fas fa-plus"></i>
            Crear Primer Usuario
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
    const container = document.getElementById('usuariosGrid');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-12 col-span-full">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p class="text-gray-500 dark:text-gray-400 mt-4">Cargando usuarios...</p>
        </div>
      `;
    }
  }

  /**
   * Hide loading state
   */
  hideLoadingState() {
    // Loading state is replaced by content in renderUsuarios()
  }

  /**
   * Show error state
   */
  showError(message) {
    const container = document.getElementById('usuariosGrid');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-12 col-span-full">
          <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <h3 class="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p class="text-gray-500">${message}</p>
          <button onclick="usuariosMain.loadUsuarios()" class="mt-4 ios-action-btn">
            <i class="fas fa-refresh"></i>
            Reintentar
          </button>
        </div>
      `;
    }
  }

  /**
   * Toggle usuario status
   */
  async toggleUsuarioStatus(usuarioId) {
    if (!this.currentEmpresa || !usuarioId) {
      console.warn('⚠️ No hay empresa seleccionada o ID de usuario inválido');
      return;
    }

    // Find current user to get current status
    const usuario = this.usuariosAll.find(u => u._id === usuarioId);
    if (!usuario) {
      console.error('⚠️ Usuario no encontrado');
      return;
    }

    const currentStatus = usuario.activo !== false;
    const userName = usuario.nombre || 'Usuario';
    
    // Use modal to confirm toggle
    if (window.usuariosModals) {
      window.usuariosModals.showToggleModal(usuarioId, currentStatus, userName);
    } else {
      // Fallback if modals not available
      const newStatus = !currentStatus;
      const confirmed = confirm(`¿Estás seguro de que quieres ${newStatus ? 'activar' : 'desactivar'} al usuario "${userName}"?`);
      
      if (confirmed) {
        await this.performToggleStatus(usuarioId, newStatus);
      }
    }
  }

  /**
   * Perform actual toggle status (used by modal or fallback)
   */
  async performToggleStatus(usuarioId, newStatus) {
    try {
      console.log(`🔄 Cambiando estado del usuario ${usuarioId} a ${newStatus ? 'activo' : 'inactivo'}`);
      
      const response = await this.apiClient.toggle_usuario_status(this.currentEmpresa._id, usuarioId, newStatus);
      const data = await response.json();

      if (data.success) {
        console.log(`✅ Estado del usuario ${usuarioId} cambiado con éxito`);
        this.showNotification(data.message || 'Estado del usuario actualizado', 'success');
        await this.loadUsuarios(); // Reload to show updated status
      } else {
        console.error('💥 Error al cambiar el estado del usuario:', data.error || data.errors);
        this.showNotification('Error al cambiar el estado del usuario', 'error');
      }

    } catch (error) {
      console.error('💥 Error en petición de estado de usuario:', error);
      this.showNotification('Error de conexión', 'error');
    }
  }

  /**
   * View usuario details
   */
  viewUsuario(usuarioId) {
    console.log('👁️ Ver usuario:', usuarioId);
    if (window.usuariosModals) {
      window.usuariosModals.openViewModal(usuarioId);
    } else {
      alert('Sistema de modales no disponible');
    }
  }

  /**
   * Edit usuario
   */
  editUsuario(usuarioId) {
    console.log('📝 Editar usuario:', usuarioId);
    if (window.usuariosModals) {
      window.usuariosModals.openEditModal(usuarioId);
    } else {
      alert('Sistema de modales no disponible');
    }
  }

  /**
   * Apply filters to usuarios list
   */
  applyFilters() {
    if (!this.usuariosAll || this.usuariosAll.length === 0) {
      console.log('📋 No hay usuarios para filtrar');
      return;
    }

    let filteredUsuarios = [...this.usuariosAll];

    // Search filter
    if (this.currentFilters.search) {
      const searchTerm = this.currentFilters.search.toLowerCase();
      filteredUsuarios = filteredUsuarios.filter(usuario => 
        (usuario.nombre || '').toLowerCase().includes(searchTerm) ||
        (usuario.email || '').toLowerCase().includes(searchTerm) ||
        (usuario.cedula || '').toLowerCase().includes(searchTerm) ||
        (usuario.rol || '').toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (this.currentFilters.status) {
      filteredUsuarios = filteredUsuarios.filter(usuario => {
        if (this.currentFilters.status === 'active') {
          return usuario.activa !== false;
        } else if (this.currentFilters.status === 'inactive') {
          return usuario.activa === false;
        }
        return true;
      });
    }

    // Include inactive filter
    if (this.currentFilters.activa === 'active') {
      filteredUsuarios = filteredUsuarios.filter(usuario => usuario.activa !== false);
    }

    this.usuarios = filteredUsuarios;
    this.renderUsuarios();
    this.updateStats();
    this.updateHeaderBadge();

    console.log(`🔍 Filtros aplicados: ${filteredUsuarios.length}/${this.usuariosAll.length} usuarios`);
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.currentFilters = {
      search: '',
      status: '',
      activa: 'active'
    };

    // Reset form elements
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const includeInactiveFilter = document.getElementById('includeInactiveFilter');

    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (includeInactiveFilter) includeInactiveFilter.value = 'active';

    this.applyFilters();
  }

  /**
   * Refresh users list (used by modals)
   */
  async refreshUsers() {
    console.log('🔄 Refrescando lista de usuarios...');
    await this.loadUsuarios();
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
   * Show notification
   */
  showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.usuario-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `usuario-notification fixed top-4 right-4 max-w-sm w-full`;
    notification.style.zIndex = '999999';
    
    let iconClass, bgClass, borderClass;
    if (type === 'error') {
      iconClass = 'fas fa-exclamation-circle';
      bgClass = 'bg-red-500';
      borderClass = 'border-red-600';
    } else if (type === 'success') {
      iconClass = 'fas fa-check-circle';
      bgClass = 'bg-green-500';
      borderClass = 'border-green-600';
    } else {
      iconClass = 'fas fa-info-circle';
      bgClass = 'bg-blue-500';
      borderClass = 'border-blue-600';
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
            <button onclick="this.closest('.usuario-notification').remove()" class="text-white hover:text-gray-200 transition-colors">
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
}

// Initialize usuarios system
const usuariosMain = new UsuariosMain();
window.usuariosMain = usuariosMain;

// Export functions for global access
window.clearUsuariosFilters = () => {
  if (window.usuariosMain) {
    window.usuariosMain.clearFilters();
  }
};

window.exportUsuarios = () => {
  if (window.usuariosMain && window.usuariosMain.currentEmpresa) {
    console.log('📄 Exportar usuarios de:', window.usuariosMain.currentEmpresa.nombre);
    alert('Funcionalidad de exportación en desarrollo');
  } else {
    alert('Selecciona una empresa primero');
  }
};

console.log('👥 Usuarios main module loaded');

