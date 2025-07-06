/**
 * ===== HARDWARE CORE FUNCTIONALITY =====
 * 
 * Este archivo contiene la funcionalidad principal para la gestión de hardware:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Modal management (create/edit, view details)
 * - Form handling y validation
 * - API integration
 */

class HardwareCore {
  constructor() {
    this.editingHardware = null;
    this.currentViewingHardware = null;
    this.apiClient = null;
    this.isLoading = false;
    
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners for forms and modals
   */
  initializeEventListeners() {
    // Form submission
    const hardwareForm = document.getElementById('hardwareForm');
    if (hardwareForm) {
      hardwareForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Modal close events
    this.setupModalCloseEvents();

    // Keyboard events
    document.addEventListener('keydown', (e) => this.handleKeyboardEvents(e));
  }

  /**
   * Setup modal close events
   */
  setupModalCloseEvents() {
    const modals = [
      'hardwareModal',
      'viewHardwareModal',
      'toggleHardwareModal',
      'clientUpdateModal'
    ];

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
   * Handle keyboard events (ESC to close modals)
   */
  handleKeyboardEvents(e) {
    if (e.key === 'Escape') {
      this.closeActiveModal();
    }
  }

  /**
   * Close active modal
   */
  closeActiveModal() {
    const modals = [
      'hardwareModal',
      'viewHardwareModal', 
      'toggleHardwareModal',
      'clientUpdateModal'
    ];

    for (const modalId of modals) {
      const modal = document.getElementById(modalId);
      if (modal && !modal.classList.contains('hidden')) {
        this.closeModalById(modalId);
        break;
      }
    }
  }

  /**
   * Close modal by ID
   */
  closeModalById(modalId) {
    switch (modalId) {
      case 'hardwareModal':
        this.closeCreateEditModal();
        break;
      case 'viewHardwareModal':
        this.closeViewModal();
        break;
      case 'toggleHardwareModal':
        this.closeToggleModal();
        break;
      case 'clientUpdateModal':
        this.closeUpdateModal();
        break;
    }
  }

  /**
   * Open create hardware modal
   */
  openCreateModal() {
    this.editingHardware = null;
    
    // Set modal title and button text
    this.setElementText('modalTitle', 'Nuevo Hardware');
    this.setElementText('submitButtonText', 'Crear Hardware');
    
    // Reset form
    const form = document.getElementById('hardwareForm');
    if (form) form.reset();
    
    // Open modal with smooth scrolling
    this.openModalWithScroll('hardwareModal');
  }

  /**
   * Edit hardware
   */
  async editHardware(id) {
    try {
      this.editingHardware = id;
      
      // Set modal title and button text
      this.setElementText('modalTitle', 'Editar Hardware');
      this.setElementText('submitButtonText', 'Actualizar Hardware');
      
      // Load hardware data
      await this.loadHardwareDataForEdit(id);
      
      // Open modal
      this.openModalWithScroll('hardwareModal');
      
    } catch (error) {
      console.error('💥 Error al abrir modal de edición:', error);
      this.showNotification('Error al abrir el modal de edición. Por favor, inténtalo de nuevo.', 'error');
    }
  }

  /**
   * Load hardware data for editing
   */
  async loadHardwareDataForEdit(id) {
    try {
      console.log('🔄 Cargando datos para editar hardware:', id);
      
      if (!this.apiClient) {
        throw new Error('API client no disponible');
      }

      const response = await this.apiClient.get_hardware_details(id);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('📋 Datos del hardware cargados para edición:', data.data);
        this.loadHardwareDataIntoForm(data.data);
      } else {
        console.warn('⚠️ Error en respuesta del API:', data.errors);
        this.loadDummyDataIntoForm(); // Fallback
      }
    } catch (error) {
      console.error('💥 Error al cargar datos del hardware:', error);
      this.loadDummyDataIntoForm(); // Fallback
    }
  }

  /**
   * Load hardware data into form
   */
  loadHardwareDataIntoForm(hardware) {
    try {
      // Helper functions
      const getSafeValue = (obj, path, defaultValue = '') => {
        try {
          const keys = path.split('.');
          let current = obj;
          for (const key of keys) {
            if (current === null || current === undefined) {
              return defaultValue;
            }
            current = current[key];
          }
          return current !== null && current !== undefined ? current : defaultValue;
        } catch (e) {
          return defaultValue;
        }
      };

      // Extract nested data
      let datos = {};
      if (hardware.datos) {
        if (typeof hardware.datos === 'object') {
          datos = hardware.datos.datos || hardware.datos;
        } else if (typeof hardware.datos === 'string') {
          try {
            const parsed = JSON.parse(hardware.datos);
            datos = parsed.datos || parsed;
          } catch (e) {
            console.warn('Error parsing datos string:', e);
            datos = {};
          }
        }
      }

      console.log('📊 Datos extraídos para formulario:', datos);

      // Fill form fields
      this.setInputValue('hardwareName', getSafeValue(hardware, 'nombre'));
      this.setInputValue('hardwareType', getSafeValue(hardware, 'tipo'));

      // Set empresa and sede
      const empresaId = getSafeValue(hardware, 'empresa_id');
      if (empresaId) {
        this.setInputValue('hardwareEmpresa', empresaId);
        // Trigger sede loading
        setTimeout(() => {
          this.loadSedesByEmpresa();
          setTimeout(() => {
            this.setInputValue('hardwareSede', getSafeValue(hardware, 'sede'));
          }, 100);
        }, 100);
      }

      this.setInputValue('hardwareBrand', 
        getSafeValue(datos, 'brand') || 
        getSafeValue(datos, 'marca') || 
        getSafeValue(hardware, 'marca')
      );

      this.setInputValue('hardwareModel', 
        getSafeValue(datos, 'model') || 
        getSafeValue(datos, 'modelo') || 
        getSafeValue(hardware, 'modelo')
      );

      this.setInputValue('hardwarePrice', 
        getSafeValue(datos, 'price') || 
        getSafeValue(datos, 'precio') || 
        getSafeValue(hardware, 'precio')
      );

      this.setInputValue('hardwareStock', 
        getSafeValue(datos, 'stock') || 
        getSafeValue(hardware, 'stock')
      );

      // Status
      const status = getSafeValue(datos, 'status') || 
                    getSafeValue(datos, 'estado') || 
                    getSafeValue(hardware, 'status') || 
                    getSafeValue(hardware, 'estado') || 
                    'available';
      this.setInputValue('hardwareStatus', status);

      // Warranty
      const warranty = getSafeValue(datos, 'warranty') || 
                      getSafeValue(datos, 'garantia') || 
                      getSafeValue(hardware, 'warranty') || 
                      getSafeValue(hardware, 'garantia') || 
                      '12';
      this.setInputValue('hardwareWarranty', warranty);

      // Description
      const description = getSafeValue(datos, 'description') || 
                         getSafeValue(datos, 'descripcion') || 
                         getSafeValue(hardware, 'descripcion');
      this.setInputValue('hardwareDescription', description);

      console.log('✅ Datos cargados en el formulario correctamente');

    } catch (error) {
      console.error('💥 Error al cargar datos en el formulario:', error);
      this.loadDummyDataIntoForm();
    }
  }

  /**
   * Load dummy data into form (fallback)
   */
  loadDummyDataIntoForm() {
    console.log('⚠️ Cargando datos dummy en el formulario');
    
    this.setInputValue('hardwareName', 'Hardware sin nombre');
    this.setInputValue('hardwareType', 'General');
    this.setInputValue('hardwareBrand', 'Sin marca');
    this.setInputValue('hardwareModel', 'Sin modelo');
    this.setInputValue('hardwarePrice', '0');
    this.setInputValue('hardwareStock', '0');
    this.setInputValue('hardwareStatus', 'available');
    this.setInputValue('hardwareWarranty', '12');
    this.setInputValue('hardwareDescription', '');
  }

  /**
   * View hardware details
   */
  async viewHardware(id) {
    try {
      console.log('🔍 Cargando detalles del hardware:', id);

      if (!id) {
        console.error('❌ ID de hardware no válido:', id);
        this.showNotification('Error: ID de hardware no válido', 'error');
        return;
      }

      if (!this.apiClient) {
        console.error('❌ API client no disponible');
        this.showNotification('Error: Conexión con el servidor no disponible', 'error');
        return;
      }

      const response = await this.apiClient.get_hardware_details(id);

      if (!response.ok) {
        this.handleApiError(response);
        return;
      }

      const data = await response.json();
      console.log('📦 Respuesta completa del API:', data);

      if (data.success) {
        console.log('📋 Detalles del hardware cargados:', data.data);
        
        if (!data.data) {
          console.warn('⚠️ Datos del hardware vacíos');
          this.showNotification('No se encontraron datos para este hardware.', 'error');
          return;
        }

        this.showHardwareDetails(data.data);
      } else {
        console.error('❌ Error en respuesta del API:', data.errors);
        const errorMessage = this.getErrorMessage(data);
        this.showNotification('Error al cargar los detalles del hardware: ' + errorMessage, 'error');
      }
    } catch (error) {
      console.error('💥 Error al cargar detalles del hardware:', error);
      this.handleViewError(error);
    }
  }

  /**
   * Handle API errors
   */
  handleApiError(response) {
    console.error('❌ Error HTTP:', response.status, response.statusText);
    
    if (response.status === 404) {
      this.showNotification('Hardware no encontrado. Puede que haya sido eliminado.', 'error');
    } else if (response.status === 401) {
      this.showNotification('Sesión expirada. Por favor, inicia sesión nuevamente.', 'error');
      window.location.href = '/login';
    } else if (response.status === 403) {
      this.showNotification('No tienes permisos para ver este hardware.', 'error');
    } else {
      this.showNotification(`Error del servidor: ${response.status} - ${response.statusText}`, 'error');
    }
  }

  /**
   * Handle view errors
   */
  handleViewError(error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      this.showNotification('Error de conexión. Verifica tu conexión a internet.', 'error');
    } else if (error.name === 'SyntaxError') {
      this.showNotification('Error en la respuesta del servidor. Inténtalo de nuevo.', 'error');
    } else {
      this.showNotification('Error inesperado al cargar los detalles. Inténtalo de nuevo.', 'error');
    }
  }

  /**
   * Get error message from API response
   */
  getErrorMessage(data) {
    return data.errors && Array.isArray(data.errors) 
      ? data.errors.join(', ') 
      : data.error || 'Error desconocido';
  }

  /**
   * Show hardware details in modal
   */
  showHardwareDetails(hardware) {
    try {
      console.log('📋 Datos completos del hardware recibidos:', hardware);
      
      this.currentViewingHardware = hardware;

      // Helper functions
      const getSafeValue = (obj, path, defaultValue = 'N/A') => {
        try {
          const keys = path.split('.');
          let current = obj;
          for (const key of keys) {
            if (current === null || current === undefined) {
              return defaultValue;
            }
            current = current[key];
          }
          return current !== null && current !== undefined ? current : defaultValue;
        } catch (e) {
          console.warn(`Error accessing path ${path}:`, e);
          return defaultValue;
        }
      };

      // Extract nested data
      let datos = {};
      if (hardware.datos) {
        if (typeof hardware.datos === 'object') {
          datos = hardware.datos.datos || hardware.datos;
        } else if (typeof hardware.datos === 'string') {
          try {
            const parsed = JSON.parse(hardware.datos);
            datos = parsed.datos || parsed;
          } catch (e) {
            console.warn('Error parsing datos string:', e);
            datos = {};
          }
        }
      }

      console.log('📊 Datos extraídos para mostrar:', datos);

      // Fill modal fields
      this.setElementText('viewHardwareName', getSafeValue(hardware, 'nombre'));
      this.setElementText('viewHardwareType', getSafeValue(hardware, 'tipo'));
      this.setElementText('viewHardwareEmpresa', getSafeValue(hardware, 'empresa_nombre'));
      this.setElementText('viewHardwareSede', getSafeValue(hardware, 'sede'));

      // Data fields with multiple possibilities
      this.setElementText('viewHardwareBrand', 
        getSafeValue(datos, 'brand') || 
        getSafeValue(datos, 'marca') || 
        getSafeValue(hardware, 'marca') || 
        'N/A'
      );

      this.setElementText('viewHardwareModel', 
        getSafeValue(datos, 'model') || 
        getSafeValue(datos, 'modelo') || 
        getSafeValue(hardware, 'modelo') || 
        'N/A'
      );

      // Price with formatting
      const price = getSafeValue(datos, 'price') || 
                   getSafeValue(datos, 'precio') || 
                   getSafeValue(hardware, 'precio');
      this.setElementText('viewHardwarePrice', 
        price && price !== 'N/A' ? `$${price}` : 'N/A'
      );

      // Stock with formatting
      const stock = getSafeValue(datos, 'stock') || 
                   getSafeValue(hardware, 'stock');
      this.setElementText('viewHardwareStock', 
        stock !== 'N/A' && stock !== null && stock !== undefined ? `${stock} unidades` : 'N/A'
      );

      // Status
      const status = this.formatStatus(datos, hardware);
      this.setElementText('viewHardwareStatus', status);

      // Warranty
      const warranty = getSafeValue(datos, 'warranty') || 
                      getSafeValue(datos, 'garantia') || 
                      getSafeValue(hardware, 'warranty') || 
                      getSafeValue(hardware, 'garantia');
      this.setElementText('viewHardwareWarranty', 
        warranty && warranty !== 'N/A' ? `${warranty} meses` : 'N/A'
      );

      // Active status
      const activa = getSafeValue(hardware, 'activa');
      const activaText = this.formatActiveStatus(activa);
      this.setElementText('viewHardwareActive', activaText);

      // Creation date
      const fechaCreacion = this.formatCreationDate(hardware);
      this.setElementText('viewHardwareCreated', fechaCreacion);

      // Description
      const description = getSafeValue(datos, 'description') || 
                         getSafeValue(datos, 'descripcion') || 
                         getSafeValue(hardware, 'descripcion') || 
                         'Sin descripción';
      this.setElementText('viewHardwareDescription', description);

      // Open modal
      this.openModalWithScroll('viewHardwareModal');

      console.log('✅ Modal de detalles mostrado correctamente');

    } catch (error) {
      console.error('💥 Error al mostrar detalles del hardware:', error);
      this.showNotification('Error al cargar los detalles del hardware. Por favor, inténtalo de nuevo.', 'error');
      
      // Close modal if it was opened
      const modal = document.getElementById('viewHardwareModal');
      if (modal && !modal.classList.contains('hidden')) {
        this.closeViewModal();
      }
    }
  }

  /**
   * Format status for display
   */
  formatStatus(datos, hardware) {
    const status = datos.status || 
                  datos.estado || 
                  hardware.status || 
                  hardware.estado || 
                  'available';
    
    if (status === 'available' || status === 'disponible') {
      return 'Disponible';
    } else if (status === 'out_of_stock' || status === 'sin_stock') {
      return 'Sin Stock';
    } else if (status === 'discontinued' || status === 'descontinuado') {
      return 'Descontinuado';
    } else if (status !== 'N/A') {
      return status;
    }
    return 'N/A';
  }

  /**
   * Format active status
   */
  formatActiveStatus(activa) {
    if (activa === true || activa === 'true' || activa === 1 || activa === '1') {
      return 'Sí';
    } else if (activa === false || activa === 'false' || activa === 0 || activa === '0') {
      return 'No';
    }
    return 'N/A';
  }

  /**
   * Format creation date
   */
  formatCreationDate(hardware) {
    const fechaRaw = hardware.fecha_creacion || 
                    hardware.created_at || 
                    hardware.createdAt;
    
    if (!fechaRaw || fechaRaw === 'N/A') {
      return 'N/A';
    }

    try {
      const fecha = new Date(fechaRaw);
      if (!isNaN(fecha.getTime())) {
        return fecha.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        return fechaRaw;
      }
    } catch (e) {
      console.warn('Error parsing date:', e);
      return fechaRaw;
    }
  }

  /**
   * Handle form submission
   */
  async handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate empresa and sede
    const empresaSelect = document.getElementById('hardwareEmpresa');
    const sedeSelect = document.getElementById('hardwareSede');
    
    if (!empresaSelect.value) {
      this.showNotification('Por favor selecciona una empresa', 'error');
      empresaSelect.focus();
      return;
    }
    
    if (!sedeSelect.value) {
      this.showNotification('Por favor selecciona una sede', 'error');
      sedeSelect.focus();
      return;
    }
    
    // Get empresa name
    const selectedEmpresaOption = empresaSelect.options[empresaSelect.selectedIndex];
    const empresaNombre = selectedEmpresaOption.dataset.nombre || selectedEmpresaOption.textContent;
    
    // Build form data
    const formData = this.buildFormData(empresaSelect.value, empresaNombre, sedeSelect.value);
    
    console.log('📤 Enviando datos de hardware:', formData);
    
    // Submit
    if (this.editingHardware) {
      await this.updateHardwareAPI(this.editingHardware, formData);
    } else {
      await this.createHardwareAPI(formData);
    }
  }

  /**
   * Build form data object
   */
  buildFormData(empresaId, empresaNombre, sede) {
    return {
      nombre: this.getInputValue('hardwareName'),
      tipo: this.getInputValue('hardwareType'),
      empresa_id: empresaId,
      empresa_nombre: empresaNombre,
      sede: sede,
      datos: {
        datos: {
          brand: this.getInputValue('hardwareBrand'),
          model: this.getInputValue('hardwareModel'),
          price: parseFloat(this.getInputValue('hardwarePrice')),
          stock: parseInt(this.getInputValue('hardwareStock')),
          status: this.getInputValue('hardwareStatus'),
          warranty: parseInt(this.getInputValue('hardwareWarranty')),
          description: this.getInputValue('hardwareDescription')
        }
      }
    };
  }

  /**
   * Create hardware via API
   */
  async createHardwareAPI(hardwareData) {
    try {
      const response = await this.apiClient.create_hardware(hardwareData);
      const data = await response.json();
      
      if (data.success) {
        this.showClientUpdateModal('Hardware creado exitosamente');
        this.loadHardware();
        this.closeCreateEditModal();
      } else {
        this.showNotification('Error: ' + this.getErrorMessage(data), 'error');
      }
    } catch (error) {
      console.error('Error al crear hardware:', error);
      this.showNotification('Error de conexión', 'error');
    }
  }

  /**
   * Update hardware via API
   */
  async updateHardwareAPI(id, hardwareData) {
    try {
      const response = await this.apiClient.update_hardware(id, hardwareData);
      const data = await response.json();
      
      if (data.success) {
        this.showClientUpdateModal('Hardware actualizado exitosamente');
        this.loadHardware();
        this.closeCreateEditModal();
      } else {
        this.showNotification('Error: ' + this.getErrorMessage(data), 'error');
      }
    } catch (error) {
      console.error('Error al actualizar hardware:', error);
      this.showNotification('Error de conexión', 'error');
    }
  }

  /**
   * Close create/edit modal
   */
  closeCreateEditModal() {
    this.restoreScrollPosition();
    
    if (window.modalManager) {
      window.modalManager.closeModal('hardwareModal');
    } else {
      const modal = document.getElementById('hardwareModal');
      modal.classList.add('hidden');
    }
    
    this.editingHardware = null;
    this.resetForm();
  }

  /**
   * Close view modal
   */
  closeViewModal() {
    this.restoreScrollPosition();
    
    if (window.modalManager) {
      window.modalManager.closeModal('viewHardwareModal');
    } else {
      const modal = document.getElementById('viewHardwareModal');
      modal.classList.add('hidden');
    }
    
    this.currentViewingHardware = null;
  }

  /**
   * Open modal with smooth scrolling
   */
  openModalWithScroll(modalId) {
    // Scroll to top first
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Delay modal opening
    setTimeout(() => {
      // Prevent body scrolling
      const scrollPosition = window.pageYOffset;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.width = '100%';
      document.body.classList.add('ios-modal-open');
      
      // Open modal
      if (window.modalManager) {
        window.modalManager.openModal(modalId);
        window.modalManager.setupModal(modalId);
      } else {
        const modal = document.getElementById(modalId);
        modal.classList.remove('hidden');
      }
    }, 300);
  }

  /**
   * Restore scroll position
   */
  restoreScrollPosition() {
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.classList.remove('ios-modal-open');
    
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  }

  /**
   * Reset form
   */
  resetForm() {
    const form = document.getElementById('hardwareForm');
    if (form) {
      form.reset();
    }
  }

  /**
   * Utility functions
   */
  setElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
    } else {
      console.warn(`Element with ID '${elementId}' not found`);
    }
  }

  setInputValue(inputId, value) {
    const input = document.getElementById(inputId);
    if (input) {
      input.value = value || '';
    } else {
      console.warn(`Input with ID '${inputId}' not found`);
    }
  }

  getInputValue(inputId) {
    const input = document.getElementById(inputId);
    return input ? input.value : '';
  }

  /**
   * Show notification (placeholder - will be implemented in notifications module)
   */
  showNotification(message, type = 'info') {
    if (window.hardwareNotifications) {
      window.hardwareNotifications.show(message, type);
    } else {
      // Fallback to alert
      alert(message);
    }
  }

  /**
   * Show client update modal (placeholder - will be implemented in modals module)
   */
  showClientUpdateModal(message) {
    if (window.hardwareModals) {
      window.hardwareModals.showClientUpdateModal(message);
    } else {
      this.showNotification(message, 'success');
    }
  }

  /**
   * Load hardware list (placeholder - will be implemented in data module)
   */
  loadHardware() {
    if (window.hardwareData) {
      window.hardwareData.loadHardware();
    } else {
      console.warn('Hardware data module not available');
    }
  }

  /**
   * Load sedes by empresa (placeholder - will be implemented in data module)
   */
  loadSedesByEmpresa() {
    if (window.hardwareData) {
      window.hardwareData.loadSedesByEmpresa();
    } else {
      console.warn('Hardware data module not available');
    }
  }

  // Close methods for modal integration
  closeToggleModal() {
    if (window.hardwareModals) {
      window.hardwareModals.closeToggleModal();
    }
  }

  closeUpdateModal() {
    if (window.hardwareModals) {
      window.hardwareModals.closeUpdateModal();
    }
  }
}

// Initialize hardware core
const hardwareCore = new HardwareCore();

// Export functions for backward compatibility
window.openCreateModal = () => hardwareCore.openCreateModal();
window.editHardware = (id) => hardwareCore.editHardware(id);
window.viewHardware = (id) => hardwareCore.viewHardware(id);
window.closeModal = () => hardwareCore.closeCreateEditModal();
window.closeViewModal = () => hardwareCore.closeViewModal();

// Export core instance
window.hardwareCore = hardwareCore;
