/**
 * ===== USUARIOS MODALS FUNCTIONALITY =====
 * 
 * Este archivo contiene la funcionalidad para todos los modales de usuarios:
 * - Modal de crear usuario
 * - Modal de editar usuario
 * - Modal de ver detalles
 * - Modal de confirmar toggle status
 * - Modal de confirmaciones y success
 * 
 * COPIADO EXACTAMENTE DE EMPRESAS-MODALS.JS
 */

class UsuariosModals {
  constructor() {
    this.currentEditingUser = null;
    this.currentViewingUser = null;
    this.currentToggleUser = null;
    this.apiClient = null;
    this.especialidades = [];
    this.isCreating = false;
    this.isUpdating = false;
    
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
    // Form submission
    const createForm = document.getElementById('createUserForm');
    if (createForm) {
createForm.addEventListener('submit', (e) => {
        e.preventDefault();  // Stop form from submitting to prevent modal close
        this.confirmCreate();
      });
    }
    
    const editForm = document.getElementById('editUserForm');
    if (editForm) {
editForm.addEventListener('submit', (e) => {
        e.preventDefault();  // Stop form from submitting to prevent modal close
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
            this.closeModalById(modalId);
          }
        });
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
      
      // Get current empresa ID - para usuarios empresa, usar empresaId del contexto
      let empresaId = window.usuariosMain?.currentEmpresa?._id;
      
      // Si no hay empresa seleccionada pero es usuario tipo empresa, usar su ID
      if (!empresaId && window.userRole === 'empresa' && window.empresaId) {
        empresaId = window.empresaId;
      }
      
      if (!empresaId) {
        this.showNotification('No hay empresa seleccionada', 'error');
        return;
      }
      
      console.log('🌐 Empresa ID:', empresaId, 'Usuario ID:', userId);
      
      // Fetch user data
      const response = await this.apiClient.get_usuario(empresaId, userId);
      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      const result = await response.json();
      console.log('📋 Datos del resultado:', result);
      
      if (response.ok && result.success && result.data) {
        console.log('✅ Usuario cargado exitosamente:', result.data);
        this.populateViewModal(result.data);
        this.openModal('viewUserModal');
      } else {
        console.log('❌ Error en la respuesta:', result);
        const errorMessage = result.errors ? result.errors.join(', ') : (result.message || 'Error al cargar datos del usuario');
        this.showNotification(errorMessage, 'error');
      }
    } catch (error) {
      console.error('💥 Error al abrir modal de vista:', error);
      this.showNotification(`Error al cargar usuario: ${error.message}`, 'error');
    }
  }

  /**
   * Populate view modal with user data
   */
  populateViewModal(user) {
    console.log('📝 Populando modal de vista con datos:', user);
    
    // Ensure user data is valid
    if (!user) {
      console.error('❌ No se recibieron datos de usuario');
      return;
    }
    
    // Safe data processing
    const nombre = user.nombre || 'Sin nombre';
    const email = user.email || 'N/A';
    const cedula = user.cedula || 'N/A';
    const telefono = user.telefono || 'N/A';
    const estado = user.activo ? 'Activo' : 'Inactivo';
    const sede = user.sede || 'N/A';
    const tipoTurno = user.tipo_turno || 'N/A';
    const rol = user.rol || 'N/A';
    
    // Handle especialidades safely
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
      console.log('✅ Modal de vista populado exitosamente');
    } else {
      console.error('❌ No se encontró el contenedor viewUserContent');
    }
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
      
      // Get current empresa ID - para usuarios empresa, usar empresaId del contexto
      let empresaId = window.usuariosMain?.currentEmpresa?._id;
      
      // Si no hay empresa seleccionada pero es usuario tipo empresa, usar su ID
      if (!empresaId && window.userRole === 'empresa' && window.empresaId) {
        empresaId = window.empresaId;
      }
      
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
    // Prevent multiple submissions
    if (this.isUpdating) {
      console.log('⏳ Ya hay una actualización en progreso, ignorando...');
      return;
    }
    
    try {
      this.isUpdating = true;
      
      // Disable submit button to prevent double clicks
      const submitBtn = document.querySelector('#editUserModal [type="submit"], #editUserModal .ios-blur-btn-primary');
      const originalBtnText = submitBtn?.textContent;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Actualizando...';
      }
      if (!this.currentUser) {
        this.showNotification('No hay usuario seleccionado', 'error');
        
        // Restore submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalBtnText) {
            submitBtn.innerHTML = originalBtnText;
          } else {
            submitBtn.innerHTML = 'Actualizar Usuario';
          }
        }
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

      // Validar formulario y construir mensajes en español
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
      } else if (!/^\d{7,15}$/.test(formData.telefono)) {
        validationErrors.push('El teléfono debe contener solo números y tener entre 7 y 15 dígitos');
      }

      if (!formData.sede) {
        validationErrors.push('Debe seleccionar una sede');
      }

      if (!formData.tipo_turno) {
        validationErrors.push('Debe seleccionar un tipo de turno');
      }

      if (!formData.rol) {
        validationErrors.push('Debe seleccionar un rol');
      }
      
      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.length === 1 ? 
          validationErrors[0] : 
          'Errores de validación:\n• ' + validationErrors.join('\n• ');
        this.showNotification(errorMessage, 'error');
        
        // Restore submit button on validation error
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalBtnText) {
            submitBtn.innerHTML = originalBtnText;
          } else {
            submitBtn.innerHTML = 'Actualizar Usuario';
          }
        }
        return;
      }

      // Update user
      const response = await this.apiClient.update_usuario(this.currentUser.empresaId, this.currentUser._id, formData);
      
      const result = await response.json();
      console.log('📡 Respuesta al actualizar usuario:');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);
      console.log('  - Result:', result);
      console.log('🔍 DEBUG: response.ok =', response.ok);
      console.log('🔍 DEBUG: response.status =', response.status);
      console.log('🔍 DEBUG: result.success =', result.success);
      
      // Success if status is 200 or result.success is true
      const isSuccess = response.status === 200 || response.ok || result.success === true;
      console.log('🔍 DEBUG: isSuccess =', isSuccess);
      
      if (isSuccess) {
        console.log('✅ Usuario actualizado exitosamente, cerrando modal');
        this.closeEditModal();
        this.showSuccessModal(result.message || 'Usuario actualizado exitosamente');
        
        // Refresh users list if available
        if (window.usuariosMain && window.usuariosMain.refreshUsers) {
          window.usuariosMain.refreshUsers();
        }
      } else {
        // Restore submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalBtnText) {
            submitBtn.innerHTML = originalBtnText;
          } else {
            submitBtn.innerHTML = 'Actualizar Usuario';
          }
        }
        
        console.log('❌ Error al actualizar usuario - NO cerrando modal');
        
        // Construir mensaje de error específico
        let errorMessage = 'Error al actualizar usuario';
        
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          // Si hay errores específicos, mostrarlos
          if (result.errors.length === 1) {
            errorMessage = result.errors[0];
          } else {
            errorMessage = 'Errores encontrados:\n• ' + result.errors.join('\n• ');
          }
        } else if (result.message) {
          // Si hay mensaje del servidor, usarlo
          errorMessage = result.message;
        } else {
          // Mensaje genérico con código de estado si está disponible
          errorMessage = `Error al actualizar usuario (${response.status}: ${response.statusText})`;
        }
        
        console.log('📋 Mostrando error:', errorMessage);
        this.showNotification(errorMessage, 'error');
        
        // NO cerrar el modal para que el usuario pueda corregir los errores
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      this.showNotification(`Error de conexión: ${error.message}`, 'error');
      
      // Restore submit button on error
      if (submitBtn) {
        submitBtn.disabled = false;
        if (originalBtnText) {
          submitBtn.innerHTML = originalBtnText;
        } else {
          submitBtn.innerHTML = 'Actualizar Usuario';
        }
      }
      // NO cerrar el modal en caso de error de conexión
    } finally {
      // Always reset updating flag
      this.isUpdating = false;
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
   * Show toggle modal - SAME STYLE AS EMPRESAS/HARDWARE
   */
  showToggleModal(userId, currentStatus, userName) {
    console.log('🔄 Opening toggle modal for usuario:', userId, 'current status:', currentStatus);
    
    const newStatus = !currentStatus;
    const action = newStatus ? 'activar' : 'desactivar';
    
    // Store toggle data
    this.currentToggleUser = {
      id: userId,
      newStatus: newStatus,
      name: userName
    };
    
    // Get modal elements
    const modal = document.getElementById('toggleUserModal');
    const container = modal?.querySelector('.ios-blur-modal-container');
    const icon = document.getElementById('toggleUserModalIcon') || modal?.querySelector('.toggle-modal-icon');
    const iconFa = icon?.querySelector('i');
    const title = document.getElementById('toggleUserModalTitle');
    const message = document.getElementById('toggleUserModalMessage');
    const confirmText = document.getElementById('toggleConfirmText');
    const confirmIcon = document.getElementById('toggleConfirmIcon');
    
    if (!modal || !title || !message) {
      console.error('❌ Toggle modal elements missing!');
      // Fallback to simple confirm
      if (confirm(`¿Estás seguro de que quieres ${action} este usuario?`)) {
        this.confirmToggle();
      }
      return;
    }
    
    // Configure modal content
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
    
    // SCROLL INSTANTÁNEO AL TOP SIN ANIMACIÓN
    // try {
    //   window.scrollTo({
    //     top: 0,
    //     left: 0,
    //     behavior: 'instant'
    //   });
    // } catch (e) {
    // }
    
    // Show modal using modalManager
    if (window.modalManager) {
      window.modalManager.openModal('toggleUserModal');
    } else {
      // Fallback
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
      document.body.classList.add('modal-open');
    }
    
    console.log('✅ Toggle modal should now be visible');
    
    // GSAP animation
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

  /**
   * Confirm toggle - SAME AS EMPRESAS/HARDWARE
   */
  async confirmToggle() {
    console.log('🛠️ DEBUG: Iniciando confirmToggle');
    console.log('  - currentToggleUser:', this.currentToggleUser);
    console.log('  - Empresa actual:', window.usuariosMain?.currentEmpresa);
    
    if (this.currentToggleUser && this.currentToggleUser.newStatus !== null) {
      // Show loading state
      const confirmBtn = document.getElementById('toggleUserConfirmBtn');
      const originalContent = confirmBtn?.innerHTML;
      
      if (confirmBtn) {
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        confirmBtn.disabled = true;
      }
      
      try {
        const { id, newStatus, name } = this.currentToggleUser;
        
        console.log(`🔄 Executing toggle for usuario ${id} to ${newStatus ? 'active' : 'inactive'}`);
        
        // Get current empresa ID - para usuarios empresa, usar empresaId del contexto
        let empresaId = window.usuariosMain?.currentEmpresa?._id;
        
        // Si no hay empresa seleccionada pero es usuario tipo empresa, usar su ID
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
        
        console.log(`🌐 Haciendo petición PATCH a: /empresas/${empresaId}/usuarios/${id}/toggle-status`);
        console.log('📦 Datos a enviar:', { activo: newStatus });
        
        const response = await this.apiClient.toggle_usuario_status(empresaId, id, newStatus);
        
        console.log('📡 Respuesta del servidor:');
        console.log('  - Status:', response.status);
        console.log('  - Status Text:', response.statusText);
        console.log('  - Headers:', [...response.headers.entries()]);
        
        const data = await response.json();
        console.log('📋 Datos de respuesta:', data);
        console.log('🔍 DEBUG: response.ok =', response.ok);
        console.log('🔍 DEBUG: response.status =', response.status);
        console.log('🔍 DEBUG: data.success =', data.success);
        
        // Success if status is 200 or data.success is true
        const isSuccess = response.status === 200 || response.ok || data.success === true;
        console.log('🔍 DEBUG: isSuccess =', isSuccess);
        
        if (isSuccess) {
          console.log('✅ Toggle exitoso, cerrando modal y mostrando éxito');
          this.closeToggleModal();
          this.showSuccessModal(data.message || `Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`);
          
          // Reload users list
          if (window.usuariosMain && window.usuariosMain.refreshUsers) {
            setTimeout(() => window.usuariosMain.refreshUsers(), 1000);
          }
        } else {
          console.log('❌ Toggle falló, restaurando botón');
          if (confirmBtn && originalContent) {
            confirmBtn.innerHTML = originalContent;
            confirmBtn.disabled = false;
          }
          this.showNotification('Error: ' + (data.errors?.[0] || data.message || 'Error desconocido'), 'error');
          this.closeToggleModal();
        }
        
      } catch (error) {
        console.error('💥 Error al ejecutar toggle:', error);
        if (confirmBtn && originalContent) {
          confirmBtn.innerHTML = originalContent;
          confirmBtn.disabled = false;
        }
        this.showNotification('Error de conexión', 'error');
        this.closeToggleModal();
      }
    }
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
      
      // Get current empresa ID - para usuarios empresa, usar empresaId del contexto
      let empresaId = window.usuariosMain?.currentEmpresa?._id;
      
      // Si no hay empresa seleccionada pero es usuario tipo empresa, usar su ID
      if (!empresaId && window.userRole === 'empresa' && window.empresaId) {
        empresaId = window.empresaId;
        // Configurar empresa actual si no existe
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
    // Prevent multiple submissions
    if (this.isCreating) {
      console.log('⏳ Ya hay una creación en progreso, ignorando...');
      return;
    }
    
    try {
      this.isCreating = true;
      
      // Disable submit button to prevent double clicks
      const submitBtn = document.querySelector('#createUserModal [type="submit"], #createUserModal .ios-blur-btn-primary');
      const originalBtnText = submitBtn?.textContent;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando...';
      }
      // Get current empresa ID - para usuarios empresa, usar empresaId del contexto
      let empresaId = window.usuariosMain?.currentEmpresa?._id;
      
      // Si no hay empresa seleccionada pero es usuario tipo empresa, usar su ID
      if (!empresaId && window.userRole === 'empresa' && window.empresaId) {
        empresaId = window.empresaId;
      }
      
      if (!empresaId) {
        this.showNotification('No hay empresa seleccionada', 'error');
        // Restore submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalBtnText) {
            submitBtn.innerHTML = originalBtnText;
          } else {
            submitBtn.innerHTML = 'Crear Usuario';
          }
        }
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

      // Validar formulario y construir mensajes en español
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
      } else if (!/^\d{7,15}$/.test(formData.telefono)) {
        validationErrors.push('El teléfono debe contener solo números y tener entre 7 y 15 dígitos');
      }

      if (!formData.sede) {
        validationErrors.push('Debe seleccionar una sede');
      }

      if (!formData.tipo_turno) {
        validationErrors.push('Debe seleccionar un tipo de turno');
      }

      if (!formData.rol) {
        validationErrors.push('Debe seleccionar un rol');
      }
      
      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.length === 1 ? 
          validationErrors[0] : 
          'Errores de validación:\n• ' + validationErrors.join('\n• ');
        this.showNotification(errorMessage, 'error');
        
        // Restore submit button on validation error
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalBtnText) {
            submitBtn.innerHTML = originalBtnText;
          } else {
            submitBtn.innerHTML = 'Crear Usuario';
          }
        }
        return;
      }

      // Create user
      console.log('🌐 Creando usuario con datos:', formData);
      const response = await this.apiClient.create_usuario(empresaId, formData);
      const result = await response.json();
      
      console.log('📡 Respuesta de crear usuario:');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);
      console.log('  - Result:', result);
      console.log('🔍 DEBUG: response.ok =', response.ok);
      console.log('🔍 DEBUG: response.status =', response.status);
      console.log('🔍 DEBUG: result.success =', result.success);
      
      // Success if status is 200/201 or result.success is true
      const isSuccess = response.status === 200 || response.status === 201 || response.ok || result.success === true;
      console.log('🔍 DEBUG: isSuccess =', isSuccess);
      
      if (isSuccess) {
        console.log('✅ Usuario creado exitosamente, cerrando modal');
        this.closeCreateModal();
        this.showSuccessModal(result.message || 'Usuario creado exitosamente');
        
        // Refresh users list if available
        if (window.usuariosMain && window.usuariosMain.refreshUsers) {
          window.usuariosMain.refreshUsers();
        }
      } else {
        // Restore submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          if (originalBtnText) {
            submitBtn.innerHTML = originalBtnText;
          } else {
            submitBtn.innerHTML = 'Actualizar Usuario';
          }
        }
        console.log('❌ Error al crear usuario - NO cerrando modal');
        console.log('🔍 DEBUG: Modal antes del error:', document.getElementById('createUserModal').classList.contains('hidden'));
        
        // Construir mensaje de error específico
        let errorMessage = 'Error al crear usuario';
        
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          // Si hay errores específicos, mostrarlos
          if (result.errors.length === 1) {
            errorMessage = result.errors[0];
          } else {
            errorMessage = 'Errores encontrados:\n• ' + result.errors.join('\n• ');
          }
        } else if (result.message) {
          // Si hay mensaje del servidor, usarlo
          errorMessage = result.message;
        } else {
          // Mensaje genérico con código de estado si está disponible
          errorMessage = `Error al crear usuario (${response.status}: ${response.statusText})`;
        }
        
        console.log('📋 Mostrando error:', errorMessage);
        this.showNotification(errorMessage, 'error');
        
        console.log('🔍 DEBUG: Modal después de error:', document.getElementById('createUserModal').classList.contains('hidden'));
        
        // NO cerrar el modal para que el usuario pueda corregir los errores
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      this.showNotification(`Error de conexión: ${error.message}`, 'error');
      
      // Restore submit button on error
      if (submitBtn) {
        submitBtn.disabled = false;
        if (originalBtnText) {
          submitBtn.innerHTML = originalBtnText;
        } else {
          submitBtn.innerHTML = 'Crear Usuario';
        }
      }
      // NO cerrar el modal en caso de error de conexión
    } finally {
      // Always reset creating flag
      this.isCreating = false;
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
   * Open modal by ID - using modalManager like hardware/empresas
   */
  openModal(modalId) {
    if (window.modalManager) {
      window.modalManager.openModal(modalId);
    } else {
      // Fallback
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      }
    }
  }

  /**
   * Close modal by ID - using modalManager like hardware/empresas
   */
  closeModal(modalId) {
    if (window.modalManager) {
      window.modalManager.closeModal(modalId);
    } else {
      // Fallback
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    }
  }

  /**
   * Close active modal (for escape key)
   */
  closeActiveModal() {
    // Close any visible modal
    const modals = ['viewUserModal', 'editUserModal', 'createUserModal', 'toggleUserModal', 'userUpdateModal'];
    for (const modalId of modals) {
      const modal = document.getElementById(modalId);
      if (modal && !modal.classList.contains('hidden')) {
        this.closeModal(modalId);
        break;
      }
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
    
    // Format message for HTML (convert \n to <br>)
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
      especialidadItem.className = 'flex items-center space-x-2 mb-2';
      
      especialidadItem.innerHTML = `
        <input type="text" class="ios-blur-input flex-1" 
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
      badge.className = 'inline-block px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-medium mr-2 mb-2';
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
  
  /**
   * Modal management - MEJORADO PARA USUARIOS
   */
  openModal(modalId) {
    if (window.modalManager) {
      try {
        window.modalManager.openModal(modalId); // Usar modalManager para manejar el modal
        console.log('🟢 Modal abierto usando modalManager:', modalId);
      } catch (error) {
        console.error('🔴 Error al abrir modal con modalManager:', error);
      }
    } else {
      console.warn('🔴 modalManager no disponible, uso de fallback');
      
      const modalElement = document.getElementById(modalId);
      if (!modalElement) {
        console.error('❌ Modal no encontrado:', modalId);
        return;
      }
      
      // Fallback directo
      modalElement.style.position = 'fixed';
      modalElement.style.top = '0';
      modalElement.style.left = '0';
      modalElement.style.right = '0';
      modalElement.style.bottom = '0';
      modalElement.style.zIndex = '9999';
      modalElement.style.display = 'flex';
      modalElement.style.alignItems = 'center';
      modalElement.style.justifyContent = 'center';

      // Remover clase hidden y añadir clases de estado
      modalElement.classList.remove('hidden');

      // Agregar clase al body para prevenir scroll
      document.body.classList.add('modal-open', 'ios-modal-open');
      document.body.style.overflow = 'hidden';
      
      // Focus
      setTimeout(() => {
        const firstInput = modalElement.querySelector('input:not([type="hidden"]), textarea, select');
        if (firstInput && firstInput.focus) {
          firstInput.focus();
        }
      }, 150);
    }
  }

  closeActiveModal() {
    const modals = ['toggleUserModal', 'createUserModal', 'editUserModal', 'viewUserModal', 'userUpdateModal'];
    
    for (const modalId of modals) {
      const modal = document.getElementById(modalId);
      if (modal && !modal.classList.contains('hidden')) {
        if (window.modalManager) {
          window.modalManager.closeModal(modalId);
        } else {
          this.closeModalById(modalId);
        }
        break;
      }
    }
  }

  closeModalById(modalId) {
    console.log('🔒 Cerrando modal:', modalId);

    if (window.modalManager) {
      try {
        window.modalManager.closeModal(modalId); // Usar modalManager para cerrar correctamente
        console.log('🟢 Modal cerrado usando modalManager:', modalId);
      } catch (error) {
        console.error('🔴 Error al cerrar modal con modalManager:', error);
      }
    } else {
      console.warn('🔴 modalManager no disponible, uso de fallback');

      const modal = document.getElementById(modalId);
      if (!modal) {
        console.warn('⚠️ Modal no encontrado para cerrar:', modalId);
        return;
      }

      // Fallback directo
      modal.classList.add('hidden');
      document.body.style.overflow = '';

      // Reset current data
      if (modalId === 'createUserModal') {
        this.currentEditingUser = null;
      } else if (modalId === 'editUserModal') {
        this.currentEditingUser = null;
      } else if (modalId === 'viewUserModal') {
        this.currentViewingUser = null;
      } else if (modalId === 'toggleUserModal') {
        this.currentToggleUser = null;
      }
    }

    console.log('✅ Modal cerrado correctamente:', modalId);
  }

  closeCreateModal() {
    this.closeModalById('createUserModal');
    this.resetCreateForm();
  }

  closeEditModal() {
    this.closeModalById('editUserModal');
    this.resetEditForm();
  }

  closeViewModal() {
    this.closeModalById('viewUserModal');
  }

  closeToggleModal() {
    console.log('🔄 Closing toggle modal');
    
    const modal = document.getElementById('toggleUserModal');
    const container = modal?.querySelector('.ios-blur-modal-container');
    const confirmBtn = document.getElementById('toggleUserConfirmBtn');
    
    if (!modal) {
      console.error('❌ Modal not found when trying to close');
      return;
    }
    
    const resetAndHideToggleModal = () => {
      // Use modalManager for consistent closing
      if (window.modalManager) {
        window.modalManager.closeModal('toggleUserModal');
      } else {
        // Fallback
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
      }
      
      // Reset button state
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check" id="toggleConfirmIcon"></i> <span id="toggleConfirmText">Confirmar</span>';
      }
      
      // Reset data
      this.currentToggleUser = null;
      
      console.log('✅ Toggle modal closed and fully reset');
    };
    
    // GSAP close animation
    if (typeof gsap !== 'undefined' && container) {
      gsap.to(container, {
        scale: 0.8,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: resetAndHideToggleModal
      });
    } else {
      resetAndHideToggleModal();
    }
  }

  closeUpdateModal() {
    this.closeModalById('userUpdateModal');
  }
  
  /**
   * Show success modal - EXACTO DE EMPRESAS
   */
  showSuccessModal(message) {
    // Set dynamic title based on message
    const title = document.getElementById('userUpdateModalTitle');
    const messageEl = document.getElementById('userUpdateModalMessage');
    
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
    
    messageEl.textContent = message;
    this.openModal('userUpdateModal');
  }
  
  /**
   * Reset forms
   */
  resetCreateForm() {
    const form = document.getElementById('createUserForm');
    if (form) {
      form.reset();
    }
    this.especialidades = [];
    this.renderEspecialidades('createUser');
  }
  
  resetEditForm() {
    const form = document.getElementById('editUserForm');
    if (form) {
      form.reset();
    }
    this.especialidades = [];
    this.renderEspecialidades('editUser');
  }
  
  /**
   * Show notification - EXACTO DE EMPRESAS
   */
  showNotification(message, type = 'info') {
    if (window.usuariosMain && window.usuariosMain.showEnhancedNotification) {
      window.usuariosMain.showEnhancedNotification(message, type);
    } else {
      // Fallback notification with high z-index
      this.showFallbackNotification(message, type);
    }
  }
  
  /**
   * Fallback notification with high z-index - EXACTO DE EMPRESAS
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
   * FUNCIÓN DE EMERGENCIA - Forzar visibilidad de modales
   */
  forceModalVisibility(modalId) {
    console.log('🚨 FUNCIÓN DE EMERGENCIA: Forzando visibilidad del modal:', modalId);
    
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error('❌ Modal no encontrado:', modalId);
      return false;
    }
    
    // Agregar clase de emergencia al body
    document.body.classList.add('force-modal-visible');
    
    // Forzar estilos críticos
    modal.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 999999 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      background: rgba(0, 0, 0, 0.8) !important;
      visibility: visible !important;
      opacity: 1 !important;
    `;
    
    // Forzar visibilidad del contenedor
    const container = modal.querySelector('.ios-blur-modal-container');
    if (container) {
      container.style.cssText = `
        position: relative !important;
        z-index: 999999 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        transform: scale(1) translateZ(0) !important;
      `;
    }
    
    // Remover clase hidden
    modal.classList.remove('hidden');
    modal.classList.add('force-visible');
    
    // Prevenir scroll
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Modal forzado a ser visible');
    return true;
  }
  
  /**
   * Remover forzado de visibilidad
   */
  removeForcedVisibility() {
    console.log('🔄 Removiendo forzado de visibilidad');
    
    document.body.classList.remove('force-modal-visible');
    
    const modals = ['viewUserModal', 'editUserModal', 'toggleUserModal', 'createUserModal', 'userUpdateModal'];
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('force-visible');
        if (modal.classList.contains('hidden')) {
          modal.style.cssText = '';
        }
      }
    });
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

// Modal control functions - same names as hardware
window.closeToggleModal = () => usuariosModals.closeToggleModal();
window.confirmToggle = () => usuariosModals.confirmToggle();
window.closeUpdateModal = () => usuariosModals.closeUpdateModal();

console.log('👥 Usuarios modals module loaded');