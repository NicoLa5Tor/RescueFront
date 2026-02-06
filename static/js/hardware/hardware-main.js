/**
 * ===== HARDWARE MAIN JAVASCRIPT =====
 * 
 * Este archivo coordina todos los módulos de JavaScript para la gestión de hardware.
 * Se encarga de:
 * - Inicializar todos los módulos
 * - Configurar el API client
 * - Coordinar la carga de datos
 * - Manejar dependencias entre módulos
 */

class HardwareMain {
  constructor() {
    this.modules = {
      core: null,
      data: null,
      modals: null,
      notifications: null,
      filters: null,
      performance: null
    };

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

    this.apiClient = null;
    this.initialized = false;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }


  /**
   * Initialize all hardware modules
   */
  async initialize() {
    try {
      //////console.log('🚀 Inicializando sistema de hardware...');
      
      // 1. Initialize API client
      await this.initializeApiClient();
      
      // 2. Initialize performance optimizations first
      this.initializePerformanceOptimizations();
      
      // 3. Initialize core modules
      this.initializeModals();
      this.initializeNotifications();
      
      // 4. Initialize data management (depends on API client)
      this.initializeDataManagement();
      
      // 5. Initialize filters (depends on data)
      this.initializeFilters();
      
      // 6. Connect modules
      this.connectModules();
      
      // 7. Load initial data
      await this.loadInitialData();
      
      this.initialized = true;
      //////console.log('✅ Sistema de hardware inicializado correctamente');
      
    } catch (error) {
      ////console.error('💥 Error al inicializar sistema de hardware:', error);
      this.showFallbackError();
    }
  }

  /**
   * Initialize API client
   */
  async initializeApiClient() {
    try {
      ////console.log('🔗 Inicializando API client...');
      
      // Check if proxy is available
      const healthResponse = await fetch(this.buildApiUrl('/health'));
      
      if (healthResponse.ok) {
        this.apiClient = new EndpointTestClient();
        ////console.log('✅ API Client inicializado');
        
        // Make API client available to core module
        if (window.hardwareCore) {
          window.hardwareCore.apiClient = this.apiClient;
        }
        
        return true;
      } else {
        throw new Error('Proxy no disponible');
      }
    } catch (error) {
      ////console.error('❌ Error inicializando API client:', error);
      throw error;
    }
  }

  /**
   * Initialize performance optimizations
   */
  initializePerformanceOptimizations() {
    ////console.log('⚡ Configurando optimizaciones de rendimiento...');
    
    // Apply card optimizations to existing cards
    const existingCards = document.querySelectorAll('.ios-hardware-card');
    existingCards.forEach(card => {
      if (window.applyCardOptimizations) {
        window.applyCardOptimizations(card);
      }
    });
    
    // Detect low-end devices
    const isLowEndDevice = (
      navigator.hardwareConcurrency <= 2 ||
      navigator.deviceMemory <= 2 ||
      window.innerWidth <= 768
    );
    
    if (isLowEndDevice) {
      ////console.log('📱 Dispositivo de bajo rendimiento detectado');
      document.body.classList.add('low-end-device');
      
      // Disable heavy animations
      const allShimmers = document.querySelectorAll('.ios-card-shimmer, .ios-stat-shimmer');
      allShimmers.forEach(shimmer => {
        shimmer.style.display = 'none';
      });
    }
    
    // Set up mutation observer for new cards
    this.setupCardObserver();
    
    ////console.log('✅ Optimizaciones de rendimiento aplicadas');
  }

  /**
   * Setup mutation observer for dynamically added cards
   */
  setupCardObserver() {
    const hardwareGrid = document.getElementById('hardwareGrid');
    if (hardwareGrid) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList.contains('ios-hardware-card')) {
              ////console.log('👀 Nueva tarjeta detectada, aplicando optimizaciones...');
              if (window.applyCardOptimizations) {
                window.applyCardOptimizations(node);
              }
            }
          });
        });
      });
      
      observer.observe(hardwareGrid, {
        childList: true,
        subtree: true
      });
      
      ////console.log('👀 Observer configurado para nuevas tarjetas');
    }
  }

  /**
   * Initialize modals module
   */
  initializeModals() {
    ////console.log('🗨️ Inicializando sistema de modales...');
    
    // Create modals manager if not available
    if (!window.hardwareModals) {
      window.hardwareModals = {
        showClientUpdateModal: (message) => {
          ////console.log('📢 Client update:', message);
          // Basic implementation
          if (window.hardwareNotifications) {
            window.hardwareNotifications.show(message, 'success');
          }
        },
        closeToggleModal: () => {
          const modal = document.getElementById('toggleHardwareModal');
          if (modal) modal.classList.add('hidden');
        },
        closeUpdateModal: () => {
          const modal = document.getElementById('clientUpdateModal');
          if (modal) modal.classList.add('hidden');
        }
      };
    }
    
    // Initialize modal manager if available
    if (window.modalManager) {
      const modalIds = ['hardwareModal', 'viewHardwareModal', 'toggleHardwareModal', 'clientUpdateModal'];
      modalIds.forEach(modalId => {
        window.modalManager.setupModal(modalId);
        ////console.log(`✅ Modal ${modalId} configurado`);
      });
    }
    
    ////console.log('✅ Sistema de modales inicializado');
  }

  /**
   * Initialize notifications system
   */
  initializeNotifications() {
    ////console.log('📢 Inicializando sistema de notificaciones...');
    
    if (!window.hardwareNotifications) {
      window.hardwareNotifications = {
        show: (message, type = 'info') => {
          this.showEnhancedNotification(message, type);
        }
      };
    }
    
    ////console.log('✅ Sistema de notificaciones inicializado');
  }

  /**
   * Initialize data management
   */
  initializeDataManagement() {
    ////console.log('📊 Inicializando gestión de datos...');
    
    if (!window.hardwareData) {
      window.hardwareData = {
        loadHardware: () => this.loadHardware(),
        loadHardwareTypes: () => this.loadHardwareTypes(),
        loadEmpresas: () => this.loadEmpresas(),
        loadSedesByEmpresa: () => this.loadSedesByEmpresa()
      };
    }
    
    ////console.log('✅ Gestión de datos inicializada');
  }

  /**
   * Initialize filters system
   */
  initializeFilters() {
    ////console.log('🔍 Inicializando sistema de filtros...');
    
    // NO configurar event listeners - ya están en hardware.html
    // Solo hacer las funciones disponibles globalmente
    window.clearFilters = () => this.clearFilters();
    window.filterHardware = () => this.filterHardware();
    
    ////console.log('✅ Sistema de filtros inicializado');
  }

  /**
   * Connect modules together
   */
  connectModules() {
    ////console.log('🔗 Conectando módulos...');
    
    // Connect API client to core module
    if (window.hardwareCore && this.apiClient) {
      window.hardwareCore.apiClient = this.apiClient;
    }
    
    // Make API client available globally
    window.apiClient = this.apiClient;
    
    ////console.log('✅ Módulos conectados');
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    ////console.log('📥 Cargando datos iniciales...');
    
    try {
      // Load in parallel for better performance
      const promises = [
        this.loadHardwareTypes(),
        this.loadEmpresas(),
        this.loadHardware()
      ];
      
      await Promise.all(promises);
      
      ////console.log('✅ Datos iniciales cargados');
    } catch (error) {
      ////console.error('❌ Error cargando datos iniciales:', error);
      this.showEnhancedNotification('Error al cargar datos iniciales', 'error');
    }
  }

  /**
   * Load hardware list
   */
  async loadHardware() {
    if (this.isLoadingHardware) {
      ////console.warn('⚠️ loadHardware ya en progreso...');
      return;
    }
    
    this.isLoadingHardware = true;
    
    try {
      ////console.log('🔄 Cargando hardware específico para empresa...');
      
      // Obtener ID de empresa del contexto
      const empresaId = window.EMPRESA_ID || document.body.dataset.empresaId;
      if (!empresaId) {
        ////console.error('❌ No se encontró ID de empresa');
        this.renderHardware([]);
        return;
      }
      
      ////console.log('🏢 ID de empresa:', empresaId);
      
      const includeInactiveFilter = document.getElementById('includeInactiveFilter');
      const includeInactive = includeInactiveFilter ? includeInactiveFilter.value === 'all' : false;
      
      let response;
      // USAR ENDPOINTS ESPECÍFICOS DE EMPRESA - NO DE ADMIN
      if (includeInactive) {
        ////console.log('🌐 Usando endpoint de empresa con inactivos');
        response = await this.apiClient.get_hardware_by_empresa_including_inactive(empresaId);
      } else {
        ////console.log('🌐 Usando endpoint de empresa activos');
        response = await this.apiClient.get_hardware_by_empresa(empresaId);
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        ////console.log(`✅ Hardware cargado: ${data.data.length} elementos`);
        this.renderHardware(data.data);
        this.updateStats(data);
      } else {
        ////console.error('❌ Error en respuesta:', data.errors);
        this.renderHardware([]);
      }
    } catch (error) {
      ////console.error('💥 Error al cargar hardware:', error);
      this.renderHardware([]);
    } finally {
      this.isLoadingHardware = false;
    }
  }

  /**
   * Load hardware types
   */
  async loadHardwareTypes() {
    try {
      const response = await this.apiClient.get_hardware_types();
      const data = await response.json();
      
      if (data.success) {
        ////console.log('📋 Tipos de hardware cargados');
        this.populateTypeDropdowns(data.data);
      }
    } catch (error) {
      ////console.error('Error al cargar tipos de hardware:', error);
    }
  }

  /**
   * Load empresas
   */
  async loadEmpresas() {
    try {
      const response = await this.apiClient.get_empresas();
      const data = await response.json();
      
      if (data.success) {
        ////console.log('🏢 Empresas cargadas');
        window.empresas = data.data;
        this.populateEmpresaDropdown(data.data);
      }
    } catch (error) {
      ////console.error('Error al cargar empresas:', error);
    }
  }

  /**
   * Load sedes by empresa
   */
  loadSedesByEmpresa() {
    const empresaSelect = document.getElementById('hardwareEmpresa');
    const sedeSelect = document.getElementById('hardwareSede');
    
    if (!empresaSelect || !sedeSelect) {
      ////console.warn('⚠️ No se encontraron los elementos empresa o sede select');
      return;
    }
    
    const selectedEmpresaId = empresaSelect.value;
    ////console.log('🏢 Cargando sedes para empresa ID:', selectedEmpresaId);
    
    // Reset sede select
    sedeSelect.innerHTML = '<option value="">Seleccionar sede</option>';
    sedeSelect.disabled = true;
    
    if (!selectedEmpresaId) {
      ////console.log('🏢 No hay empresa seleccionada');
      return;
    }
    
    // Wait for empresas to be available
    if (!window.empresas || window.empresas.length === 0) {
      ////console.warn('⚠️ Lista de empresas no disponible, esperando...');
      setTimeout(() => this.loadSedesByEmpresa(), 100);
      return;
    }
    
    const selectedEmpresa = window.empresas.find(emp => emp._id === selectedEmpresaId);
    
    if (!selectedEmpresa) {
      ////console.error('❌ Empresa no encontrada en la lista:', selectedEmpresaId);
      ////console.error('❌ Empresas disponibles:', window.empresas.map(e => ({ id: e._id, nombre: e.nombre })));
      return;
    }
    
    ////console.log('✅ Empresa encontrada:', selectedEmpresa.nombre, 'con sedes:', selectedEmpresa.sedes);
    
    if (selectedEmpresa.sedes && Array.isArray(selectedEmpresa.sedes) && selectedEmpresa.sedes.length > 0) {
      selectedEmpresa.sedes.forEach(sede => {
        const option = document.createElement('option');
        option.value = sede;
        option.textContent = sede;
        sedeSelect.appendChild(option);
      });
      sedeSelect.disabled = false;
      ////console.log('✅ Sedes cargadas:', selectedEmpresa.sedes.length);
    } else {
      // Create default sede if none exist
      const defaultOption = document.createElement('option');
      defaultOption.value = 'Principal';
      defaultOption.textContent = 'Principal';
      sedeSelect.appendChild(defaultOption);
      sedeSelect.disabled = false;
      ////console.log('✅ Sede por defecto "Principal" añadida');
    }
  }

  /**
   * Render hardware list
   */
  renderHardware(hardwareList) {
    const gridContainer = document.getElementById('hardwareGrid');
    
    if (!gridContainer) {
      ////console.error('❌ Grid container no encontrado');
      return;
    }
    
    gridContainer.className = 'ios-hardware-grid';
    gridContainer.innerHTML = '';
    
    if (!hardwareList || hardwareList.length === 0) {
      this.showEmptyState(gridContainer);
      return;
    }
    
    hardwareList.forEach((hardware, index) => {
      try {
        const gridCard = this.createHardwareCard(hardware);
        if (gridCard) {
          gridCard.setAttribute('data-hardware-id', hardware._id);
          gridCard.className = 'ios-hardware-card hardware-item';
          gridContainer.appendChild(gridCard);
        }
      } catch (error) {
        ////console.error(`Error renderizando hardware ${index + 1}:`, error);
      }
    });
    
    // IMPORTANT: Apply filter after rendering to ensure cards are visible
    // This fixes the issue where cards are created but not visible until user interacts with filters
    setTimeout(() => {
      this.filterHardware();
    }, 50);
  }

  /**
   * Show empty state
   */
  showEmptyState(container) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'col-span-full text-center py-8';
    emptyMessage.innerHTML = `
      <div class="text-center">
        <i class="fas fa-box-open text-4xl mb-4 text-gray-400"></i>
        <h2 class="text-2xl font-bold text-white mb-2">No hay hardware disponible</h2>
        <p class="text-sm text-gray-400">Haz clic en "Nuevo Hardware" para agregar uno.</p>
      </div>
    `;
    container.appendChild(emptyMessage);
  }

  /**
   * Helper function to escape quotes in URLs
   */
  escapeQuotes(str) {
    if (!str) return '';
    return str.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  }

  /**
   * Create hardware card
   */
  createHardwareCard(hardware) {
    const div = document.createElement('div');
    div.className = 'ios-hardware-card hardware-item';
    
    const datos = hardware.datos?.datos || hardware.datos || {};
    const status = datos.status || 'available';
    const stock = datos.stock || 0;

    const physicalStatusRaw = hardware.physical_status ||
      hardware.physicalStatus ||
      hardware.estado_fisico ||
      datos.physical_status ||
      datos.physicalStatus ||
      datos.estado_fisico ||
      hardware.datos?.physical_status ||
      hardware.datos?.datos?.physical_status;
    let physicalStatus = physicalStatusRaw;
    if (typeof physicalStatus === 'string') {
      try {
        physicalStatus = JSON.parse(physicalStatus);
      } catch (e) {
        physicalStatus = null;
      }
    }
    let physicalEstado = null;
    if (physicalStatus && typeof physicalStatus === 'object') {
      if (physicalStatus.estado !== undefined) {
        physicalEstado = physicalStatus.estado;
      } else if (physicalStatus.status !== undefined) {
        physicalEstado = physicalStatus.status;
      } else {
        const estadoKey = Object.keys(physicalStatus).find(key => key.toLowerCase() === 'estado');
        if (estadoKey) {
          physicalEstado = physicalStatus[estadoKey];
        }
      }
    }
    let physicalEstadoNormalized = physicalEstado ? String(physicalEstado).trim().toLowerCase() : '';
    if (!physicalEstadoNormalized && physicalStatus && typeof physicalStatus === 'object') {
      const match = Object.values(physicalStatus).find(value =>
        typeof value === 'string' && value.trim().toLowerCase() === 'inactivo'
      );
      physicalEstadoNormalized = match ? 'inactivo' : '';
    }
    const isInactive = physicalEstadoNormalized === 'inactivo' || physicalEstadoNormalized === 'inactive' || hardware.activa === false;
    if (isInactive) {
      div.classList.add('hardware-physical-inactive');
      div.style.cssText += 'background: rgba(239, 68, 68, 0.38) !important; border: 1px solid rgba(239, 68, 68, 0.6) !important; box-shadow: 0 12px 32px rgba(239, 68, 68, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.45) !important;';
    }
    
    // Set data attributes for filtering
    div.setAttribute('data-type', hardware.tipo || '');
    div.setAttribute('data-status', status);
    div.setAttribute('data-name', (hardware.nombre || '').toLowerCase());
    div.setAttribute('data-brand', (datos.brand || '').toLowerCase());
    div.setAttribute('data-model', (datos.model || '').toLowerCase());
    div.setAttribute('data-sede', (hardware.sede || '').toLowerCase());
    div.setAttribute('data-stock', stock);
    div.setAttribute('data-activa', hardware.activa !== false ? 'true' : 'false');
    
    // Debug: Check if hardware has location URLs
    if (hardware.direccion_url && hardware.direccion_url.trim() !== '') {
      ////console.log('🗺️ Hardware con Google Maps:', hardware.nombre, 'URL:', hardware.direccion_url);
    }
    if (hardware.direccion_open_maps && hardware.direccion_open_maps.trim() !== '') {
      ////console.log('🗺️ Hardware con OpenStreetMap:', hardware.nombre, 'URL:', hardware.direccion_open_maps);
    }
    
    // Determine status display
    let statusClass = 'ios-status-available';
    let statusText = 'Disponible';
    
    if (physicalEstadoNormalized === 'inactivo' || physicalEstadoNormalized === 'inactive') {
      statusClass = 'ios-status-discontinued';
      statusText = 'Inactivo';
    } else if (stock === 0 || status === 'out_of_stock') {
      statusClass = 'ios-status-stock';
      statusText = 'Sin Stock';
    } else if (status === 'discontinued') {
      statusClass = 'ios-status-discontinued';
      statusText = 'Descontinuado';
    } else if (!hardware.activa) {
      statusClass = 'ios-status-discontinued';
      statusText = 'Inactivo';
    }
    
    const inactiveTextStyle = isInactive ? 'color: #ffffff !important;' : '';

    div.innerHTML = `
      <div class="ios-card-header">
        <div class="ios-card-icon">
          <i class="fas fa-microchip"></i>
        </div>
        <span class="ios-status-badge ${statusClass}" style="${inactiveTextStyle}">
          ${statusText}
        </span>
      </div>
      
      <h3 class="ios-card-title" style="${inactiveTextStyle}">${hardware.nombre || 'Sin nombre'}</h3>
      <p class="ios-card-subtitle" style="${inactiveTextStyle}">${datos.brand || 'N/A'} • ${datos.model || 'N/A'}</p>
      
      <div class="ios-card-info">
        <div class="ios-info-item">
          <span class="ios-info-label" style="${inactiveTextStyle}">Precio</span>
          <span class="ios-info-value" style="${inactiveTextStyle}">$${datos.price || 0}</span>
        </div>
        <div class="ios-info-item">
          <span class="ios-info-label" style="${inactiveTextStyle}">Stock</span>
          <span class="ios-info-value" style="${inactiveTextStyle}">${stock}</span>
        </div>
        <div class="ios-info-item">
          <span class="ios-info-label" style="${inactiveTextStyle}">Tipo</span>
          <span class="ios-info-value" style="${inactiveTextStyle}">${hardware.tipo || 'N/A'}</span>
        </div>
        <div class="ios-info-item">
          <span class="ios-info-label" style="${inactiveTextStyle}">Estado</span>
          <span class="ios-info-value" style="${inactiveTextStyle}">${hardware.activa ? 'Activo' : 'Inactivo'}</span>
        </div>
      </div>
      
      <div class="ios-card-actions">
        <button class="ios-card-btn" onclick="viewHardware('${hardware._id}')" title="Ver detalles">
          <i class="fas fa-eye"></i>
        </button>
        ${window.currentUser?.role !== 'empresa' ? `
        <button class="ios-card-btn ios-card-btn-primary" onclick="editHardware('${hardware._id}')" title="Editar">
          <i class="fas fa-edit"></i>
        </button>` : ''}
        ${window.currentUser?.role !== 'empresa' ? `
        <button class="ios-card-btn ${hardware.activa ? 'ios-card-btn-warning' : 'ios-card-btn-success'}" 
                onclick="toggleHardwareStatus('${hardware._id}', ${!hardware.activa})" 
                title="${hardware.activa ? 'Desactivar' : 'Activar'}">
          <i class="fas ${hardware.activa ? 'fa-power-off' : 'fa-play'}"></i>
        </button>` : ''}
        ${hardware.direccion_url && hardware.direccion_url.trim() !== '' ? 
          `<button class="ios-card-btn" onclick="openLocationModalFromCard('${hardware._id}', '${this.escapeQuotes(hardware.direccion_url)}')" title="Ver ubicación">
            <i class="fas fa-map-location-dot"></i>
          </button>` : ''
        }
      </div>
      
      <div class="ios-card-shimmer"></div>
    `;
    
    
    // Apply card optimizations
    if (window.applyCardOptimizations) {
      window.applyCardOptimizations(div);
    }
    
    return div;
  }

  /**
   * Update stats
   */
  updateStats(data) {
    if (data.count !== undefined) {
      const totalElement = document.getElementById('totalItemsCount');
      if (totalElement) totalElement.textContent = data.count;
    }
    
    if (data.data && Array.isArray(data.data)) {
      const hardwareList = data.data;
      let availableCount = 0;
      let outOfStockCount = 0;
      let totalValue = 0;
      
      hardwareList.forEach(hardware => {
        const datos = hardware.datos?.datos || hardware.datos || {};
        const stock = datos.stock || 0;
        const price = datos.price || 0;
        const status = datos.status || 'available';
        
        if (hardware.activa && stock > 0 && status !== 'discontinued') {
          availableCount++;
        } else if (stock === 0 || status === 'out_of_stock') {
          outOfStockCount++;
        }
        
        totalValue += price * stock;
      });
      
      const availableElement = document.getElementById('availableItemsCount');
      const outOfStockElement = document.getElementById('outOfStockCount');
      const totalValueElement = document.getElementById('totalValueCount');
      
      if (availableElement) availableElement.textContent = availableCount;
      if (outOfStockElement) outOfStockElement.textContent = outOfStockCount;
      if (totalValueElement) {
        totalValueElement.textContent = `$${totalValue.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
      }
    }
  }

  /**
   * Filter hardware
   */
  filterHardware() {
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (!searchInput || !typeFilter || !statusFilter) return;
    
    const search = searchInput.value.toLowerCase();
    const type = typeFilter.value;
    const status = statusFilter.value;
    
    const gridItems = document.querySelectorAll('.hardware-item');
    let visibleCount = 0;
    
    gridItems.forEach(item => {
      const name = item.dataset.name || '';
      const itemType = item.dataset.type || '';
      const itemStatus = item.dataset.status || '';
      const stock = parseInt(item.dataset.stock || '0');
      const activa = item.dataset.activa === 'true';
      const brand = item.dataset.brand || '';
      const model = item.dataset.model || '';
      const sede = item.dataset.sede || '';
      
      const matchesSearch = !search || 
        name.includes(search) || 
        itemType.toLowerCase().includes(search) ||
        brand.includes(search) ||
        model.includes(search) ||
        sede.includes(search);
      
      const matchesType = !type || itemType === type;
      
      let matchesStatus = true;
      if (status) {
        switch (status) {
          case 'available':
            matchesStatus = activa && stock > 0 && itemStatus !== 'discontinued';
            break;
          case 'out_of_stock':
            matchesStatus = stock === 0 || itemStatus === 'out_of_stock';
            break;
          case 'discontinued':
            matchesStatus = itemStatus === 'discontinued';
            break;
          case 'inactive':
            matchesStatus = !activa;
            break;
        }
      }
      
      if (matchesSearch && matchesType && matchesStatus) {
        item.style.display = '';
        item.classList.remove('hidden');
        visibleCount++;
      } else {
        item.style.display = 'none';
        item.classList.add('hidden');
      }
    });
    
    this.showFilterEmptyMessage(visibleCount);
  }

  /**
   * Show filter empty message
   */
  showFilterEmptyMessage(visibleCount) {
    const hasFilters = document.getElementById('searchInput').value || 
                      document.getElementById('typeFilter').value || 
                      document.getElementById('statusFilter').value;
    
    const existingMessage = document.getElementById('filterEmptyMessage');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    if (hasFilters && visibleCount === 0) {
      const gridContainer = document.getElementById('hardwareGrid');
      const emptyMessage = document.createElement('div');
      emptyMessage.id = 'filterEmptyMessage';
      emptyMessage.className = 'col-span-full text-center py-8';
      emptyMessage.innerHTML = `
        <div class="text-center">
          <i class="fas fa-search text-4xl mb-4 text-gray-400"></i>
          <h2 class="text-2xl font-bold text-white mb-2">No se encontró hardware con este filtro</h2>
          <p class="text-sm text-gray-400">Prueba ajustando los criterios de búsqueda.</p>
          <button onclick="clearFilters()" class="mt-4 ios-action-btn">
            <i class="fas fa-filter-circle-xmark"></i>
            Limpiar Filtros
          </button>
        </div>
      `;
      gridContainer.appendChild(emptyMessage);
    }
  }

  /**
   * Clear filters
   */
  clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('includeInactiveFilter').value = 'active';
    
    const filterEmptyMessage = document.getElementById('filterEmptyMessage');
    if (filterEmptyMessage) {
      filterEmptyMessage.remove();
    }
    
    // NO recargar hardware - solo mostrar todos los elementos existentes
    const allItems = document.querySelectorAll('.hardware-item');
    allItems.forEach(item => {
      item.style.display = '';
      item.classList.remove('hidden');
    });
    
    ////console.log('🧹 Filtros limpiados sin recargar hardware');
  }

  /**
   * Populate type dropdowns
   */
  populateTypeDropdowns(types) {
    const typeSelect = document.getElementById('hardwareType');
    const filterSelect = document.getElementById('typeFilter');
    
    if (typeSelect) {
      typeSelect.innerHTML = '<option value="">Seleccionar tipo</option>';
      types.forEach(type => {
        const option = document.createElement('option');
        option.value = type.nombre;
        option.textContent = type.nombre;
        typeSelect.appendChild(option);
      });
    }
    
    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">Todos los tipos</option>';
      types.forEach(type => {
        const option = document.createElement('option');
        option.value = type.nombre;
        option.textContent = type.nombre;
        filterSelect.appendChild(option);
      });
    }
  }

  /**
   * Populate empresa dropdown
   */
  populateEmpresaDropdown(empresas) {
    const empresaSelect = document.getElementById('hardwareEmpresa');
    
    if (!empresaSelect) {
      ////console.warn('⚠️ No se encontró el elemento hardwareEmpresa select');
      return;
    }
    
    ////console.log('🏢 Poblando dropdown de empresas con', empresas.length, 'empresas');
    
    empresaSelect.innerHTML = '<option value="">Seleccionar empresa</option>';
    
    empresas.forEach(empresa => {
      const option = document.createElement('option');
      option.value = empresa._id;
      option.textContent = empresa.nombre;
      // Ensure the dataset.nombre is properly set
      option.dataset.nombre = empresa.nombre;
      empresaSelect.appendChild(option);
    });
    
    ////console.log('✅ Dropdown de empresas poblado exitosamente');
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
        <span>Error al inicializar el sistema de hardware</span>
      </div>
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

// Initialize hardware system
const hardwareMain = new HardwareMain();

// Export for debugging
window.hardwareMain = hardwareMain;

// Backward compatibility functions
window.toggleHardwareStatus = (id, activa) => {
  if (window.currentUser?.role === 'empresa') {
    return;
  }
  if (window.hardwareModals && window.hardwareModals.showToggleModal) {
    window.hardwareModals.showToggleModal(id, activa);
  } else {
    ////console.warn('Toggle modal not available');
  }
};

// Global function for loading sedes - called from HTML onchange
window.loadSedesByEmpresa = () => {
  if (hardwareMain) {
    hardwareMain.loadSedesByEmpresa();
  } else {
    ////console.warn('Hardware main not available for loadSedesByEmpresa');
  }
};

////console.log('🏗️ Hardware main module loaded');
