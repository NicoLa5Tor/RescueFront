/**
 * USUARIOS MODALS MANAGER
 * Sistema completo para gestión de modales de usuarios usando estilos del hardware
 */

class UsuariosModals {
  constructor() {
    this.currentUser = null;
    this.currentToggleUser = null;
    this.apiClient = null;
    this.especialidades = [];
    
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
      
      console.log('👥 Modales de usuarios inicializados correctamente');
      
    } catch (error) {
      console.error('💥 Error al inicializar modales de usuarios:', error);
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
   * Setup event listeners
   */
  setupEventListeners() {
    // ESC key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Click outside modal to close
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('ios-modal-backdrop')) {
        this.closeAllModals();
      }
    });
  }

  /**
   * ===== VIEW USER MODAL =====
   */
  
  /**
   * Open view user modal
   */
  async openViewModal(userId) {
    try {
      console.log('👁️ Abriendo modal de vista para usuario:', userId);
      
      // Get current empresa ID
      const empresaId = window.usuariosMain?.currentEmpresa?._id;
      if (!empresaId) {
        this.showNotification('No hay empresa seleccionada', 'error');
        return;
      }
      
      // Fetch user data
      const response = await this.apiClient.get_usuario(empresaId, userId);
      const result = await response.json();
      
      if (response.ok && result.success) {
        this.populateViewModal(result.data);
        this.openModal('viewUserModal');
      } else {
        const errorMessage = result.errors ? result.errors.join(', ') : 'Error al cargar datos del usuario';
        this.showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error al abrir modal de vista:', error);
      this.showNotification('Error al cargar usuario', 'error');
    }
  }

  /**
   * Populate view modal with user data
   */
  populateViewModal(user) {
    document.getElementById('viewUsername').textContent = user.nombre || 'N/A';
    document.getElementById('viewUserEmail').textContent = user.email || 'N/A';
    document.getElementById('viewUserStatus').textContent = user.activo ? 'Activo' : 'Inactivo';
    
    // Populate additional fields if elements exist
    const cedula = document.getElementById('viewUserCedula');
    if (cedula) cedula.textContent = user.cedula || 'N/A';
    
    const telefono = document.getElementById('viewUserTelefono');
    if (telefono) telefono.textContent = user.telefono || 'N/A';
    
    // Handle especialidades as array
    const especialidadesContainer = document.getElementById('viewUserEspecialidades');
    if (especialidadesContainer) {
      this.populateViewEspecialidades(user.especialidades || []);
    }
    
    const sede = document.getElementById('viewUserSede');
    if (sede) sede.textContent = user.sede || 'N/A';
    
    const tipoTurno = document.getElementById('viewUserTipoTurno');
    if (tipoTurno) {
      const tipoTurnoTextos = {
        'medio_dia': 'Medio día',
        'dia_completo': 'Día completo',
        'nocturno': 'Nocturno',
        '24_horas': '24 horas'
      };
      tipoTurno.textContent = tipoTurnoTextos[user.tipo_turno] || 'N/A';
    }
    
    const rol = document.getElementById('viewUserRol');
    if (rol) rol.textContent = user.rol || 'N/A';
  }

  /**
   * Close view modal
   */
  closeViewModal() {
    this.closeModal('viewUserModal');
  }

  /**
   * ===== EDIT USER MODAL =====
   */
  
  /**
   * Open edit user modal
   */
  async openEditModal(userId) {
    try {
      console.log('✏️ Abriendo modal de edición para usuario:', userId);
      
      // Get current empresa ID
      const empresaId = window.usuariosMain?.currentEmpresa?._id;
      if (!empresaId) {
        this.showNotification('No hay empresa seleccionada', 'error');
        return;
      }
      
      // Fetch user data
      const response = await this.apiClient.get_usuario(empresaId, userId);
      const result = await response.json();
      
      if (response.ok && result.success) {
        this.currentUser = result.data;
        this.currentUser.empresaId = empresaId; // Store empresa ID for updates
        this.populateEditModal(result.data);
        this.openModal('editUserModal');
      } else {
        const errorMessage = result.errors ? result.errors.join(', ') : 'Error al cargar datos del usuario';
        this.showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error al abrir modal de edición:', error);
      this.showNotification('Error al cargar usuario', 'error');
    }
  }

  /**
   * Populate edit modal with user data
   */
  populateEditModal(user) {
    document.getElementById('editUsername').value = user.nombre || '';
    document.getElementById('editUserEmail').value = user.email || '';
    
    // Populate additional fields if they exist
    const cedula = document.getElementById('editUserCedula');
    if (cedula) cedula.value = user.cedula || '';
    
    // Handle especialidades as array
    this.especialidades = user.especialidades || [];
    this.renderEspecialidades('edit');
    
    const sede = document.getElementById('editUserSede');
    if (sede) {
      this.loadSedes(sede);
      setTimeout(() => {
        sede.value = user.sede || '';
      }, 100);
    }
    
    const telefono = document.getElementById('editUserTelefono');
    if (telefono) telefono.value = user.telefono || '';
    
    const tipoTurno = document.getElementById('editUserTipoTurno');
    if (tipoTurno) tipoTurno.value = user.tipo_turno || 'medio_dia';
    
    const rol = document.getElementById('editUserRol');
    if (rol) {
      this.loadRoles(rol);
      setTimeout(() => {
        rol.value = user.rol || '';
      }, 100);
    }
  }

  /**
   * Confirm user edit
   */
  async confirmEdit() {
    try {
      if (!this.currentUser) {
        this.showNotification('No hay usuario seleccionado', 'error');
        return;
      }

      // Get form data
      const formData = {
        nombre: document.getElementById('editUsername').value.trim(),
        email: document.getElementById('editUserEmail').value.trim(),
        cedula: document.getElementById('editUserCedula').value.trim(),
        especialidades: this.especialidades.filter(esp => esp.trim() !== ''),
        sede: document.getElementById('editUserSede').value.trim(),
        telefono: document.getElementById('editUserTelefono').value.trim(),
        tipo_turno: document.getElementById('editUserTipoTurno').value,
        rol: document.getElementById('editUserRol').value
      };

      // Validate form
      if (!formData.nombre || !formData.email) {
        this.showNotification('Nombre y email son requeridos', 'error');
        return;
      }

      // Update user
      const response = await this.apiClient.update_usuario(this.currentUser.empresaId, this.currentUser._id, formData);
      
      if (response.ok) {
        this.closeEditModal();
        this.showSuccessModal('Usuario actualizado exitosamente');
        
        // Refresh users list if available
        if (window.usuariosMain && window.usuariosMain.refreshUsers) {
          window.usuariosMain.refreshUsers();
        }
      } else {
        const errorData = await response.json();
        this.showNotification(errorData.message || 'Error al actualizar usuario', 'error');
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      this.showNotification('Error al actualizar usuario', 'error');
    }
  }

  /**
   * Close edit modal
   */
  closeEditModal() {
    this.closeModal('editUserModal');
    this.currentUser = null;
  }

  /**
   * ===== TOGGLE USER STATUS MODAL =====
   */
  
  /**
   * Open toggle status modal
   */
  showToggleModal(userId, currentStatus, userName) {
    console.log('🔄 Abriendo modal de toggle para usuario:', userId, 'estado actual:', currentStatus);
    
    const newStatus = !currentStatus;
    const action = newStatus ? 'activar' : 'desactivar';
    
    // Store toggle data
    this.currentToggleUser = {
      id: userId,
      newStatus: newStatus,
      name: userName
    };
    
    // Update modal content
    const title = document.getElementById('toggleUserModalTitle');
    const message = document.getElementById('toggleUserModalMessage');
    const icon = document.querySelector('#toggleUserModal .toggle-modal-icon i');
    
    if (newStatus) {
      title.textContent = 'Activar Usuario';
      message.textContent = `¿Estás seguro de que quieres activar al usuario "${userName}"?`;
      icon.className = 'fas fa-user-check text-4xl';
    } else {
      title.textContent = 'Desactivar Usuario';
      message.textContent = `¿Estás seguro de que quieres desactivar al usuario "${userName}"?`;
      icon.className = 'fas fa-user-times text-4xl';
    }
    
    this.openModal('toggleUserModal');
  }

  /**
   * Confirm toggle user status
   */
  async confirmToggle() {
    try {
      if (!this.currentToggleUser) {
        this.showNotification('No hay usuario seleccionado', 'error');
        return;
      }

      const { id, newStatus, name } = this.currentToggleUser;
      
      // Get current empresa ID
      const empresaId = window.usuariosMain?.currentEmpresa?._id;
      if (!empresaId) {
        this.showNotification('No hay empresa seleccionada', 'error');
        return;
      }
      
      // Toggle user status
      const response = await this.apiClient.toggle_usuario_status(empresaId, id, newStatus);
      
      if (response.ok) {
        this.closeToggleModal();
        const action = newStatus ? 'activado' : 'desactivado';
        this.showSuccessModal(`Usuario "${name}" ${action} exitosamente`);
        
        // Refresh users list if available
        if (window.usuariosMain && window.usuariosMain.refreshUsers) {
          window.usuariosMain.refreshUsers();
        }
      } else {
        const errorData = await response.json();
        this.showNotification(errorData.message || 'Error al cambiar estado del usuario', 'error');
      }
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      this.showNotification('Error al cambiar estado del usuario', 'error');
    }
  }

  /**
   * Close toggle modal
   */
  closeToggleModal() {
    this.closeModal('toggleUserModal');
    this.currentToggleUser = null;
  }

  /**
   * ===== CREATE USER MODAL =====
   */
  
  /**
   * Open create user modal
   */
  openCreateModal() {
    try {
      console.log('➕ Abriendo modal de creación de usuario');
      
      // Get current empresa ID
      const empresaId = window.usuariosMain?.currentEmpresa?._id;
      if (!empresaId) {
        this.showNotification('No hay empresa seleccionada', 'error');
        return;
      }
      
      // Clear form
      this.clearCreateForm();
      this.openModal('createUserModal');
    } catch (error) {
      console.error('Error al abrir modal de creación:', error);
      this.showNotification('Error al abrir modal de creación', 'error');
    }
  }

  /**
   * Clear create form
   */
  clearCreateForm() {
    document.getElementById('createUsername').value = '';
    document.getElementById('createUserEmail').value = '';
    document.getElementById('createUserCedula').value = '';
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
    
    document.getElementById('createUserTelefono').value = '';
    document.getElementById('createUserTipoTurno').value = 'medio_dia';
  }

  /**
   * Confirm user creation
   */
  async confirmCreate() {
    try {
      // Get current empresa ID
      const empresaId = window.usuariosMain?.currentEmpresa?._id;
      if (!empresaId) {
        this.showNotification('No hay empresa seleccionada', 'error');
        return;
      }
      
      // Get form data
      const formData = {
        nombre: document.getElementById('createUsername').value.trim(),
        email: document.getElementById('createUserEmail').value.trim(),
        cedula: document.getElementById('createUserCedula').value.trim(),
        especialidades: this.especialidades.filter(esp => esp.trim() !== ''),
        sede: document.getElementById('createUserSede').value.trim(),
        telefono: document.getElementById('createUserTelefono').value.trim(),
        tipo_turno: document.getElementById('createUserTipoTurno').value,
        rol: document.getElementById('createUserRol').value
      };

      // Validate form
      if (!formData.nombre || !formData.cedula) {
        this.showNotification('Nombre y cédula son requeridos', 'error');
        return;
      }

      // Create user
      const response = await this.apiClient.create_usuario(empresaId, formData);
      const result = await response.json();
      
      if (response.ok && result.success) {
        this.closeCreateModal();
        this.showSuccessModal('Usuario creado exitosamente');
        
        // Refresh users list if available
        if (window.usuariosMain && window.usuariosMain.refreshUsers) {
          window.usuariosMain.refreshUsers();
        }
      } else {
        const errorMessage = result.errors ? result.errors.join(', ') : 'Error al crear usuario';
        this.showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      this.showNotification('Error al crear usuario', 'error');
    }
  }

  /**
   * Close create modal
   */
  closeCreateModal() {
    this.closeModal('createUserModal');
  }

  /**
   * ===== SUCCESS MODAL =====
   */
  
  /**
   * Show success modal
   */
  showSuccessModal(message) {
    document.getElementById('userUpdateModalMessage').textContent = message;
    this.openModal('userUpdateModal');
  }

  /**
   * Close success modal
   */
  closeUpdateModal() {
    this.closeModal('userUpdateModal');
  }

  /**
   * ===== MODAL UTILITIES =====
   */
  
  /**
   * Open modal by ID
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Close modal by ID
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  /**
   * Close all modals
   */
  closeAllModals() {
    const modals = ['viewUserModal', 'editUserModal', 'createUserModal', 'toggleUserModal', 'userUpdateModal'];
    modals.forEach(modalId => this.closeModal(modalId));
    
    // Reset current data
    this.currentUser = null;
    this.currentToggleUser = null;
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    if (window.usuariosMain && window.usuariosMain.showEnhancedNotification) {
      window.usuariosMain.showEnhancedNotification(message, type);
    } else {
      // Fallback notification
      this.showFallbackNotification(message, type);
    }
  }

  /**
   * Fallback notification
   */
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
    
    notification.innerHTML = `
      <div class="${bgClass} text-white p-4 rounded-lg shadow-xl">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="${iconClass} text-xl"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium">${message}</p>
          </div>
          <div class="ml-auto pl-3">
            <button onclick="this.closest('.fallback-notification').remove()" class="text-white hover:text-gray-200 transition-colors">
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
   * ===== GLOBAL FUNCTIONS =====
   */
  
  /**
   * View user function (for external calls)
   */
  viewUser(userId) {
    this.openViewModal(userId);
  }

  /**
   * Edit user function (for external calls)
   */
  editUser(userId) {
    this.openEditModal(userId);
  }

  /**
   * Toggle user function (for external calls)
   */
  toggleUser(userId, currentStatus, userName) {
    this.showToggleModal(userId, currentStatus, userName);
  }

  /**
   * ===== ESPECIALIDADES MANAGEMENT =====
   */
  
  /**
   * Add especialidad
   */
  addEspecialidad(modalType) {
    this.especialidades.push('');
    this.renderEspecialidades(modalType);
    
    // Focus on the new input
    setTimeout(() => {
      const inputs = document.querySelectorAll('.usuario-especialidad-input');
      const lastInput = inputs[inputs.length - 1];
      if (lastInput) lastInput.focus();
    }, 100);
  }
  
  /**
   * Remove especialidad
   */
  removeEspecialidad(index, modalType) {
    this.especialidades.splice(index, 1);
    this.renderEspecialidades(modalType);
  }
  
  /**
   * Update especialidad
   */
  updateEspecialidad(index, value) {
    this.especialidades[index] = value;
  }
  
  /**
   * Clear all especialidades
   */
  clearEspecialidades(modalType) {
    this.especialidades = [];
    this.renderEspecialidades(modalType);
  }
  
  /**
   * Render especialidades list
   */
  renderEspecialidades(modalType) {
    const container = document.getElementById(`${modalType}EspecialidadesList`);
    if (!container) return;
    
    container.innerHTML = '';
    
    this.especialidades.forEach((especialidad, index) => {
      const especialidadItem = document.createElement('div');
      especialidadItem.className = 'usuario-especialidad-item flex items-center space-x-2';
      
      especialidadItem.innerHTML = `
        <input type="text" class="usuario-especialidad-input flex-1 p-2 bg-gray-700 text-white rounded text-sm" 
               value="${especialidad}" 
               placeholder="Escribir especialidad..." 
               onchange="usuariosModals.updateEspecialidad(${index}, this.value)">
        <button type="button" class="text-red-400 hover:text-red-300 p-1" 
                onclick="usuariosModals.removeEspecialidad(${index}, '${modalType}')" 
                title="Eliminar especialidad">
          <i class="fas fa-trash text-sm"></i>
        </button>
      `;
      
      container.appendChild(especialidadItem);
    });
    
    // Show empty state if no especialidades
    if (this.especialidades.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'text-center text-gray-400 text-sm py-4';
      emptyState.innerHTML = '<i class="fas fa-info-circle mr-2"></i>No hay especialidades agregadas';
      container.appendChild(emptyState);
    }
  }
  
  /**
   * Populate view especialidades
   */
  populateViewEspecialidades(especialidades) {
    const container = document.getElementById('viewUserEspecialidades');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!especialidades || especialidades.length === 0) {
      const emptySpan = document.createElement('span');
      emptySpan.className = 'text-gray-400 text-sm';
      emptySpan.textContent = 'Sin especialidades';
      container.appendChild(emptySpan);
      return;
    }
    
    especialidades.forEach(especialidad => {
      const badge = document.createElement('span');
      badge.className = 'px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium';
      badge.textContent = especialidad;
      container.appendChild(badge);
    });
  }

  /**
   * Load sedes based on current empresa
   */
  loadSedes(selectElement) {
    const empresaId = window.usuariosMain?.currentEmpresa?._id;
    if (!empresaId || !this.apiClient) return;

    this.apiClient.get_empresa(empresaId).then(response => response.json()).then(data => {
      if (data.success && data.data && data.data.sedes) {
        selectElement.innerHTML = '<option value="">Seleccionar sede...</option>' + 
          data.data.sedes.map(sede => `<option value="${sede}">${sede}</option>`).join('');
      }
    }).catch(error => {
      console.error('Error loading sedes:', error);
      selectElement.innerHTML = '<option value="">Error cargando sedes</option>';
    });
  }
  
  /**
   * Load roles based on current empresa
   */
  loadRoles(selectElement) {
    const empresaId = window.usuariosMain?.currentEmpresa?._id;
    if (!empresaId || !this.apiClient) return;

    this.apiClient.get_empresa(empresaId).then(response => response.json()).then(data => {
      if (data.success && data.data && data.data.roles) {
        selectElement.innerHTML = '<option value="">Seleccionar rol...</option>' + 
          data.data.roles.map(rol => `<option value="${rol}">${rol}</option>`).join('');
      } else {
        selectElement.innerHTML = '<option value="">No hay roles disponibles</option>';
      }
    }).catch(error => {
      console.error('Error loading roles:', error);
      selectElement.innerHTML = '<option value="">Error cargando roles</option>';
    });
  }
}

// Initialize usuarios modals immediately and when DOM is ready
function initializeUsuariosModals() {
  console.log('🚀 Inicializando sistema de modales de usuarios...');
  
  // Create global instance
  window.usuariosModals = new UsuariosModals();
  
  // Export global functions for backward compatibility
  window.viewUser = (userId) => window.usuariosModals.viewUser(userId);
  window.editUser = (userId) => window.usuariosModals.editUser(userId);
  window.toggleUser = (userId, currentStatus, userName) => window.usuariosModals.toggleUser(userId, currentStatus, userName);
  window.openCreateUsuarioModal = () => window.usuariosModals.openCreateModal();
  
  console.log('✅ Sistema de modales de usuarios inicializado correctamente');
}

// Initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUsuariosModals);
} else {
  initializeUsuariosModals();
}
