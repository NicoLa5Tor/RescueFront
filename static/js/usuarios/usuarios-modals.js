/**
 * ===== USUARIOS MODALS FUNCTIONALITY - MODALSCROLLMANAGER =====
 * 
 * Este archivo contiene la funcionalidad para todos los modales de usuarios:
 * - Modal de crear usuario
 * - Modal de editar usuario
 * - Modal de ver detalles
 * - Modal de confirmar toggle status
 * - Modal de confirmaciones y success
 * 
 * IMPLEMENTANDO MODALSCROLLMANAGER PARA APERTURA PERFECTA
 */

// ============================================================================
// 1. MODAL SCROLL MANAGER - OPTIMIZADO PARA USUARIOS
// ============================================================================
class UsuariosModalScrollManager {
  constructor() {
    this.openModals = new Set();
    this.scrollPosition = 0;
    this.isLocked = false;
    this.init();
  }

  init() {
    this.injectCSS();
    window.addEventListener('orientationchange', () => setTimeout(() => this.refreshLock(), 100));
    window.addEventListener('resize', () => this.hasOpenModals() && this.refreshLock());
  }

  injectCSS() {
    if (document.getElementById('usuarios-modal-scroll-css')) return;
    
    const style = document.createElement('style');
    style.id = 'usuarios-modal-scroll-css';
    style.textContent = `
      .usuarios-modal-scroll-locked { overflow: hidden !important; }
      .usuarios-modal-scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
      .usuarios-modal-backdrop {
        position: fixed !important; top: 0 !important; left: 0 !important; 
        right: 0 !important; bottom: 0 !important; z-index: 9999999 !important;
        display: flex; align-items: center; justify-content: center; padding: 1rem;
        background: rgba(0, 0, 0, 0.8) !important;
        /* Animaciones como empresas */
        transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        opacity: 1;
        visibility: visible;
      }
      /* Estado oculto para usuarios modal backdrop */
      .usuarios-modal-backdrop.hidden {
        opacity: 0 !important;
        pointer-events: none !important;
        backdrop-filter: blur(0px) !important;
        -webkit-backdrop-filter: blur(0px) !important;
        visibility: hidden !important;
        transition: opacity 0.3s ease, backdrop-filter 0.3s ease, visibility 0s 0.3s;
      }
      /* Animaciones para contenedores de modales de usuarios */
      .usuarios-modal-backdrop .ios-blur-modal-container {
        transform: scale(0.8) !important;
        opacity: 0 !important;
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        transition-delay: 0.1s !important;
      }
      /* Estado visible para contenedores de modales de usuarios */
      .usuarios-modal-backdrop:not(.hidden) .ios-blur-modal-container {
        transform: scale(1) !important;
        opacity: 1 !important;
        transition-delay: 0.2s !important;
      }
    `;
    document.head.appendChild(style);
  }

  openModal(modalId, options = {}) {
    //console.log(`🔒 Opening usuarios modal: ${modalId}`);
    
    if (this.openModals.size === 0) {
      this.scrollPosition = window.pageYOffset;
      this.lockScroll();
    }
    
    this.openModals.add(modalId);
    
    const modal = document.getElementById(modalId);
    if (modal) {
      // Aplicar clases y estilos para centrado perfecto
      modal.classList.remove('hidden');
      modal.className = modal.className.replace('hidden', '').trim() + ' usuarios-modal-backdrop';
      modal.style.display = 'flex';
    }
    
    options.focusTrap && this.setupFocusTrap(modalId);
  }

  closeModal(modalId) {
    //console.log(`🔓 Closing usuarios modal: ${modalId}`);
    
    this.openModals.delete(modalId);
    
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('usuarios-modal-backdrop');
      modal.style.display = 'none';
    }
    
    if (this.openModals.size === 0) {
      this.unlockScroll();
    }
  }

  lockScroll() {
    if (this.isLocked) return;
    
    //console.log('🔒 Using CSS-only scroll lock to prevent white borders');
    
    const body = document.body;
    
    // USAR SOLO CLASE CSS CON OVERSCROLL-BEHAVIOR PARA EVITAR BORDES BLANCOS
    body.classList.add('ios-modal-open');
    
    this.isLocked = true;
    //console.log('✅ CSS-only scroll lock applied');
  }

  unlockScroll() {
    if (!this.isLocked) return;
    
    //console.log('🔓 Using CSS-only scroll unlock to prevent white borders');
    
    const body = document.body;
    
    // USAR SOLO CLASE CSS - NO MANIPULAR ESTILOS DIRECTAMENTE
    body.classList.remove('ios-modal-open');
    
    this.isLocked = false;
    //console.log('✅ CSS-only scroll unlock applied');
  }

  preventScrollKeys = (e) => {
    // Teclas que causan scroll
    const scrollKeys = [
      'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight',
      'PageDown', 'PageUp', 'Home', 'End', 'Space'
    ];
    
    if (scrollKeys.includes(e.code) || e.key === ' ') {
      // Permitir solo si está dentro de un elemento scrollable O es un input
      const target = e.target;
      const isScrollable = target.closest('.usuarios-modal-scrollable, .scrollable');
      const isInput = target.matches('input, textarea, select, [contenteditable]');
      
      if (!isScrollable && !isInput) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  preventScrollEvent = (e) => {
    // Prevenir eventos de scroll directo
    e.preventDefault();
    e.stopPropagation();
    
    // Forzar que se mantenga en la posición guardada
    window.scrollTo(0, this.scrollPosition);
  }

  preventDrag = (e) => {
    // Prevenir drag que puede causar scroll en móviles
    if (!e.target.closest('.usuarios-modal-scrollable, .scrollable')) {
      e.preventDefault();
    }
  }

  preventScroll = (e) => {
    if (!e.target.closest('.usuarios-modal-scrollable, .scrollable')) {
      e.preventDefault();
    }
  }

  setupFocusTrap(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    
    const trapFocus = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    
    modal.addEventListener('keydown', trapFocus);
    first?.focus();
  }

  hasOpenModals() { return this.openModals.size > 0; }
  
  closeAllModals() {
    Array.from(this.openModals).forEach(id => this.closeModal(id));
  }
  
  refreshLock() {
    if (this.hasOpenModals()) {
      this.unlockScroll();
      setTimeout(() => this.lockScroll(), 50);
    }
  }
}

// ============================================================================
// 2. USUARIOS MODALS CLASS - ACTUALIZADA CON MODALSCROLLMANAGER
// ============================================================================
class UsuariosModals {
  constructor() {
    this.currentEditingUser = null;
    this.currentViewingUser = null;
    this.currentToggleUser = null;
    this.currentUser = null; // Para edición
    this.apiClient = null;
    this.especialidades = [];
    this.isCreating = false;
    this.isUpdating = false;
    
    // International phone input instances
    this.createPhoneInput = null;
    this.editPhoneInput = null;
    
    // Inicializar ModalScrollManager
    this.modalManager = new UsuariosModalScrollManager();
    
    this.initializeModals();
  }

  /**
   * Initialize modal system
   */
  initializeModals() {
    try {
      // Setup API client
      this.setupApiClient();
      
      // Setup event listeners
      this.setupEventListeners();
      
      //console.log('👥 Modales de usuarios inicializados correctamente');
      
    } catch (error) {
      //console.error('💥 Error al inicializar modales de usuarios:', error);
    }
  }

  /**
   * Setup API client
   */
  setupApiClient() {
    if (window.usuariosMain && window.usuariosMain.apiClient) {
      this.apiClient = window.usuariosMain.apiClient;
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
      get_usuarios_by_empresa: (empresaId) => fetch(`/proxy/empresas/${empresaId}/usuarios`),
      get_usuario: (empresaId, userId) => fetch(`/proxy/empresas/${empresaId}/usuarios/${userId}`),
      get_empresa: (empresaId) => fetch(`/proxy/empresas/${empresaId}`),
      toggle_usuario_status: (empresaId, userId, activo) => 
        fetch(`/proxy/empresas/${empresaId}/usuarios/${userId}/toggle-status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activo })
        }),
      update_usuario: (empresaId, userId, data) =>
        fetch(`/proxy/empresas/${empresaId}/usuarios/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }),
      create_usuario: (empresaId, data) =>
        fetch(`/proxy/empresas/${empresaId}/usuarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }),
      delete_usuario: (empresaId, userId) =>
        fetch(`/proxy/empresas/${empresaId}/usuarios/${userId}`, {
          method: 'DELETE'
        })
    };
  }

  /**
   * Initialize international telephone input fields
   */
  initIntlTelInput() {
    // Check if intl-tel-input library is available
    if (typeof window.intlTelInput === 'undefined') {
      //console.warn('⚠️ intl-tel-input library not loaded yet');
      setTimeout(() => this.initIntlTelInput(), 500);
      return;
    }
    //console.log('🔄 Inicializando intl-tel-input plugin');
    
    const createPhoneInput = document.getElementById('createUserTelefono');
    if (createPhoneInput) {
      // Destroy existing instance if any
      if (this.createPhoneInput) {
        try {
          this.createPhoneInput.destroy();
        } catch (e) {
          //console.warn('Error destroying existing instance:', e);
        }
      }
      
      try {
        this.createPhoneInput = window.intlTelInput(createPhoneInput, {
          initialCountry: 'co',
          preferredCountries: ['co', 'us', 'mx', 've', 'ar', 'cl', 'pe'],
          separateDialCode: true,
          formatOnDisplay: true,
          nationalMode: false,
          autoPlaceholder: 'polite',
          placeholderNumberType: 'MOBILE',
          utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.3/build/js/utils.js'
        });
        //console.log('✅ Input de crear usuario inicializado');
      } catch (error) {
        //console.error('❌ Error inicializando intl-tel-input para crear:', error);
      }
    }
    const editPhoneInput = document.getElementById('editUserTelefono');
    if (editPhoneInput) {
      // Destroy existing instance if any
      if (this.editPhoneInput) {
        try {
          this.editPhoneInput.destroy();
        } catch (e) {
          //console.warn('Error destroying existing instance:', e);
        }
      }
      
      try {
        this.editPhoneInput = window.intlTelInput(editPhoneInput, {
          initialCountry: 'co',
          preferredCountries: ['co', 'us', 'mx', 've', 'ar', 'cl', 'pe'],
          separateDialCode: true,
          formatOnDisplay: true,
          nationalMode: false,
          autoPlaceholder: 'polite',
          placeholderNumberType: 'MOBILE',
          utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.3/build/js/utils.js'
        });
        //console.log('✅ Input de editar usuario inicializado');
      } catch (error) {
        //console.error('❌ Error inicializando intl-tel-input para editar:', error);
      }
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Form submission
    const createForm = document.getElementById('createUserForm');
    if (createForm) {
      createForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.confirmCreate();
      });
    }
    
    const editForm = document.getElementById('editUserForm');
    if (editForm) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.confirmEdit();
      });
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
    const modals = ['toggleUserModal', 'createUserModal', 'editUserModal', 'viewUserModal', 'userUpdateModal'];
    
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.closeModal(modalId);
          }
        });
      }
    });
  }

  // ===== GESTIÓN UNIFICADA DE MODALES CON MODALSCROLLMANAGER =====
  
  /**
   * Abrir modal - USANDO MODALSCROLLMANAGER
   */
  openModal(modalId) {
    //console.log('🟢 Abriendo modal:', modalId);
    
    // Usar nuestro ModalScrollManager siempre
    this.modalManager.openModal(modalId, { focusTrap: true });
    
    // LIMPIAR ESTILOS INLINE que interfieren con Tailwind
    setTimeout(() => {
      const modal = document.getElementById(modalId);
      const container = modal?.querySelector('.ios-blur-modal-container');
      if (container) {
        // Eliminar cualquier estilo inline que esté sobreescribiendo Tailwind
        container.style.maxWidth = '';
        container.style.width = '';
        //console.log('🧹 Limpiados estilos inline que interferían con Tailwind');
      }
    }, 50);
    
    // Focus en el primer input después de abrir
    setTimeout(() => {
      const modal = document.getElementById(modalId);
      if (modal) {
        const firstInput = modal.querySelector('input:not([type="hidden"]), textarea, select');
        if (firstInput && firstInput.focus) {
          firstInput.focus();
        }
      }
    }, 150);
    
    //console.log('✅ Modal abierto con ModalScrollManager:', modalId);
  }

  /**
   * Cerrar modal - USANDO MODALSCROLLMANAGER
   */
  closeModal(modalId) {
    //console.log('🔴 Cerrando modal:', modalId);
    
    // Usar nuestro ModalScrollManager siempre
    this.modalManager.closeModal(modalId);
    
    // Limpiar datos del modal
    this.resetModalData(modalId);
    
    //console.log('✅ Modal cerrado con ModalScrollManager:', modalId);
  }

  /**
   * Resetear datos del modal
   */
  resetModalData(modalId) {
    switch(modalId) {
      case 'createUserModal':
        this.currentEditingUser = null;
        this.isCreating = false;
        this.clearCreateForm();
        break;
      case 'editUserModal':
        this.currentUser = null;
        this.currentEditingUser = null;
        this.isUpdating = false;
        this.clearEditForm();
        break;
      case 'viewUserModal':
        this.currentViewingUser = null;
        break;
      case 'toggleUserModal':
        this.currentToggleUser = null;
        break;
    }
  }

  /**
   * Cerrar modal activo (para tecla Escape)
   */
  closeActiveModal() {
    if (this.modalManager.hasOpenModals()) {
      this.modalManager.closeAllModals();
    }
  }

  // ===== VIEW USER MODAL =====
  
  /**
   * Open view modal - MISMA LÓGICA QUE EMPRESAS
   */
  async openViewModal(userId) {
    try {
      //console.log('👁️ Abriendo modal de vista para usuario:', userId);
      
      // Set viewing state
      this.currentViewingUser = userId;
      
      // Validate empresa context
      let empresaId = window.usuariosMain?.currentEmpresa?._id;
      
      if (!empresaId && window.userRole === 'empresa' && window.empresaId) {
        empresaId = window.empresaId;
      }
      
      if (!empresaId) {
        this.showNotification('No hay empresa seleccionada', 'error');
        return;
      }
      
      // Load user data
      const response = await this.apiClient.get_usuario(empresaId, userId);
      const result = await response.json();
      
      if (response.ok && result.success && result.data) {
        this.currentViewingUser = result.data;
        this.populateViewModal(result.data);
        
        // Open modal - MISMA LÓGICA QUE EMPRESAS
        this.openModal('viewUserModal');
      } else {
        const errorMessage = result.errors ? result.errors.join(', ') : (result.message || 'Error al cargar datos del usuario');
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      //console.error('💥 Error al cargar detalles de usuario:', error);
      this.showNotification('Error al cargar los detalles del usuario', 'error');
    }
  }

  populateViewModal(user) {
    if (!user) return;
    
    const nombre = user.nombre || 'Sin nombre';
    const email = user.email || 'N/A';
    const cedula = user.cedula || 'N/A';
    const telefono = user.telefono || 'N/A';
    const estado = user.activo ? 'Activo' : 'Inactivo';
    const sede = user.sede || 'N/A';
    const tipoTurno = user.tipo_turno || 'N/A';
    const rol = user.rol || 'N/A';
    
    let especialidadesHtml = '';
    if (user.especialidades && Array.isArray(user.especialidades) && user.especialidades.length > 0) {
      especialidadesHtml = user.especialidades.map(especialidad => 
        `<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">${especialidad}</span>`
      ).join('');
    } else {
      especialidadesHtml = '<span class="text-gray-500 dark:text-gray-400">Sin especialidades</span>';
    }
    
    const content = `
      <div class="space-y-4">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <i class="fas fa-user-circle fa-2x text-blue-600"></i>
          </div>
          <div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">${nombre}</h4>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Email: ${email}</p>
          </div>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-300">
          <p class="mb-1">Cédula: ${cedula}</p>
          <p class="mb-1">Teléfono: ${telefono}</p>
          <p class="mb-1">Estado: ${estado}</p>
        </div>
        <div class="text-sm">
          <h5 class="font-semibold text-gray-900 dark:text-white mb-1">Especialidades</h5>
          <div class="flex flex-wrap gap-2">
            ${especialidadesHtml}
          </div>
        </div>
        <div class="text-sm">
          <h5 class="font-semibold text-gray-900 dark:text-white mb-1">Detalles Adicionales</h5>
          <p class="mb-1">Sede: ${sede}</p>
          <p class="mb-1">Tipo Turno: ${tipoTurno}</p>
          <p>Rol: ${rol}</p>
        </div>
      </div>
    `;
    
    const contentContainer = document.getElementById('viewUserContent');
    if (contentContainer) {
      contentContainer.innerHTML = content;
    }
  }

  closeViewModal() {
    this.closeModal('viewUserModal');
  }

  // ===== EDIT USER MODAL =====
  
  /**
   * Open edit modal - MISMA LÓGICA QUE EMPRESAS
   */
  async openEditModal(userId) {
    try {
      //console.log('✏️ Abriendo modal de edición para usuario:', userId);
      
      // Set editing state
      this.currentEditingUser = userId;
      this.isUpdating = false;
      
      // Validate empresa context
      let empresaId = window.usuariosMain?.currentEmpresa?._id;
      
      if (!empresaId && window.userRole === 'empresa' && window.empresaId) {
        empresaId = window.empresaId;
      }
      
      if (!empresaId) {
        this.showNotification('No hay empresa seleccionada', 'error');
        return;
      }
      
      // Load user data BEFORE opening modal - MISMA LÓGICA QUE EMPRESAS
      await this.loadUserDataForEdit(empresaId, userId);
      
      // Open modal - MISMA LÓGICA QUE EMPRESAS
      this.openModal('editUserModal');
      
    } catch (error) {
      //console.error('💥 Error al abrir modal de edición:', error);
      this.showNotification('Error al cargar datos del usuario', 'error');
    }
  }
  
  /**
   * Load user data for editing - SEPARADA COMO EN EMPRESAS
   */
  async loadUserDataForEdit(empresaId, userId) {
    try {
      //console.log('🔄 Cargando datos de usuario para edición:', userId);
      
      const response = await this.apiClient.get_usuario(empresaId, userId);
      const result = await response.json();
      
      //console.log('📡 Respuesta del backend:', {
      //   status: response.status,
      //   statusText: response.statusText,
      //   ok: response.ok
      // });
      //console.log('📦 Datos recibidos del backend:', result);
      
      if (response.ok && result.success && result.data) {
        //console.log('✅ Datos de usuario válidos, populando formulario...');
        this.currentUser = result.data;
        this.currentUser.empresaId = empresaId;
        this.populateEditModal(result.data);
      } else {
        //console.error('❌ Respuesta del backend no válida:', result);
        const errorMessage = result.errors ? result.errors.join(', ') : 'Error al cargar datos del usuario';
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      //console.error('💥 Error al cargar datos de usuario:', error);
      this.showNotification('Error al cargar los datos del usuario desde el servidor', 'error');
      this.loadDummyUserDataIntoForm();
    }
  }
  
  /**
   * Load dummy data into form (fallback) - COMO EN EMPRESAS
   */
  loadDummyUserDataIntoForm() {
    document.getElementById('editUsername').value = 'Usuario sin nombre';
    document.getElementById('editUserEmail').value = 'usuario@empresa.com';
    document.getElementById('editUserCedula').value = '1234567890';
    document.getElementById('editUserTelefono').value = '3001234567';
    document.getElementById('editUserTipoTurno').value = 'medio_dia';
    
    this.especialidades = [];
    this.renderEspecialidades('edit');
  }

  populateEditModal(user) {
    document.getElementById('editUsername').value = user.nombre || '';
    document.getElementById('editUserEmail').value = user.email || '';
    
    const cedula = document.getElementById('editUserCedula');
    if (cedula) cedula.value = user.cedula || '';
    
    this.especialidades = user.especialidades || [];
    this.renderEspecialidades('edit');
    
    const sede = document.getElementById('editUserSede');
    if (sede) {
      this.loadSedes(sede);
      setTimeout(() => { sede.value = user.sede || ''; }, 100);
    }
    
    const telefono = document.getElementById('editUserTelefono');
    if (telefono) {
      telefono.value = user.telefono || '';
      setTimeout(() => {
        this.initIntlTelInput();
        if (this.editPhoneInput && user.telefono && user.telefono.length > 10) {
          try {
            this.editPhoneInput.setNumber('+' + user.telefono);
          } catch (error) {
            //console.warn('⚠️ Error al establecer número con código de país:', error);
          }
        }
      }, 300);
    }
    
    const tipoTurno = document.getElementById('editUserTipoTurno');
    if (tipoTurno) tipoTurno.value = user.tipo_turno || 'medio_dia';
    
    const rol = document.getElementById('editUserRol');
    if (rol) {
      this.loadRoles(rol);
      setTimeout(() => { rol.value = user.rol || ''; }, 100);
    }
  }

  async confirmEdit() {
    if (this.isUpdating) return;
    
    try {
      this.isUpdating = true;
      
      const submitBtn = document.querySelector('#editUserModal [type="submit"], #editUserModal .ios-blur-btn-primary');
      const originalBtnText = submitBtn?.textContent;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Actualizando...';
      }
      if (!this.currentUser) {
        this.showNotification('No hay usuario seleccionado', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalBtnText) submitBtn.innerHTML = originalBtnText;
        }
        return;
      }
      const telefonoField = document.getElementById('editUserTelefono');
      let telefonoValue = telefonoField.value.trim();
      
      if (this.editPhoneInput && this.editPhoneInput.getNumber) {
        try {
          const fullNumber = this.editPhoneInput.getNumber();
          if (fullNumber && fullNumber.startsWith('+')) {
            telefonoValue = fullNumber.substring(1);
          }
        } catch (error) {
          //console.error('❌ Error al extraer número completo:', error);
        }
      }
      
      const formData = {
        nombre: document.getElementById('editUsername').value.trim(),
        email: document.getElementById('editUserEmail').value.trim(),
        cedula: document.getElementById('editUserCedula').value.trim(),
        especialidades: this.especialidades.filter(esp => esp.trim() !== ''),
        sede: document.getElementById('editUserSede').value.trim(),
        telefono: telefonoValue,
        tipo_turno: document.getElementById('editUserTipoTurno').value,
        rol: document.getElementById('editUserRol').value
      };
      // Validación
      const validationErrors = [];
      if (!formData.nombre || formData.nombre.length < 2) {
        validationErrors.push('El nombre es obligatorio y debe tener al menos 2 caracteres');
      }
      if (!formData.email) {
        validationErrors.push('El correo es obligatorio');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        validationErrors.push('El formato del correo no es válido');
      }
      if (!formData.cedula) {
        validationErrors.push('La cédula es obligatoria');
      } else if (!/^\d{6,15}$/.test(formData.cedula)) {
        validationErrors.push('La cédula debe contener solo números y tener entre 6 y 15 dígitos');
      }
      if (!formData.telefono) {
        validationErrors.push('El teléfono es obligatorio');
      } else if (!/^\d{7,18}$/.test(formData.telefono)) {
        validationErrors.push('El teléfono debe contener solo números y tener entre 7 y 18 dígitos');
      }
      if (!formData.sede) validationErrors.push('Debe seleccionar una sede');
      if (!formData.tipo_turno) validationErrors.push('Debe seleccionar un tipo de turno');
      if (!formData.rol) validationErrors.push('Debe seleccionar un rol');
      
      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.length === 1 ? 
          validationErrors[0] : 
          'Errores de validación:\n• ' + validationErrors.join('\n• ');
        this.showNotification(errorMessage, 'error');
        
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalBtnText) submitBtn.innerHTML = originalBtnText;
        }
        return;
      }
      const response = await this.apiClient.update_usuario(this.currentUser.empresaId, this.currentUser._id, formData);
      const result = await response.json();
      
      const isSuccess = response.status === 200 || response.ok || result.success === true;
      
      if (isSuccess) {
        this.closeEditModal();
        this.showSuccessModal(result.message || 'Usuario actualizado exitosamente');
        
        if (window.usuariosMain && window.usuariosMain.refreshUsers) {
          window.usuariosMain.refreshUsers();
        }
      } else {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalBtnText) submitBtn.innerHTML = originalBtnText;
        }
        
        let errorMessage = 'Error al actualizar usuario';
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          errorMessage = result.errors.length === 1 ? 
            result.errors[0] : 
            'Errores encontrados:\n• ' + result.errors.join('\n• ');
        } else if (result.message) {
          errorMessage = result.message;
        }
        
        this.showNotification(errorMessage, 'error');
      }
    } catch (error) {
      //console.error('Error al actualizar usuario:', error);
      this.showNotification(`Error de conexión: ${error.message}`, 'error');
    } finally {
      this.isUpdating = false;
    }
  }

  closeEditModal() {
    this.closeModal('editUserModal');
  }

  // ===== TOGGLE USER STATUS MODAL =====
  
  showToggleModal(userId, currentStatus, userName) {
    //console.log('🔄 Opening toggle modal for usuario:', userId, 'current status:', currentStatus);
    
    const newStatus = !currentStatus;
    
    this.currentToggleUser = {
      id: userId,
      newStatus: newStatus,
      name: userName
    };
    
    const modal = document.getElementById('toggleUserModal');
    const container = modal?.querySelector('.ios-blur-modal-container');
    const icon = document.getElementById('toggleUserModalIcon') || modal?.querySelector('.toggle-modal-icon');
    const iconFa = icon?.querySelector('i');
    const title = document.getElementById('toggleUserModalTitle');
    const message = document.getElementById('toggleUserModalMessage');
    const confirmText = document.getElementById('toggleConfirmText');
    const confirmIcon = document.getElementById('toggleConfirmIcon');
    
    if (!modal || !title || !message) {
      if (confirm(`¿Estás seguro de que quieres ${newStatus ? 'activar' : 'desactivar'} este usuario?`)) {
        this.confirmToggle();
      }
      return;
    }
    
    // Configurar contenido del modal
    if (newStatus) {
      if (icon) icon.className = 'toggle-modal-icon activate mx-auto mb-4';
      if (iconFa) iconFa.className = 'fas fa-user-check text-4xl';
      title.textContent = 'Activar Usuario';
      message.textContent = `¿Estás seguro de que quieres activar al usuario "${userName}"?`;
      if (confirmText) confirmText.textContent = 'Activar';
      if (confirmIcon) confirmIcon.className = 'fas fa-play mr-2';
    } else {
      if (icon) icon.className = 'toggle-modal-icon deactivate mx-auto mb-4';
      if (iconFa) iconFa.className = 'fas fa-user-times text-4xl';
      title.textContent = 'Desactivar Usuario';
      message.textContent = `¿Estás seguro de que quieres desactivar al usuario "${userName}"?`;
      if (confirmText) confirmText.textContent = 'Desactivar';
      if (confirmIcon) confirmIcon.className = 'fas fa-pause mr-2';
    }
    
    this.openModal('toggleUserModal');
    
    // Animación GSAP si está disponible
    if (typeof gsap !== 'undefined' && container) {
      gsap.set(container, { scale: 0.8, opacity: 0 });
      gsap.to(container, {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    } else if (container) {
      container.style.transform = 'scale(1)';
      container.style.opacity = '1';
    }
  }

  async confirmToggle() {
    if (this.currentToggleUser && this.currentToggleUser.newStatus !== null) {
      const confirmBtn = document.getElementById('toggleUserConfirmBtn');
      const originalContent = confirmBtn?.innerHTML;
      
      if (confirmBtn) {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        confirmBtn.disabled = true;
      }
      
      try {
        const { id, newStatus } = this.currentToggleUser;
        
        let empresaId = window.usuariosMain?.currentEmpresa?._id;
        
        if (!empresaId && window.userRole === 'empresa' && window.empresaId) {
          empresaId = window.empresaId;
        }
        
        if (!empresaId) {
          this.showNotification('No hay empresa seleccionada', 'error');
          if (confirmBtn && originalContent) {
            confirmBtn.innerHTML = originalContent;
            confirmBtn.disabled = false;
          }
          this.closeToggleModal();
          return;
        }
        
        const response = await this.apiClient.toggle_usuario_status(empresaId, id, newStatus);
        const data = await response.json();
        
        const isSuccess = response.status === 200 || response.ok || data.success === true;
        
        if (isSuccess) {
          this.closeToggleModal();
          const actionText = newStatus ? 'activado' : 'desactivado';
          const message = data.message && data.message.toLowerCase().includes(actionText)
            ? data.message
            : `Usuario ${actionText} exitosamente`;
          this.showSuccessModal(message);
          
          if (window.usuariosMain && window.usuariosMain.refreshUsers) {
            setTimeout(() => window.usuariosMain.refreshUsers(), 1000);
          }
        } else {
          if (confirmBtn && originalContent) {
            confirmBtn.innerHTML = originalContent;
            confirmBtn.disabled = false;
          }
          this.showNotification('Error: ' + (data.errors?.[0] || data.message || 'Error desconocido'), 'error');
          this.closeToggleModal();
        }
        
      } catch (error) {
        //console.error('💥 Error al ejecutar toggle:', error);
        if (confirmBtn && originalContent) {
          confirmBtn.innerHTML = originalContent;
          confirmBtn.disabled = false;
        }
        this.showNotification('Error de conexión', 'error');
        this.closeToggleModal();
      }
    }
  }

  closeToggleModal() {
    this.closeModal('toggleUserModal');
    
    // Reset button state
    const confirmBtn = document.getElementById('toggleUserConfirmBtn');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-check" id="toggleConfirmIcon"></i> <span id="toggleConfirmText">Confirmar</span>';
    }
  }

  // ===== CREATE USER MODAL =====
  
  /**
   * Open create modal - MISMA LÓGICA QUE EMPRESAS
   */
  openCreateModal() {
    try {
      //console.log('➕ Abriendo modal de creación de usuario');
      
      // Reset editing state
      this.currentEditingUser = null;
      this.isCreating = false;
      
      // Validate empresa context
      let empresaId = window.usuariosMain?.currentEmpresa?._id;
      
      if (!empresaId && window.userRole === 'empresa' && window.empresaId) {
        empresaId = window.empresaId;
        if (window.usuariosMain && !window.usuariosMain.currentEmpresa) {
          window.usuariosMain.currentEmpresa = {
            _id: window.empresaId,
            nombre: window.empresaNombre || 'Mi Empresa'
          };
        }
      }
      
      if (!empresaId) {
        this.showNotification('No hay empresa seleccionada', 'error');
        return;
      }
      
      // Clear and prepare form
      this.clearCreateForm();
      
      // Open modal - MISMA LÓGICA QUE EMPRESAS
      this.openModal('createUserModal');
      
      // Initialize intl-tel-input after opening modal
      setTimeout(() => {
        this.initIntlTelInput();
      }, 200);
      
    } catch (error) {
      //console.error('💥 Error al abrir modal de creación:', error);
      this.showNotification('Error al abrir modal de creación', 'error');
    }
  }

  clearCreateForm() {
    document.getElementById('createUsername').value = '';
    document.getElementById('createUserEmail').value = '';
    document.getElementById('createUserCedula').value = '';
    document.getElementById('createUserTelefono').value = '';
    document.getElementById('createUserTipoTurno').value = 'medio_dia';
    
    this.especialidades = [];
    this.renderEspecialidades('create');
    
    const sedeElement = document.getElementById('createUserSede');
    if (sedeElement) {
      this.loadSedes(sedeElement);
    }
    
    const rolElement = document.getElementById('createUserRol');
    if (rolElement) {
      this.loadRoles(rolElement);
    }
  }

  clearEditForm() {
    const form = document.getElementById('editUserForm');
    if (form) {
      form.reset();
    }
    this.especialidades = [];
    this.renderEspecialidades('edit');
  }

  async confirmCreate() {
    if (this.isCreating) return;
    
    try {
      this.isCreating = true;
      
      const submitBtn = document.querySelector('#createUserModal [type="submit"], #createUserModal .ios-blur-btn-primary');
      const originalBtnText = submitBtn?.textContent;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando...';
      }
      let empresaId = window.usuariosMain?.currentEmpresa?._id;
      
      if (!empresaId && window.userRole === 'empresa' && window.empresaId) {
        empresaId = window.empresaId;
      }
      
      if (!empresaId) {
        this.showNotification('No hay empresa seleccionada', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalBtnText) submitBtn.innerHTML = originalBtnText;
        }
        return;
      }
      
      const telefonoField = document.getElementById('createUserTelefono');
      let telefonoValue = telefonoField.value.trim();
      
      if (this.createPhoneInput && this.createPhoneInput.getNumber) {
        try {
          const fullNumber = this.createPhoneInput.getNumber();
          if (fullNumber && fullNumber.startsWith('+')) {
            telefonoValue = fullNumber.substring(1);
          }
        } catch (error) {
          //console.error('❌ Error al extraer número completo:', error);
        }
      }
      
      const formData = {
        nombre: document.getElementById('createUsername').value.trim(),
        email: document.getElementById('createUserEmail').value.trim(),
        cedula: document.getElementById('createUserCedula').value.trim(),
        especialidades: this.especialidades.filter(esp => esp.trim() !== ''),
        sede: document.getElementById('createUserSede').value.trim(),
        telefono: telefonoValue,
        tipo_turno: document.getElementById('createUserTipoTurno').value,
        rol: document.getElementById('createUserRol').value
      };
      // Validación
      const validationErrors = [];
      if (!formData.nombre || formData.nombre.length < 2) {
        validationErrors.push('El nombre es obligatorio y debe tener al menos 2 caracteres');
      }
      if (!formData.email) {
        validationErrors.push('El correo es obligatorio');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        validationErrors.push('El formato del correo no es válido');
      }
      if (!formData.cedula) {
        validationErrors.push('La cédula es obligatoria');
      } else if (!/^\d{6,15}$/.test(formData.cedula)) {
        validationErrors.push('La cédula debe contener solo números y tener entre 6 y 15 dígitos');
      }
      if (!formData.telefono) {
        validationErrors.push('El teléfono es obligatorio');
      } else if (!/^\d{7,18}$/.test(formData.telefono)) {
        validationErrors.push('El teléfono debe contener solo números y tener entre 7 y 18 dígitos');
      }
      if (!formData.sede) validationErrors.push('Debe seleccionar una sede');
      if (!formData.tipo_turno) validationErrors.push('Debe seleccionar un tipo de turno');
      if (!formData.rol) validationErrors.push('Debe seleccionar un rol');
      
      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.length === 1 ? 
          validationErrors[0] : 
          'Errores de validación:\n• ' + validationErrors.join('\n• ');
        this.showNotification(errorMessage, 'error');
        
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalBtnText) submitBtn.innerHTML = originalBtnText;
        }
        return;
      }
      const response = await this.apiClient.create_usuario(empresaId, formData);
      const result = await response.json();
      
      const isSuccess = response.status === 200 || response.status === 201 || response.ok || result.success === true;
      
      if (isSuccess) {
        this.closeCreateModal();
        this.showSuccessModal(result.message || 'Usuario creado exitosamente');
        
        if (window.usuariosMain && window.usuariosMain.refreshUsers) {
          window.usuariosMain.refreshUsers();
        }
      } else {
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalBtnText) submitBtn.innerHTML = originalBtnText;
        }
        
        let errorMessage = 'Error al crear usuario';
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          errorMessage = result.errors.length === 1 ? 
            result.errors[0] : 
            'Errores encontrados:\n• ' + result.errors.join('\n• ');
        } else if (result.message) {
          errorMessage = result.message;
        }
        
        this.showNotification(errorMessage, 'error');
      }
    } catch (error) {
      //console.error('Error al crear usuario:', error);
      this.showNotification(`Error de conexión: ${error.message}`, 'error');
    } finally {
      this.isCreating = false;
    }
  }

  closeCreateModal() {
    this.closeModal('createUserModal');
  }

  // ===== SUCCESS MODAL =====
  
  showSuccessModal(message) {
    const title = document.getElementById('userUpdateModalTitle');
    const messageEl = document.getElementById('userUpdateModalMessage');
    
    if (title) {
      if (message.includes('creado')) {
        title.textContent = '¡Usuario Creado!';
      } else if (message.includes('actualizado')) {
        title.textContent = '¡Usuario Actualizado!';
      } else if (message.includes('activado')) {
        title.textContent = '¡Usuario Activado!';
      } else if (message.includes('desactivado')) {
        title.textContent = '¡Usuario Desactivado!';
      } else {
        title.textContent = '¡Operación Exitosa!';
      }
    }
    
    if (messageEl) {
      messageEl.textContent = message;
    }
    
    this.openModal('userUpdateModal');
  }

  closeUpdateModal() {
    this.closeModal('userUpdateModal');
  }

  // ===== ESPECIALIDADES MANAGEMENT =====
  
  addEspecialidad(modalType) {
    this.especialidades.push('');
    this.renderEspecialidades(modalType);
    
    setTimeout(() => {
      const inputs = document.querySelectorAll('.usuario-especialidad-input');
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) lastInput.focus();
    }, 100);
  }
  
  removeEspecialidad(index, modalType) {
    this.especialidades.splice(index, 1);
    this.renderEspecialidades(modalType);
  }
  
  updateEspecialidad(index, value) {
    this.especialidades[index] = value;
  }
  
  renderEspecialidades(modalType) {
    const container = document.getElementById(`${modalType}EspecialidadesList`);
    if (!container) return;
    
    container.innerHTML = '';
    
    this.especialidades.forEach((especialidad, index) => {
      const especialidadItem = document.createElement('div');
      especialidadItem.className = 'flex items-center space-x-2 mb-2';
      
      especialidadItem.innerHTML = `
        <input type="text" class="ios-blur-input flex-1 usuario-especialidad-input" 
               value="${especialidad}" 
               placeholder="Escribir especialidad..." 
               onchange="usuariosModals.updateEspecialidad(${index}, this.value)">
        <button type="button" class="ios-blur-btn ios-blur-btn-secondary !p-2 !min-w-0" 
                onclick="usuariosModals.removeEspecialidad(${index}, '${modalType}')" 
                title="Eliminar especialidad">
          <i class="fas fa-trash text-sm"></i>
        </button>
      `;
      
      container.appendChild(especialidadItem);
    });
    
    if (this.especialidades.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'text-center text-gray-400 text-sm py-4';
      emptyState.innerHTML = '<i class="fas fa-info-circle mr-2"></i>No hay especialidades agregadas';
      container.appendChild(emptyState);
    }
  }

  // ===== LOAD DATA =====
  loadSedes(selectElement) {
    const empresaId = window.usuariosMain?.currentEmpresa?._id || window.empresaId;
    if (!empresaId || !this.apiClient) return;
    
    this.apiClient.get_empresa(empresaId).then(response => response.json()).then(data => {
      if (data.success && data.data && data.data.sedes) {
        selectElement.innerHTML = '<option value="">Seleccionar sede...</option>' + 
          data.data.sedes.map(sede => `<option value="${sede}">${sede}</option>`).join('');
      }
    }).catch(error => {
      //console.error('Error loading sedes:', error);
      selectElement.innerHTML = '<option value="">Error cargando sedes</option>';
    });
  }
  
  loadRoles(selectElement) {
    const empresaId = window.usuariosMain?.currentEmpresa?._id || window.empresaId;
    if (!empresaId || !this.apiClient) return;
    
    this.apiClient.get_empresa(empresaId).then(response => response.json()).then(data => {
      if (data.success && data.data && data.data.roles) {
        selectElement.innerHTML = '<option value="">Seleccionar rol...</option>' + 
          data.data.roles.map(rol => `<option value="${rol}">${rol}</option>`).join('');
      } else {
        selectElement.innerHTML = '<option value="">No hay roles disponibles</option>';
      }
    }).catch(error => {
      //console.error('Error loading roles:', error);
      selectElement.innerHTML = '<option value="">Error cargando roles</option>';
    });
  }

  // ===== NOTIFICATIONS =====
  showNotification(message, type = 'info') {
    if (window.usuariosMain && window.usuariosMain.showEnhancedNotification) {
      window.usuariosMain.showEnhancedNotification(message, type);
    } else {
      this.showFallbackNotification(message, type);
    }
  }

  showFallbackNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.fallback-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = 'fallback-notification fixed top-4 right-4 max-w-sm w-full';
    notification.style.zIndex = '999999';
    
    let iconClass, bgClass;
    if (type === 'error') {
      iconClass = 'fas fa-exclamation-circle';
      bgClass = 'bg-red-500';
    } else {
      iconClass = 'fas fa-check-circle';
      bgClass = 'bg-green-500';
    }
    
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    notification.innerHTML = `
      <div class="${bgClass} text-white p-4 rounded-lg shadow-xl max-w-md">
        <div class="flex items-start">
          <div class="flex-shrink-0 mt-1">
            <i class="${iconClass} text-lg"></i>
          </div>
          <div class="ml-3 flex-1 min-w-0">
            <p class="text-sm font-medium whitespace-pre-line break-words">${formattedMessage}</p>
          </div>
          <div class="ml-2 flex-shrink-0">
            <button onclick="this.closest('.fallback-notification').remove()" class="text-white hover:text-gray-200 transition-colors p-1">
              <i class="fas fa-times text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }

  // ===== GLOBAL FUNCTIONS =====
  
  viewUser(userId) {
    this.openViewModal(userId);
  }
  editUser(userId) {
    this.openEditModal(userId);
  }
  toggleUser(userId, currentStatus, userName) {
    this.showToggleModal(userId, currentStatus, userName);
  }
}

// Initialize usuarios modals
const usuariosModals = new UsuariosModals();
// Export for global access
window.usuariosModals = usuariosModals;
// Backward compatibility functions
window.openCreateUsuarioModal = () => usuariosModals.openCreateModal();
window.viewUser = (userId) => usuariosModals.openViewModal(userId);
window.editUser = (userId) => usuariosModals.openEditModal(userId);
window.toggleUser = (userId, currentStatus, userName) => usuariosModals.showToggleModal(userId, currentStatus, userName);
// Modal control functions
window.closeToggleModal = () => usuariosModals.closeToggleModal();
window.confirmToggle = () => usuariosModals.confirmToggle();
window.closeUpdateModal = () => usuariosModals.closeUpdateModal();
////console.log('👥 Usuarios modals module loaded - MODALSCROLLMANAGER VERSION');