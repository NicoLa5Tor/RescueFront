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
      'clientUpdateModal',
      'locationModal'
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
      'clientUpdateModal',
      'locationModal'
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
      case 'locationModal':
        this.closeLocationModal();
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
      console.log('🔄 INICIANDO EDICIÓN DE HARDWARE:', id);
      this.editingHardware = id;
      console.log('🔍 this.editingHardware establecido a:', this.editingHardware);
      
      // Set modal title and button text
      this.setElementText('modalTitle', 'Editar Hardware');
      this.setElementText('submitButtonText', 'Actualizar Hardware');
      
      // Load hardware data
      await this.loadHardwareDataForEdit(id);
      
      // Verify editing state before opening modal
      console.log('🔍 Antes de abrir modal - this.editingHardware:', this.editingHardware);
      
      // Open modal
      this.openModalWithScroll('hardwareModal');
      
      // Verify editing state after opening modal
      console.log('🔍 Después de abrir modal - this.editingHardware:', this.editingHardware);
      
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

      // Extract nested data with detailed logging
      console.log('🔍 ESTRUCTURA COMPLETA DE DATOS:', JSON.stringify(hardware, null, 2));
      
      let datos = {};
      if (hardware.datos) {
        console.log('📦 Campo datos encontrado, tipo:', typeof hardware.datos);
        console.log('📦 Contenido de hardware.datos:', hardware.datos);
        
        if (typeof hardware.datos === 'object') {
          // Check for multiple levels of nesting
          if (hardware.datos.datos) {
            console.log('📦 Estructura anidada: hardware.datos.datos encontrada');
            console.log('📦 Contenido de hardware.datos.datos:', hardware.datos.datos);
            
            // Check for even deeper nesting: hardware.datos.datos.datos
            if (hardware.datos.datos.datos) {
              console.log('📦 Estructura TRIPLE anidada: hardware.datos.datos.datos encontrada');
              console.log('📦 Contenido de hardware.datos.datos.datos:', hardware.datos.datos.datos);
              datos = hardware.datos.datos.datos;
            } else {
              console.log('📦 Usando hardware.datos.datos (sin triple anidado)');
              datos = hardware.datos.datos;
            }
          } else {
            console.log('📦 Usando hardware.datos directamente');
            datos = hardware.datos;
          }
        } else if (typeof hardware.datos === 'string') {
          try {
            console.log('📦 Parseando datos string:', hardware.datos);
            const parsed = JSON.parse(hardware.datos);
            console.log('📦 Datos parseados:', parsed);
            
            if (parsed.datos) {
              console.log('📦 Estructura anidada en string: parsed.datos encontrada');
              // Check for triple nesting in parsed data too
              if (parsed.datos.datos) {
                console.log('📦 Estructura TRIPLE anidada en string: parsed.datos.datos encontrada');
                datos = parsed.datos.datos;
              } else {
                datos = parsed.datos;
              }
            } else {
              console.log('📦 Usando parsed directamente');
              datos = parsed;
            }
          } catch (e) {
            console.warn('Error parsing datos string:', e);
            datos = {};
          }
        }
      } else {
        console.warn('⚠️ No hay campo "datos" en el hardware');
      }

      console.log('📊 Datos extraídos FINALES para formulario:', datos);
      console.log('📊 Hardware completo recibido:', hardware);

      // Fill form fields
      this.setInputValue('hardwareName', getSafeValue(hardware, 'nombre'));
      this.setInputValue('hardwareType', getSafeValue(hardware, 'tipo'));

      // Set empresa and sede with better validation
      const empresaId = getSafeValue(hardware, 'empresa_id');
      const sedeValue = getSafeValue(hardware, 'sede');
      const direccionValue = getSafeValue(hardware, 'direccion');
      
      console.log('🏢 Empresa ID del hardware:', empresaId);
      console.log('🏢 Sede del hardware:', sedeValue);
      console.log('📍 Dirección del hardware:', direccionValue);
      
      if (empresaId) {
        // First, set the empresa select
        this.setInputValue('hardwareEmpresa', empresaId);
        
        // Wait for empresas to be loaded, then trigger sede loading
        const waitForEmpresas = () => {
          if (window.empresas && window.empresas.length > 0) {
            console.log('🏢 Empresas disponibles:', window.empresas.length);
            
            // Validate that the empresa_id exists in the empresas list
            const selectedEmpresa = window.empresas.find(emp => emp._id === empresaId);
            if (selectedEmpresa) {
              console.log('✅ Empresa encontrada:', selectedEmpresa.nombre);
              
              // Load sedes for this empresa
              this.loadSedesByEmpresa();
              
              // Set sede after sedes are loaded
              setTimeout(() => {
                if (sedeValue) {
                  this.setInputValue('hardwareSede', sedeValue);
                  console.log('✅ Sede configurada:', sedeValue);
                } else {
                  console.warn('⚠️ No se encontró sede para el hardware');
                }
                
                // Set direccion value
                if (direccionValue) {
                  this.setInputValue('hardwareDireccion', direccionValue);
                  console.log('✅ Dirección configurada:', direccionValue);
                }
              }, 200);
            } else {
              console.error('❌ Empresa con ID', empresaId, 'no encontrada en la lista de empresas');
              console.error('❌ Empresas disponibles:', window.empresas.map(e => ({ id: e._id, nombre: e.nombre })));
              // Reset empresa if not found
              this.setInputValue('hardwareEmpresa', '');
            }
          } else {
            // Wait a bit more for empresas to load
            setTimeout(waitForEmpresas, 100);
          }
        };
        
        // Start waiting for empresas
        waitForEmpresas();
      } else {
        console.warn('⚠️ No se encontró empresa_id en el hardware');
      }

      // Brand with logging
      const brandValue = getSafeValue(datos, 'brand') || 
                        getSafeValue(datos, 'marca') || 
                        getSafeValue(hardware, 'marca');
      console.log('🏷️ Brand value:', brandValue, '(from datos.brand:', getSafeValue(datos, 'brand'), ', datos.marca:', getSafeValue(datos, 'marca'), ', hardware.marca:', getSafeValue(hardware, 'marca'), ')');
      this.setInputValue('hardwareBrand', brandValue);

      // Model with logging
      const modelValue = getSafeValue(datos, 'model') || 
                        getSafeValue(datos, 'modelo') || 
                        getSafeValue(hardware, 'modelo');
      console.log('📱 Model value:', modelValue, '(from datos.model:', getSafeValue(datos, 'model'), ', datos.modelo:', getSafeValue(datos, 'modelo'), ', hardware.modelo:', getSafeValue(hardware, 'modelo'), ')');
      this.setInputValue('hardwareModel', modelValue);

      // Price with logging
      const priceValue = getSafeValue(datos, 'price') || 
                        getSafeValue(datos, 'precio') || 
                        getSafeValue(hardware, 'precio');
      console.log('💰 Price value:', priceValue, '(from datos.price:', getSafeValue(datos, 'price'), ', datos.precio:', getSafeValue(datos, 'precio'), ', hardware.precio:', getSafeValue(hardware, 'precio'), ')');
      this.setInputValue('hardwarePrice', priceValue);

      // Stock with logging
      const stockValue = getSafeValue(datos, 'stock') || 
                        getSafeValue(hardware, 'stock');
      console.log('📦 Stock value:', stockValue, '(from datos.stock:', getSafeValue(datos, 'stock'), ', hardware.stock:', getSafeValue(hardware, 'stock'), ')');
      this.setInputValue('hardwareStock', stockValue);

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
      this.setElementText('viewHardwareDireccion', getSafeValue(hardware, 'direccion', 'N/A'));
      this.setElementText('viewHardwareTopic', "empresas/"+getSafeValue(hardware, 'topic', 'No generado'));

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
    
    // Get form elements
    const empresaSelect = document.getElementById('hardwareEmpresa');
    const sedeSelect = document.getElementById('hardwareSede');
    const direccionInput = document.getElementById('hardwareDireccion');
    
    // Basic validation
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
    
    if (!direccionInput.value.trim()) {
      this.showNotification('Por favor ingresa una dirección', 'error');
      direccionInput.focus();
      return;
    }
    
    // Use validator to get safe empresa data
    let empresaData;
    if (window.hardwareValidator) {
      empresaData = window.hardwareValidator.getSafeEmpresaData(empresaSelect);
      if (!empresaData.isValid) {
        this.showNotification(`Error de empresa: ${empresaData.error}`, 'error');
        console.error('❌ Error al obtener datos de empresa:', empresaData.error);
        return;
      }
    } else {
      // Fallback to manual validation
      const selectedEmpresaOption = empresaSelect.options[empresaSelect.selectedIndex];
      let empresaNombre = selectedEmpresaOption.dataset.nombre || selectedEmpresaOption.textContent;
      
      // Additional validation: if dataset.nombre is empty, try to get it from window.empresas
      if (!empresaNombre || empresaNombre === selectedEmpresaOption.textContent) {
        const selectedEmpresa = window.empresas?.find(emp => emp._id === empresaSelect.value);
        if (selectedEmpresa) {
          empresaNombre = selectedEmpresa.nombre;
          console.log('🏢 Nombre de empresa obtenido de window.empresas:', empresaNombre);
        }
      }
      
      // Final validation of empresa name
      if (!empresaNombre) {
        this.showNotification('Error: No se pudo obtener el nombre de la empresa seleccionada', 'error');
        console.error('❌ No se pudo obtener el nombre de la empresa. Empresa ID:', empresaSelect.value);
        return;
      }
      
      empresaData = {
        empresaId: empresaSelect.value,
        empresaNombre: empresaNombre
      };
    }
    
    // Build form data
    const formData = this.buildFormData(empresaData.empresaId, empresaData.empresaNombre, sedeSelect.value);
    
    // Validate complete form data using validator
    if (window.hardwareValidator) {
      const validation = window.hardwareValidator.validateHardwareData(formData);
      if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ');
        this.showNotification(`Errores de validación: ${errorMessage}`, 'error');
        console.error('❌ Errores de validación:', validation.errors);
        return;
      }
      
      // Show warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn('⚠️ Advertencias de validación:', validation.warnings);
      }
    }
    
    console.log('📤 Enviando datos de hardware:', formData);
    console.log('🏢 Empresa ID:', empresaData.empresaId);
    console.log('🏢 Empresa Nombre:', empresaData.empresaNombre);
    console.log('🏢 Sede:', sedeSelect.value);
    
    // Debug: Check editing state
    console.log('🔍 DEBUG: Estado de edición:');
    console.log('  - this.editingHardware:', this.editingHardware);
    console.log('  - window.editingHardware:', window.editingHardware);
    console.log('  - typeof this.editingHardware:', typeof this.editingHardware);
    console.log('  - boolean check this.editingHardware:', !!this.editingHardware);
    
    // Submit
    if (this.editingHardware) {
      console.log('🔄 Realizando ACTUALIZACIÓN (PUT) para ID:', this.editingHardware);
      await this.updateHardwareAPI(this.editingHardware, formData);
    } else {
      console.log('🆕 Realizando CREACIÓN (POST)');
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
      direccion: this.getInputValue('hardwareDireccion'),
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
   * Create hardware via API - Delegates to global function
   */
  async createHardwareAPI(hardwareData) {
    if (window.createHardwareAPI) {
      return window.createHardwareAPI(hardwareData);
    } else {
      console.error('❌ createHardwareAPI global function not available');
      this.showNotification('Error: Sistema no disponible', 'error');
    }
  }

  /**
   * Update hardware via API - Delegates to global function
   */
  async updateHardwareAPI(id, hardwareData) {
    if (window.updateHardwareAPI) {
      return window.updateHardwareAPI(id, hardwareData);
    } else {
      console.error('❌ updateHardwareAPI global function not available');
      this.showNotification('Error: Sistema no disponible', 'error');
    }
  }

  /**
   * Close create/edit modal
   */
  closeCreateEditModal() {
    // Hide the modal - modalManager handles scroll restoration
    if (window.modalManager) {
      window.modalManager.closeModal('hardwareModal');
    } else {
      const modal = document.getElementById('hardwareModal');
      modal.classList.add('hidden');
      document.body.style.overflow = ''; // Only for fallback
    }
    
    this.editingHardware = null;
    this.resetForm();
  }

  /**
   * Close view modal
   */
  closeViewModal() {
    // Hide the modal - modalManager handles scroll restoration
    if (window.modalManager) {
      window.modalManager.closeModal('viewHardwareModal');
    } else {
      const modal = document.getElementById('viewHardwareModal');
      modal.classList.add('hidden');
      document.body.style.overflow = ''; // Only for fallback
    }
    
    this.currentViewingHardware = null;
  }

  /**
   * Open modal - use modalManager for proper handling
   */
  openModalWithScroll(modalId) {
    if (window.modalManager) {
      // Use the global modal manager - it handles scroll properly
      window.modalManager.openModal(modalId);
    } else {
      // Fallback if modalManager not available
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
          const firstInput = modal.querySelector('input, textarea, select');
          if (firstInput) firstInput.focus();
        }, 100);
      }
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
      const finalValue = value || '';
      console.log(`🔍 setInputValue: ${inputId} = "${finalValue}" (original: ${value})`);
      input.value = finalValue;
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

  closeLocationModal() {
    if (window.closeLocationModal) {
      window.closeLocationModal();
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

// Export location modal functions
// Note: openLocationModal and closeLocationModal are defined in hardware.html

// Export core instance
window.hardwareCore = hardwareCore;
