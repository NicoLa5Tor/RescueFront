/**
 * ===== EMPRESAS MODALS FUNCTIONALITY =====
 * 
 * Este archivo contiene la funcionalidad para todos los modales de empresas:
 * - Modal de crear empresa
 * - Modal de editar empresa
 * - Modal de ver detalles
 * - Modal de confirmar toggle status
 * - Modal de confirmaciones y success
 */

class EmpresasModals {
  constructor() {
    this.currentEditingEmpresa = null;
    this.currentViewingEmpresa = null;
    this.apiClient = null;
    this.sedes = [];
    
    this.initializeModals();
  }

  /**
   * Initialize modal system
   */
  initializeModals() {
    try {
      // Setup API client
      this.setupApiClient();
      
      // Create modal HTML structures
      this.createModalStructures();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('🏢 Modales de empresas inicializados correctamente');
      
    } catch (error) {
      console.error('💥 Error al inicializar modales de empresas:', error);
    }
  }

  /**
   * Setup API client
   */
  setupApiClient() {
    if (window.empresasMain && window.empresasMain.apiClient) {
      this.apiClient = window.empresasMain.apiClient;
    } else if (window.apiClient) {
      this.apiClient = window.apiClient;
    } else if (typeof EndpointTestClient !== 'undefined') {
      this.apiClient = new EndpointTestClient('/proxy');
    } else {
      this.apiClient = this.createBasicApiClient();
    }
  }

  /**
   * Create basic API client fallback
   */
  createBasicApiClient() {
    return {
      get_empresas_dashboard: () => fetch('/proxy/api/empresas/dashboard/all'),
      get_empresas: () => fetch('/proxy/api/empresas'),
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
   * Create modal HTML structures
   */
  createModalStructures() {
    this.createToggleModal();
    this.createCrudModal();
    this.createViewModal();
    this.createSuccessModal();
  }

  /**
   * Create toggle status modal
   */
  createToggleModal() {
    const modalHTML = `
      <div id="toggleEmpresaModal" class="toggle-empresa-backdrop hidden">
        <div class="toggle-empresa-container">
          <div id="toggleEmpresaIcon" class="toggle-empresa-icon">
            <i class="fas fa-power-off"></i>
          </div>
          <h2 id="toggleEmpresaTitle" class="toggle-empresa-title">Cambiar Estado</h2>
          <p id="toggleEmpresaMessage" class="toggle-empresa-message">
            ¿Estás seguro de que quieres cambiar el estado de esta empresa?
          </p>
          <div class="toggle-empresa-buttons">
            <button id="toggleEmpresaConfirm" class="toggle-empresa-btn toggle-empresa-btn-confirm">
              <i class="fas fa-check"></i>
              Confirmar
            </button>
            <button id="toggleEmpresaCancel" class="toggle-empresa-btn toggle-empresa-btn-cancel">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Create CRUD modal (create/edit)
   */
  createCrudModal() {
    const modalHTML = `
      <div id="empresaModal" class="empresa-modal-backdrop hidden">
        <div class="empresa-modal-container">
          <div class="empresa-modal-header">
            <h2 id="empresaModalTitle" class="empresa-modal-title">
              <i class="fas fa-building"></i>
              Nueva Empresa
            </h2>
            <button class="empresa-modal-close" onclick="empresasModals.closeCrudModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="empresa-modal-body">
            <form id="empresaForm" class="empresa-form-grid">
              <div class="empresa-form-row">
                <div class="empresa-form-group">
                  <label class="empresa-form-label">
                    <i class="fas fa-building"></i>
                    Nombre de la Empresa *
                  </label>
                  <input type="text" id="empresaNombre" class="empresa-form-input" placeholder="Ej: Acme Corporation" required>
                </div>
                <div class="empresa-form-group">
                  <label class="empresa-form-label">
                    <i class="fas fa-user"></i>
                    Nombre de Usuario *
                  </label>
                  <input type="text" id="empresaUsername" class="empresa-form-input" placeholder="Ej: acme_corp" required>
                </div>
              </div>
              
              <div class="empresa-form-row">
                <div class="empresa-form-group">
                  <label class="empresa-form-label">
                    <i class="fas fa-envelope"></i>
                    Email *
                  </label>
                  <input type="email" id="empresaEmail" class="empresa-form-input" placeholder="contacto@empresa.com" required>
                </div>
                <div class="empresa-form-group">
                  <label class="empresa-form-label">
                    <i class="fas fa-map-marker-alt"></i>
                    Ubicación *
                  </label>
                  <input type="text" id="empresaUbicacion" class="empresa-form-input" placeholder="Ciudad, País" required>
                </div>
              </div>
              
              <div class="empresa-form-group">
                <label class="empresa-form-label">
                  <i class="fas fa-align-left"></i>
                  Descripción *
                </label>
                <textarea id="empresaDescripcion" class="empresa-form-textarea" placeholder="Descripción de la empresa..." required></textarea>
              </div>
              
              <div class="empresa-form-group" id="passwordGroup">
                <label class="empresa-form-label">
                  <i class="fas fa-lock"></i>
                  Contraseña *
                </label>
                <input type="password" id="empresaPassword" class="empresa-form-input" placeholder="Contraseña segura" required>
              </div>
              
              <div class="empresa-form-group">
                <label class="empresa-form-label">
                  <i class="fas fa-building"></i>
                  Sedes
                </label>
                <div id="empresaSedesContainer" class="empresa-sedes-container">
                  <div id="sedesList"></div>
                  <button type="button" class="empresa-sede-add" onclick="empresasModals.addSede()">
                    <i class="fas fa-plus"></i>
                    Agregar Sede
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          <div class="empresa-modal-footer">
            <button type="button" class="empresa-btn empresa-btn-secondary" onclick="empresasModals.closeCrudModal()">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
            <button type="submit" form="empresaForm" id="empresaSubmitBtn" class="empresa-btn empresa-btn-primary">
              <i class="fas fa-save"></i>
              Guardar Empresa
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Create view modal
   */
  createViewModal() {
    const modalHTML = `
      <div id="viewEmpresaModal" class="view-empresa-backdrop hidden">
        <div class="view-empresa-container">
          <div class="view-empresa-header">
            <div id="viewEmpresaAvatar" class="view-empresa-avatar">
              <i class="fas fa-building"></i>
            </div>
            <h2 id="viewEmpresaName" class="view-empresa-name">Nombre Empresa</h2>
            <p id="viewEmpresaLocation" class="view-empresa-location">Ubicación</p>
          </div>
          
          <div class="view-empresa-details">
            <div class="view-empresa-detail">
              <span class="view-empresa-detail-label">Email:</span>
              <span id="viewEmpresaEmail" class="view-empresa-detail-value">N/A</span>
            </div>
            <div class="view-empresa-detail">
              <span class="view-empresa-detail-label">Usuario:</span>
              <span id="viewEmpresaUsername" class="view-empresa-detail-value">N/A</span>
            </div>
            <div class="view-empresa-detail">
              <span class="view-empresa-detail-label">Estado:</span>
              <span id="viewEmpresaEstado" class="view-empresa-detail-value">N/A</span>
            </div>
            <div class="view-empresa-detail">
              <span class="view-empresa-detail-label">Creada:</span>
              <span id="viewEmpresaCreated" class="view-empresa-detail-value">N/A</span>
            </div>
            <div class="view-empresa-detail">
              <span class="view-empresa-detail-label">Descripción:</span>
              <span id="viewEmpresaDescripcion" class="view-empresa-detail-value">N/A</span>
            </div>
          </div>
          
          <div class="view-empresa-sedes">
            <div class="view-empresa-sedes-title">Sedes:</div>
            <div id="viewEmpresaSedesList" class="view-empresa-sedes-list">
              <!-- Sedes will be added here -->
            </div>
          </div>
          
          <div class="empresa-modal-footer">
            <button type="button" class="empresa-btn empresa-btn-secondary" onclick="empresasModals.closeViewModal()">
              <i class="fas fa-times"></i>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Create success modal
   */
  createSuccessModal() {
    const modalHTML = `
      <div id="empresaSuccessModal" class="empresa-success-backdrop hidden">
        <div class="empresa-success-container">
          <div class="empresa-success-icon">
            <i class="fas fa-check"></i>
          </div>
          <h2 class="empresa-success-title">¡Operación Exitosa!</h2>
          <p id="empresaSuccessMessage" class="empresa-success-message">
            La operación se completó correctamente.
          </p>
          <button class="empresa-success-button" onclick="empresasModals.closeSuccessModal()">
            <i class="fas fa-check"></i>
            Entendido
          </button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Form submission
    const form = document.getElementById('empresaForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Toggle modal buttons
    const confirmBtn = document.getElementById('toggleEmpresaConfirm');
    const cancelBtn = document.getElementById('toggleEmpresaCancel');
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => this.confirmToggleStatus());
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeToggleModal());
    }

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeActiveModal();
      }
    });

    // Click outside to close
    this.setupOutsideClickClose();
  }

  /**
   * Setup outside click to close modals
   */
  setupOutsideClickClose() {
    const modals = ['toggleEmpresaModal', 'empresaModal', 'viewEmpresaModal'];
    
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModalById(modalId);
          }
        });
      }
    });
  }

  /**
   * Show toggle status modal
   */
  showToggleModal(empresaId, newStatus) {
    try {
      this.currentToggleEmpresa = { id: empresaId, newStatus };
      
      const modal = document.getElementById('toggleEmpresaModal');
      const icon = document.getElementById('toggleEmpresaIcon');
      const title = document.getElementById('toggleEmpresaTitle');
      const message = document.getElementById('toggleEmpresaMessage');
      
      if (newStatus) {
        // Activating
        icon.className = 'toggle-empresa-icon activate';
        icon.innerHTML = '<i class="fas fa-check-circle"></i>';
        title.textContent = 'Activar Empresa';
        message.textContent = '¿Estás seguro de que quieres activar esta empresa? Podrá acceder al sistema nuevamente.';
      } else {
        // Deactivating
        icon.className = 'toggle-empresa-icon deactivate';
        icon.innerHTML = '<i class="fas fa-times-circle"></i>';
        title.textContent = 'Desactivar Empresa';
        message.textContent = '¿Estás seguro de que quieres desactivar esta empresa? No podrá acceder al sistema.';
      }
      
      this.openModal(modal);
      
    } catch (error) {
      console.error('💥 Error al mostrar modal de toggle:', error);
      this.showNotification('Error al abrir el modal', 'error');
    }
  }

  /**
   * Confirm toggle status
   */
  async confirmToggleStatus() {
    try {
      if (!this.currentToggleEmpresa) return;
      
      const { id, newStatus } = this.currentToggleEmpresa;
      
      console.log(`🔄 Cambiando estado de empresa ${id} a ${newStatus ? 'activa' : 'inactiva'}`);
      
      const response = await this.apiClient.toggle_empresa_status(id, newStatus);
      const data = await response.json();
      
      if (data.success) {
        this.closeToggleModal();
        this.showSuccessModal(data.message || `Empresa ${newStatus ? 'activada' : 'desactivada'} exitosamente`);
        
        // Reload empresas list
        if (window.empresasMain) {
          setTimeout(() => window.empresasMain.loadEmpresas(), 1000);
        }
      } else {
        this.showNotification('Error: ' + (data.errors?.[0] || 'Error desconocido'), 'error');
      }
      
    } catch (error) {
      console.error('💥 Error al cambiar estado de empresa:', error);
      this.showNotification('Error de conexión', 'error');
    }
  }

  /**
   * Open create modal
   */
  openCreateModal() {
    try {
      this.currentEditingEmpresa = null;
      
      // Set modal title and button text
      document.getElementById('empresaModalTitle').innerHTML = '<i class="fas fa-plus"></i> Nueva Empresa';
      document.getElementById('empresaSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Crear Empresa';
      
      // Reset form
      this.resetForm();
      
      // Show password field for create
      document.getElementById('passwordGroup').style.display = 'block';
      document.getElementById('empresaPassword').required = true;
      
      // Open modal
      const modal = document.getElementById('empresaModal');
      this.openModal(modal);
      
    } catch (error) {
      console.error('💥 Error al abrir modal de creación:', error);
      this.showNotification('Error al abrir el modal', 'error');
    }
  }

  /**
   * Open edit modal
   */
  async openEditModal(empresaId) {
    try {
      this.currentEditingEmpresa = empresaId;
      
      // Set modal title and button text
      document.getElementById('empresaModalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Empresa';
      document.getElementById('empresaSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Actualizar Empresa';
      
      // Hide password field for edit
      document.getElementById('passwordGroup').style.display = 'none';
      document.getElementById('empresaPassword').required = false;
      
      // Load empresa data
      await this.loadEmpresaDataForEdit(empresaId);
      
      // Open modal
      const modal = document.getElementById('empresaModal');
      this.openModal(modal);
      
    } catch (error) {
      console.error('💥 Error al abrir modal de edición:', error);
      this.showNotification('Error al cargar los datos de la empresa', 'error');
    }
  }

  /**
   * Load empresa data for editing
   */
  async loadEmpresaDataForEdit(empresaId) {
    try {
      const response = await this.apiClient.get_empresa(empresaId);
      const data = await response.json();
      
      if (data.success && data.data) {
        this.populateFormWithEmpresaData(data.data);
      } else {
        throw new Error(data.errors?.[0] || 'Error al cargar datos');
      }
      
    } catch (error) {
      console.error('💥 Error al cargar datos de empresa:', error);
      this.loadDummyDataIntoForm();
    }
  }

  /**
   * Populate form with empresa data
   */
  populateFormWithEmpresaData(empresa) {
    document.getElementById('empresaNombre').value = empresa.nombre || '';
    document.getElementById('empresaUsername').value = empresa.username || '';
    document.getElementById('empresaEmail').value = empresa.email || '';
    document.getElementById('empresaUbicacion').value = empresa.ubicacion || '';
    document.getElementById('empresaDescripcion').value = empresa.descripcion || '';
    
    // Load sedes
    this.sedes = empresa.sedes || ['Principal'];
    this.renderSedes();
  }

  /**
   * Load dummy data into form (fallback)
   */
  loadDummyDataIntoForm() {
    document.getElementById('empresaNombre').value = 'Empresa sin nombre';
    document.getElementById('empresaUsername').value = 'empresa_usuario';
    document.getElementById('empresaEmail').value = 'contacto@empresa.com';
    document.getElementById('empresaUbicacion').value = 'Ciudad, País';
    document.getElementById('empresaDescripcion').value = 'Descripción de la empresa';
    
    this.sedes = ['Principal'];
    this.renderSedes();
  }

  /**
   * Open view modal
   */
  async openViewModal(empresaId) {
    try {
      this.currentViewingEmpresa = empresaId;
      
      // Load empresa data
      const response = await this.apiClient.get_empresa(empresaId);
      const data = await response.json();
      
      if (data.success && data.data) {
        this.populateViewModal(data.data);
        
        const modal = document.getElementById('viewEmpresaModal');
        this.openModal(modal);
      } else {
        throw new Error(data.errors?.[0] || 'Error al cargar datos');
      }
      
    } catch (error) {
      console.error('💥 Error al cargar detalles de empresa:', error);
      this.showNotification('Error al cargar los detalles de la empresa', 'error');
    }
  }

  /**
   * Populate view modal with empresa data
   */
  populateViewModal(empresa) {
    const iniciales = this.getIniciales(empresa.nombre);
    
    document.getElementById('viewEmpresaAvatar').textContent = iniciales;
    document.getElementById('viewEmpresaName').textContent = empresa.nombre || 'Sin nombre';
    document.getElementById('viewEmpresaLocation').textContent = empresa.ubicacion || 'Sin ubicación';
    document.getElementById('viewEmpresaEmail').textContent = empresa.email || 'N/A';
    document.getElementById('viewEmpresaUsername').textContent = empresa.username || 'N/A';
    document.getElementById('viewEmpresaEstado').textContent = empresa.activa !== false ? 'Activa' : 'Inactiva';
    document.getElementById('viewEmpresaCreated').textContent = this.formatDate(empresa.fecha_creacion);
    document.getElementById('viewEmpresaDescripcion').textContent = empresa.descripcion || 'Sin descripción';
    
    // Render sedes
    const sedesList = document.getElementById('viewEmpresaSedesList');
    sedesList.innerHTML = '';
    
    if (empresa.sedes && empresa.sedes.length > 0) {
      empresa.sedes.forEach(sede => {
        const tag = document.createElement('span');
        tag.className = 'view-empresa-sede-tag';
        tag.textContent = sede;
        sedesList.appendChild(tag);
      });
    } else {
      sedesList.innerHTML = '<span class="view-empresa-sede-tag">Sin sedes</span>';
    }
  }

  /**
   * Handle form submission
   */
  async handleFormSubmit(e) {
    e.preventDefault();
    
    try {
      const formData = this.buildFormData();
      
      if (this.currentEditingEmpresa) {
        await this.updateEmpresa(this.currentEditingEmpresa, formData);
      } else {
        await this.createEmpresa(formData);
      }
      
    } catch (error) {
      console.error('💥 Error al procesar formulario:', error);
      this.showNotification('Error al procesar el formulario', 'error');
    }
  }

  /**
   * Build form data object
   */
  buildFormData() {
    const formData = {
      nombre: document.getElementById('empresaNombre').value.trim(),
      username: document.getElementById('empresaUsername').value.trim(),
      email: document.getElementById('empresaEmail').value.trim(),
      ubicacion: document.getElementById('empresaUbicacion').value.trim(),
      descripcion: document.getElementById('empresaDescripcion').value.trim(),
      sedes: this.sedes.filter(sede => sede.trim() !== '')
    };
    
    // Add password for create
    if (!this.currentEditingEmpresa) {
      formData.password = document.getElementById('empresaPassword').value;
    }
    
    return formData;
  }

  /**
   * Create empresa
   */
  async createEmpresa(formData) {
    try {
      const response = await this.apiClient.create_empresa(formData);
      const data = await response.json();
      
      if (data.success) {
        this.closeCrudModal();
        this.showSuccessModal('Empresa creada exitosamente');
        
        // Reload empresas list
        if (window.empresasMain) {
          setTimeout(() => window.empresasMain.loadEmpresas(), 1000);
        }
      } else {
        this.showNotification('Error: ' + (data.errors?.[0] || 'Error desconocido'), 'error');
      }
      
    } catch (error) {
      console.error('💥 Error al crear empresa:', error);
      this.showNotification('Error de conexión', 'error');
    }
  }

  /**
   * Update empresa
   */
  async updateEmpresa(empresaId, formData) {
    try {
      const response = await this.apiClient.update_empresa(empresaId, formData);
      const data = await response.json();
      
      if (data.success) {
        this.closeCrudModal();
        this.showSuccessModal('Empresa actualizada exitosamente');
        
        // Reload empresas list
        if (window.empresasMain) {
          setTimeout(() => window.empresasMain.loadEmpresas(), 1000);
        }
      } else {
        this.showNotification('Error: ' + (data.errors?.[0] || 'Error desconocido'), 'error');
      }
      
    } catch (error) {
      console.error('💥 Error al actualizar empresa:', error);
      this.showNotification('Error de conexión', 'error');
    }
  }

  /**
   * Sede management
   */
  addSede() {
    this.sedes.push('');
    this.renderSedes();
    
    // Focus on the new input
    setTimeout(() => {
      const inputs = document.querySelectorAll('.empresa-sede-input');
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) lastInput.focus();
    }, 100);
  }

  removeSede(index) {
    this.sedes.splice(index, 1);
    this.renderSedes();
  }

  updateSede(index, value) {
    this.sedes[index] = value;
  }

  renderSedes() {
    const container = document.getElementById('sedesList');
    container.innerHTML = '';
    
    this.sedes.forEach((sede, index) => {
      const sedeItem = document.createElement('div');
      sedeItem.className = 'empresa-sede-item';
      sedeItem.innerHTML = `
        <input type="text" class="empresa-sede-input" value="${sede}" 
               placeholder="Nombre de la sede" 
               onchange="empresasModals.updateSede(${index}, this.value)">
        <button type="button" class="empresa-sede-remove" onclick="empresasModals.removeSede(${index})">
          <i class="fas fa-trash"></i>
        </button>
      `;
      container.appendChild(sedeItem);
    });
  }

  /**
   * Modal management
   */
  openModal(modal) {
    modal.classList.remove('hidden');
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Focus first input
    setTimeout(() => {
      const firstInput = modal.querySelector('input, textarea, select');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  closeActiveModal() {
    const modals = ['toggleEmpresaModal', 'empresaModal', 'viewEmpresaModal', 'empresaSuccessModal'];
    
    for (const modalId of modals) {
      const modal = document.getElementById(modalId);
      if (modal && !modal.classList.contains('hidden')) {
        this.closeModalById(modalId);
        break;
      }
    }
  }

  closeModalById(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
    
    // Reset current data
    if (modalId === 'empresaModal') {
      this.currentEditingEmpresa = null;
    } else if (modalId === 'viewEmpresaModal') {
      this.currentViewingEmpresa = null;
    } else if (modalId === 'toggleEmpresaModal') {
      this.currentToggleEmpresa = null;
    }
  }

  closeCrudModal() {
    this.closeModalById('empresaModal');
    this.resetForm();
  }

  closeViewModal() {
    this.closeModalById('viewEmpresaModal');
  }

  closeToggleModal() {
    this.closeModalById('toggleEmpresaModal');
  }

  closeSuccessModal() {
    this.closeModalById('empresaSuccessModal');
  }

  /**
   * Show success modal
   */
  showSuccessModal(message) {
    document.getElementById('empresaSuccessMessage').textContent = message;
    const modal = document.getElementById('empresaSuccessModal');
    this.openModal(modal);
  }

  /**
   * Reset form
   */
  resetForm() {
    const form = document.getElementById('empresaForm');
    if (form) {
      form.reset();
    }
    
    this.sedes = ['Principal'];
    this.renderSedes();
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
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    if (window.empresasMain && window.empresasMain.showEnhancedNotification) {
      window.empresasMain.showEnhancedNotification(message, type);
    } else {
      // Fallback to alert
      alert(message);
    }
  }
}

// Initialize empresas modals
const empresasModals = new EmpresasModals();

// Export for global access
window.empresasModals = empresasModals;

// Backward compatibility functions
window.openCreateEmpresaModal = () => empresasModals.openCreateModal();
window.openEditEmpresaModal = (id) => empresasModals.openEditModal(id);
window.openViewEmpresaModal = (id) => empresasModals.openViewModal(id);
window.toggleEmpresaStatus = (id, activa) => empresasModals.showToggleModal(id, activa);

console.log('🏢 Empresas modals module loaded');
