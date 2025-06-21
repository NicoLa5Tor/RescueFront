// static/js/admin.js

// ===== VARIABLES GLOBALES =====
let currentUser = null;
let selectedEmpresa = null;
let usersTable = null;
let empresasTable = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  initializeAdmin();
});

/**
 * Inicializar aplicación de administración
 */
async function initializeAdmin() {
  // Verificar autenticación
  if (!checkAuth()) return;
  
  // Obtener usuario actual
  currentUser = window.apiClient.getCurrentUser();
  if (!currentUser) {
    console.error('No se pudo obtener información del usuario actual');
    window.authManager?.logout();
    return;
  }

  // Mostrar información del usuario en la UI
  updateUserInterface();
  
  // Detectar página actual y cargar contenido correspondiente
  const currentPage = window.location.pathname;
  
  if (currentPage.includes('/admin/users')) {
    await initializeUsersPage();
  } else if (currentPage.includes('/admin/empresas')) {
    await initializeEmpresasPage();
  } else if (currentPage.includes('/admin/stats')) {
    await initializeStatsPage();
  } else if (currentPage.includes('/admin')) {
    await initializeDashboardPage();
  }
}

/**
 * Verificar autenticación
 */
function checkAuth() {
  if (!window.authManager || !window.authManager.isAuthenticated()) {
    console.warn('Usuario no autenticado, redirigiendo al login...');
    window.location.href = '/login';
    return false;
  }
  return true;
}

/**
 * Actualizar interfaz con información del usuario
 */
function updateUserInterface() {
  // Mostrar nombre del usuario
  const userNameElements = document.querySelectorAll('.user-name');
  userNameElements.forEach(el => {
    el.textContent = currentUser.nombre || currentUser.usuario;
  });

  // Mostrar rol del usuario
  const userRoleElements = document.querySelectorAll('.user-role');
  userRoleElements.forEach(el => {
    el.textContent = currentUser.rol;
  });

  // Mostrar/ocultar elementos según permisos
  updateUIBasedOnPermissions();
}

/**
 * Actualizar UI basado en permisos del usuario
 */
function updateUIBasedOnPermissions() {
  // Elementos solo para super admin
  const superAdminElements = document.querySelectorAll('.super-admin-only');
  superAdminElements.forEach(el => {
    el.style.display = currentUser.isSuperAdmin() ? 'block' : 'none';
  });

  // Elementos solo para admin
  const adminElements = document.querySelectorAll('.admin-only');
  adminElements.forEach(el => {
    el.style.display = currentUser.isAdmin() ? 'block' : 'none';
  });

  // Si es empresa, establecer empresa seleccionada automáticamente
  if (currentUser.isEmpresa() && currentUser.getEmpresaId()) {
    window.apiClient.setSelectedEmpresa(currentUser.getEmpresaId());
    selectedEmpresa = currentUser.getEmpresaId();
  }
}

// ===== PÁGINA DE DASHBOARD =====

/**
 * Inicializar página principal del dashboard
 */
async function initializeDashboardPage() {
  showLoading('Cargando dashboard...');
  
  try {
    if (currentUser.isAdmin()) {
      await loadGlobalDashboard();
    } else {
      await loadEmpresaDashboard();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error cargando dashboard:', error);
    showNotification('Error al cargar el dashboard', 'error');
  }
}

/**
 * Cargar dashboard global (para admins)
 */
async function loadGlobalDashboard() {
  const [empresas, stats] = await Promise.all([
    window.apiClient.getEmpresas(),
    window.apiClient.getGlobalStats()
  ]);

  // Actualizar contadores principales
  updateElement('totalEmpresasCount', empresas.length);
  updateElement('activeEmpresasCount', empresas.filter(e => e.activa).length);
  updateElement('totalUsersCount', stats.total_usuarios);
  updateElement('avgUsersPerCompany', stats.getAverageUsersPerCompany());

  // Crear gráficos si están disponibles
  if (typeof Chart !== 'undefined') {
    createDashboardCharts(stats);
  }

  // Mostrar empresas recientes
  renderRecentEmpresas(empresas.slice(-5));
}

/**
 * Cargar dashboard de empresa específica
 */
async function loadEmpresaDashboard() {
  if (!selectedEmpresa) {
    showNotification('No hay empresa seleccionada', 'warning');
    return;
  }

  const [usuarios, empresa, stats] = await Promise.all([
    window.apiClient.getUsuariosByEmpresa(selectedEmpresa),
    window.apiClient.getEmpresa(selectedEmpresa),
    window.apiClient.getEmpresaStats(selectedEmpresa)
  ]);

  // Actualizar información de la empresa
  updateElement('empresaName', empresa.nombre);
  updateElement('empresaLocation', empresa.ubicacion);
  updateElement('empresaUsersCount', usuarios.length);
  updateElement('empresaActiveStatus', empresa.getStatusBadge().text);

  // Actualizar contadores
  updateElement('totalUsersCount', stats.total_usuarios);
  updateElement('activeUsersCount', stats.usuarios_activos);
  updateElement('usersGrowthPercentage', stats.getActiveUsersPercentage());

  // Mostrar usuarios recientes
  renderRecentUsers(usuarios.slice(-5));
}

// ===== PÁGINA DE EMPRESAS =====

/**
 * Inicializar página de empresas
 */
async function initializeEmpresasPage() {
  // Solo admins pueden ver todas las empresas
  if (!currentUser.isAdmin()) {
    showNotification('No tienes permisos para ver esta página', 'error');
    window.location.href = '/admin';
    return;
  }

  await loadEmpresas();
  setupEmpresasEventListeners();
}

/**
 * Cargar y mostrar empresas
 */
async function loadEmpresas() {
  showLoading('Cargando empresas...');
  
  try {
    const empresas = await window.apiClient.getEmpresas();
    renderEmpresasGrid(empresas);
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error loading empresas:', error);
    showNotification('Error al cargar empresas', 'error');
  }
}

/**
 * Renderizar grid de empresas
 */
function renderEmpresasGrid(empresas) {
  const container = document.getElementById('empresasGrid');
  if (!container) return;
  
  container.innerHTML = empresas.map(empresa => `
    <div class="col-md-6 col-lg-4 mb-4" data-aos="fade-up">
      <div class="card h-100 shadow-sm modern-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div class="d-flex align-items-center">
              <div class="avatar-sm me-3">
                <span class="avatar-title rounded-circle bg-primary">
                  ${empresa.getInitials()}
                </span>
              </div>
              <div>
                <h5 class="card-title mb-0">${empresa.nombre}</h5>
                <small class="text-muted">${empresa.email}</small>
              </div>
            </div>
            <span class="badge ${empresa.getStatusBadge().class}">
              ${empresa.getStatusBadge().text}
            </span>
          </div>
          
          <p class="card-text text-muted mb-3">
            <i class="fas fa-quote-left me-1"></i>
            ${empresa.descripcion.length > 100 ? 
              empresa.descripcion.substring(0, 100) + '...' : 
              empresa.descripcion}
          </p>
          
          <div class="mb-3">
            <small class="text-muted">
              <i class="fas fa-map-marker-alt me-1"></i>
              ${empresa.ubicacion}
            </small>
          </div>
          
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              <i class="fas fa-calendar me-1"></i>
              ${empresa.getFormattedCreationDate()}
            </small>
            <div class="btn-group" role="group">
              <button class="btn btn-sm btn-outline-primary" 
                      onclick="viewEmpresa('${empresa.id}')"
                      data-bs-toggle="tooltip" title="Ver detalles">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-outline-info" 
                      onclick="selectEmpresa('${empresa.id}')"
                      data-bs-toggle="tooltip" title="Seleccionar empresa">
                <i class="fas fa-check"></i>
              </button>
              ${currentUser.isSuperAdmin() ? `
                <button class="btn btn-sm btn-outline-warning" 
                        onclick="editEmpresa('${empresa.id}')"
                        data-bs-toggle="tooltip" title="Editar">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm ${empresa.activa ? 'btn-outline-secondary' : 'btn-outline-success'}" 
                        onclick="toggleEmpresaStatus('${empresa.id}', ${!empresa.activa})"
                        data-bs-toggle="tooltip" title="${empresa.activa ? 'Desactivar' : 'Activar'}">
                  <i class="fas fa-${empresa.activa ? 'pause' : 'play'}"></i>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  
  // Reinicializar tooltips y AOS
  initializeTooltips();
  if (typeof AOS !== 'undefined') {
    AOS.refresh();
  }
}

/**
 * Configurar event listeners para empresas
 */
function setupEmpresasEventListeners() {
  // Botón crear empresa
  const createBtn = document.getElementById('createEmpresaBtn');
  if (createBtn) {
    createBtn.addEventListener('click', createEmpresa);
  }

  // Botón buscar por ubicación
  const searchBtn = document.getElementById('searchLocationBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchEmpresasByLocation);
  }
}

// ===== PÁGINA DE USUARIOS =====

/**
 * Inicializar página de usuarios
 */
async function initializeUsersPage() {
  await setupEmpresaSelector();
  await loadUsers();
  setupUsersEventListeners();
}

/**
 * Configurar selector de empresa
 */
async function setupEmpresaSelector() {
  const selector = document.getElementById('empresaSelector');
  if (!selector) return;

  try {
    let empresas;
    
    if (currentUser.isAdmin()) {
      // Admin puede ver todas las empresas
      empresas = await window.apiClient.getEmpresas();
    } else if (currentUser.isEmpresa()) {
      // Usuario empresa solo ve su empresa
      const empresa = await window.apiClient.getEmpresa(currentUser.getEmpresaId());
      empresas = [empresa];
      selectedEmpresa = empresa.id;
      window.apiClient.setSelectedEmpresa(empresa.id);
    } else {
      empresas = [];
    }

    // Renderizar opciones
    selector.innerHTML = `
      <option value="">Seleccionar empresa...</option>
      ${empresas.map(empresa => `
        <option value="${empresa.id}" ${empresa.id === selectedEmpresa ? 'selected' : ''}>
          ${empresa.nombre} - ${empresa.ubicacion}
        </option>
      `).join('')}
    `;

    // Event listener para cambio de empresa
    selector.addEventListener('change', async (e) => {
      const empresaId = e.target.value;
      if (empresaId) {
        selectedEmpresa = empresaId;
        window.apiClient.setSelectedEmpresa(empresaId);
        await loadUsers();
      }
    });

  } catch (error) {
    console.error('Error configurando selector de empresa:', error);
    showNotification('Error al cargar empresas', 'error');
  }
}

/**
 * Cargar usuarios de la empresa seleccionada
 */
async function loadUsers() {
  if (!selectedEmpresa) {
    const tbody = document.getElementById('usersTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-4">
            <i class="fas fa-info-circle me-2"></i>
            Selecciona una empresa para ver sus usuarios
          </td>
        </tr>
      `;
    }
    return;
  }

  showLoading('Cargando usuarios...');
  
  try {
    const usuarios = await window.apiClient.getUsuariosByEmpresa(selectedEmpresa);
    renderUsersTable(usuarios);
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error loading users:', error);
    showNotification('Error al cargar usuarios', 'error');
  }
}

/**
 * Renderizar tabla de usuarios
 */
function renderUsersTable(usuarios) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  
  if (usuarios.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">
          <i class="fas fa-users-slash me-2"></i>
          No hay usuarios en esta empresa
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = usuarios.map(usuario => `
    <tr>
      <td>
        <div class="d-flex align-items-center">
          <div class="avatar-sm me-3">
            <span class="avatar-title rounded-circle bg-info">
              ${usuario.getInitials()}
            </span>
          </div>
          <div>
            <h6 class="mb-0">${usuario.nombre}</h6>
            <small class="text-muted">ID: ${usuario.id}</small>
          </div>
        </div>
      </td>
      <td>
        <span class="badge bg-secondary">${usuario.cedula}</span>
      </td>
      <td>
        <span class="badge bg-primary">${usuario.rol}</span>
      </td>
      <td>
        <small class="text-muted">
          <i class="fas fa-building me-1"></i>
          ${usuario.empresa?.nombre || 'N/A'}
        </small>
      </td>
      <td>
        <small class="text-muted">
          ${usuario.getFormattedCreationDate()}
        </small>
      </td>
      <td>
        <div class="btn-group" role="group">
          <button class="btn btn-sm btn-outline-info" 
                  onclick="viewUser('${usuario.id}')"
                  data-bs-toggle="tooltip" title="Ver detalles">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-warning" 
                  onclick="editUser('${usuario.id}')"
                  data-bs-toggle="tooltip" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" 
                  onclick="deleteUser('${usuario.id}')"
                  data-bs-toggle="tooltip" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  initializeTooltips();
}

/**
 * Configurar event listeners para usuarios
 */
function setupUsersEventListeners() {
  // Botón crear usuario
  const createBtn = document.getElementById('createUserBtn');
  if (createBtn) {
    createBtn.addEventListener('click', createUser);
  }

  // Botón filtrar por edad (si existe)
  const filterBtn = document.getElementById('filterAgeBtn');
  if (filterBtn) {
    filterBtn.addEventListener('click', filterUsersByAge);
  }
}

// ===== OPERACIONES DE EMPRESAS =====

/**
 * Ver detalles de empresa
 */
async function viewEmpresa(empresaId) {
  try {
    const [empresa, usuarios] = await Promise.all([
      window.apiClient.getEmpresa(empresaId),
      window.apiClient.getUsuariosByEmpresa(empresaId)
    ]);
    
    Swal.fire({
      title: empresa.nombre,
      html: `
        <div class="text-start">
          <div class="mb-3">
            <strong>Descripción:</strong>
            <p class="mt-1">${empresa.descripcion}</p>
          </div>
          <p><strong>Email:</strong> ${empresa.email}</p>
          <p><strong>Ubicación:</strong> ${empresa.ubicacion}</p>
          <p><strong>Estado:</strong> 
            <span class="badge ${empresa.getStatusBadge().class}">
              ${empresa.getStatusBadge().text}
            </span>
          </p>
          <p><strong>Usuarios:</strong> ${usuarios.length}</p>
          <p><strong>Creada:</strong> ${empresa.getFormattedCreationDate()}</p>
          <p><strong>Actualizada:</strong> ${empresa.getFormattedUpdateDate()}</p>
          
          ${usuarios.length > 0 ? `
            <hr>
            <h6>Últimos usuarios:</h6>
            <ul class="list-unstyled">
              ${usuarios.slice(-5).map(u => `
                <li class="mb-1">
                  <i class="fas fa-user me-2"></i>
                  ${u.nombre} <small class="text-muted">(${u.rol})</small>
                </li>
              `).join('')}
            </ul>
          ` : ''}
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      width: '600px'
    });
  } catch (error) {
    console.error('Error viewing empresa:', error);
    showNotification('Error al ver detalles de la empresa', 'error');
  }
}

/**
 * Seleccionar empresa para trabajar
 */
function selectEmpresa(empresaId) {
  selectedEmpresa = empresaId;
  window.apiClient.setSelectedEmpresa(empresaId);
  showNotification('Empresa seleccionada correctamente', 'success');
  
  // Actualizar UI si estamos en la página de usuarios
  if (window.location.pathname.includes('/users')) {
    loadUsers();
  }
}

/**
 * Crear nueva empresa
 */
async function createEmpresa() {
  if (!currentUser.isSuperAdmin()) {
    showNotification('Solo los super administradores pueden crear empresas', 'error');
    return;
  }

  const { value: formValues } = await Swal.fire({
    title: 'Crear Nueva Empresa',
    html: `
      <div class="row g-3">
        <div class="col-12">
          <input id="swal-nombre" class="swal2-input" placeholder="Nombre de la empresa" required>
        </div>
        <div class="col-12">
          <textarea id="swal-descripcion" class="swal2-textarea" placeholder="Descripción"></textarea>
        </div>
        <div class="col-12">
          <input id="swal-ubicacion" class="swal2-input" placeholder="Ubicación">
        </div>
        <div class="col-12">
          <input id="swal-email" class="swal2-input" placeholder="Email" type="email">
        </div>
        <div class="col-12">
          <input id="swal-password" class="swal2-input" placeholder="Contraseña" type="password">
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Crear',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const nombre = document.getElementById('swal-nombre').value;
      const descripcion = document.getElementById('swal-descripcion').value;
      const ubicacion = document.getElementById('swal-ubicacion').value;
      const email = document.getElementById('swal-email').value;
      const password = document.getElementById('swal-password').value;

      if (!nombre || !descripcion || !ubicacion || !email || !password) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }

      return { nombre, descripcion, ubicacion, email, password };
    }
  });
  
  if (formValues) {
    try {
      showLoading('Creando empresa...');
      const { password, ...empresaData } = formValues;
      await window.apiClient.createEmpresa(empresaData, password);
      hideLoading();
      showNotification('Empresa creada correctamente', 'success');
      loadEmpresas();
    } catch (error) {
      hideLoading();
      console.error('Error creating empresa:', error);
      showNotification(error.message || 'Error al crear empresa', 'error');
    }
  }
}

/**
 * Editar empresa
 */
async function editEmpresa(empresaId) {
  if (!currentUser.isSuperAdmin()) {
    showNotification('Solo los super administradores pueden editar empresas', 'error');
    return;
  }

  try {
    const empresa = await window.apiClient.getEmpresa(empresaId);
    
    const { value: formValues } = await Swal.fire({
      title: 'Editar Empresa',
      html: `
        <div class="row g-3">
          <div class="col-12">
            <input id="swal-nombre" class="swal2-input" placeholder="Nombre" value="${empresa.nombre}">
          </div>
          <div class="col-12">
            <textarea id="swal-descripcion" class="swal2-textarea" placeholder="Descripción">${empresa.descripcion}</textarea>
          </div>
          <div class="col-12">
            <input id="swal-ubicacion" class="swal2-input" placeholder="Ubicación" value="${empresa.ubicacion}">
          </div>
          <div class="col-12">
            <input id="swal-email" class="swal2-input" placeholder="Email" type="email" value="${empresa.email}">
          </div>
          <div class="col-12">
            <input id="swal-password" class="swal2-input" placeholder="Nueva contraseña (opcional)" type="password">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          nombre: document.getElementById('swal-nombre').value,
          descripcion: document.getElementById('swal-descripcion').value,
          ubicacion: document.getElementById('swal-ubicacion').value,
          email: document.getElementById('swal-email').value,
          password: document.getElementById('swal-password').value
        };
      }
    });
    
    if (formValues) {
      showLoading('Actualizando empresa...');
      const { password, ...empresaData } = formValues;
      await window.apiClient.updateEmpresa(empresaId, empresaData, password || null);
      hideLoading();
      showNotification('Empresa actualizada correctamente', 'success');
      loadEmpresas();
    }
  } catch (error) {
    console.error('Error editing empresa:', error);
    showNotification(error.message || 'Error al editar empresa', 'error');
  }
}

/**
 * Cambiar estado de empresa (activar/desactivar)
 */
async function toggleEmpresaStatus(empresaId, newStatus) {
  if (!currentUser.isSuperAdmin()) {
    showNotification('Solo los super administradores pueden cambiar el estado', 'error');
    return;
  }

  const action = newStatus ? 'activar' : 'desactivar';
  const confirmed = await confirmAction(
    `¿${action.charAt(0).toUpperCase() + action.slice(1)} empresa?`,
    `Esta acción ${action}á la empresa y ${newStatus ? 'permitirá' : 'impedirá'} el acceso a sus usuarios.`
  );
  
  if (confirmed) {
    try {
      showLoading(`${action.charAt(0).toUpperCase() + action.slice(1)}ando empresa...`);
      await window.apiClient.toggleEmpresaStatus(empresaId, newStatus);
      hideLoading();
      showNotification(`Empresa ${action}da correctamente`, 'success');
      loadEmpresas();
    } catch (error) {
      hideLoading();
      console.error('Error toggling empresa status:', error);
      showNotification(`Error al ${action} empresa`, 'error');
    }
  }
}

/**
 * Buscar empresas por ubicación
 */
async function searchEmpresasByLocation() {
  const { value: ubicacion } = await Swal.fire({
    title: 'Buscar por Ubicación',
    input: 'text',
    inputLabel: 'Ingrese la ubicación',
    inputPlaceholder: 'Ej: Bogotá, Madrid, etc.',
    showCancelButton: true,
    confirmButtonText: 'Buscar',
    cancelButtonText: 'Cancelar'
  });
  
  if (ubicacion) {
    try {
      showLoading('Buscando empresas...');
      const empresas = await window.apiClient.searchEmpresasByUbicacion(ubicacion);
      renderEmpresasGrid(empresas);
      hideLoading();
      
      if (empresas.length === 0) {
        showNotification('No se encontraron empresas en esa ubicación', 'info');
      } else {
        showNotification(`Se encontraron ${empresas.length} empresa(s)`, 'success');
      }
    } catch (error) {
      hideLoading();
      console.error('Error searching empresas:', error);
      showNotification('Error al buscar empresas', 'error');
    }
  }
}

// ===== OPERACIONES DE USUARIOS =====

/**
 * Ver detalles de usuario
 */
async function viewUser(usuarioId) {
  if (!selectedEmpresa) {
    showNotification('No hay empresa seleccionada', 'warning');
    return;
  }

  try {
    const usuario = await window.apiClient.getUsuarioByEmpresa(selectedEmpresa, usuarioId);
    
    Swal.fire({
      title: 'Detalles del Usuario',
      html: `
        <div class="text-start">
          <div class="text-center mb-3">
            <div class="avatar-lg mx-auto mb-2">
              <span class="avatar-title rounded-circle bg-info fs-4">
                ${usuario.getInitials()}
              </span>
            </div>
            <h5>${usuario.nombre}</h5>
          </div>
          <p><strong>ID:</strong> ${usuario.id}</p>
          <p><strong>Cédula:</strong> ${usuario.cedula}</p>
          <p><strong>Rol:</strong> 
            <span class="badge bg-primary">${usuario.rol}</span>
          </p>
          <p><strong>Empresa:</strong> ${usuario.empresa?.nombre || 'N/A'}</p>
          <p><strong>Creado:</strong> ${usuario.getFormattedCreationDate()}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar'
    });
  } catch (error) {
    console.error('Error viewing user:', error);
    showNotification('Error al ver detalles del usuario', 'error');
  }
}

/**
 * Crear nuevo usuario
 */
async function createUser() {
  if (!selectedEmpresa) {
    showNotification('Selecciona una empresa primero', 'warning');
    return;
  }

  const { value: formValues } = await Swal.fire({
    title: 'Crear Nuevo Usuario',
    html: `
      <div class="row g-3">
        <div class="col-12">
          <input id="swal-nombre" class="swal2-input" placeholder="Nombre completo" required>
        </div>
        <div class="col-12">
          <input id="swal-cedula" class="swal2-input" placeholder="Cédula" required>
        </div>
        <div class="col-12">
          <input id="swal-rol" class="swal2-input" placeholder="Rol" required>
        </div>
        <div class="col-12">
          <input id="swal-password" class="swal2-input" placeholder="Contraseña" type="password" required>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Crear',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const nombre = document.getElementById('swal-nombre').value;
      const cedula = document.getElementById('swal-cedula').value;
      const rol = document.getElementById('swal-rol').value;
      const password = document.getElementById('swal-password').value;

      if (!nombre || !cedula || !rol || !password) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }

      return { nombre, cedula, rol, password };
    }
  });
  
  if (formValues) {
    try {
      showLoading('Creando usuario...');
      const { password, ...userData } = formValues;
      await window.apiClient.createUsuarioForEmpresa(selectedEmpresa, userData, password);
      hideLoading();
      showNotification('Usuario creado correctamente', 'success');
      loadUsers();
    } catch (error) {
      hideLoading();
      console.error('Error creating user:', error);
      showNotification(error.message || 'Error al crear usuario', 'error');
    }
  }
}

/**
 * Editar usuario existente
 */
async function editUser(usuarioId) {
  if (!selectedEmpresa) {
    showNotification('No hay empresa seleccionada', 'warning');
    return;
  }

  try {
    const usuario = await window.apiClient.getUsuarioByEmpresa(selectedEmpresa, usuarioId);
    
    const { value: formValues } = await Swal.fire({
      title: 'Editar Usuario',
      html: `
        <div class="row g-3">
          <div class="col-12">
            <input id="swal-nombre" class="swal2-input" placeholder="Nombre completo" value="${usuario.nombre}">
          </div>
          <div class="col-12">
            <input id="swal-cedula" class="swal2-input" placeholder="Cédula" value="${usuario.cedula}">
          </div>
          <div class="col-12">
            <input id="swal-rol" class="swal2-input" placeholder="Rol" value="${usuario.rol}">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          nombre: document.getElementById('swal-nombre').value,
          cedula: document.getElementById('swal-cedula').value,
          rol: document.getElementById('swal-rol').value
        };
      }
    });
    
    if (formValues) {
      showLoading('Actualizando usuario...');
      await window.apiClient.updateUsuarioByEmpresa(selectedEmpresa, usuarioId, formValues);
      hideLoading();
      showNotification('Usuario actualizado correctamente', 'success');
      loadUsers();
    }
  } catch (error) {
    console.error('Error editing user:', error);
    showNotification(error.message || 'Error al editar usuario', 'error');
  }
}

/**
 * Eliminar usuario
 */
async function deleteUser(usuarioId) {
  if (!selectedEmpresa) {
    showNotification('No hay empresa seleccionada', 'warning');
    return;
  }

  const confirmed = await confirmAction(
    '¿Eliminar usuario?',
    'Esta acción no se puede deshacer. El usuario será eliminado permanentemente.'
  );
  
  if (confirmed) {
    try {
      showLoading('Eliminando usuario...');
      await window.apiClient.deleteUsuarioByEmpresa(selectedEmpresa, usuarioId);
      hideLoading();
      showNotification('Usuario eliminado correctamente', 'success');
      loadUsers();
    } catch (error) {
      hideLoading();
      console.error('Error deleting user:', error);
      showNotification(error.message || 'Error al eliminar usuario', 'error');
    }
  }
}

/**
 * Filtrar usuarios por edad (función de ejemplo)
 */
async function filterUsersByAge() {
  if (!selectedEmpresa) {
    showNotification('No hay empresa seleccionada', 'warning');
    return;
  }

  const { value: formValues } = await Swal.fire({
    title: 'Filtrar por Edad',
    html: `
      <div class="row g-3">
        <div class="col-6">
          <input id="swal-min-age" class="swal2-input" placeholder="Edad mínima" type="number" min="1">
        </div>
        <div class="col-6">
          <input id="swal-max-age" class="swal2-input" placeholder="Edad máxima" type="number" min="1">
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Filtrar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      return {
        minAge: document.getElementById('swal-min-age').value,
        maxAge: document.getElementById('swal-max-age').value
      };
    }
  });
  
  if (formValues && formValues.minAge && formValues.maxAge) {
    try {
      showLoading('Filtrando usuarios...');
      const usuarios = await window.apiClient.filterUsuariosByAge(selectedEmpresa, formValues.minAge, formValues.maxAge);
      renderUsersTable(usuarios);
      hideLoading();
      showNotification(`Se encontraron ${usuarios.length} usuarios`, 'info');
    } catch (error) {
      hideLoading();
      console.error('Error filtering users:', error);
      showNotification('Error al filtrar usuarios', 'error');
    }
  }
}

// ===== PÁGINA DE ESTADÍSTICAS =====

/**
 * Inicializar página de estadísticas
 */
async function initializeStatsPage() {
  await loadStats();
}

/**
 * Cargar estadísticas
 */
async function loadStats() {
  showLoading('Cargando estadísticas...');
  
  try {
    if (currentUser.isAdmin()) {
      await loadGlobalStats();
    } else {
      await loadEmpresaStats();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('Error loading stats:', error);
    showNotification('Error al cargar estadísticas', 'error');
  }
}

/**
 * Cargar estadísticas globales (para admins)
 */
async function loadGlobalStats() {
  const stats = await window.apiClient.getGlobalStats();
  
  // Actualizar cards de estadísticas
  updateElement('totalEmpresasCount', stats.total_empresas);
  updateElement('activeEmpresasCount', stats.empresas_activas);
  updateElement('totalUsersCount', stats.total_usuarios);
  updateElement('avgUsersPerCompany', stats.getAverageUsersPerCompany());
  updateElement('activeCompaniesPercentage', stats.getActiveCompaniesPercentage());
  
  // Crear gráficos
  if (typeof Chart !== 'undefined') {
    createStatsCharts(stats);
  }
}

/**
 * Cargar estadísticas de empresa específica
 */
async function loadEmpresaStats() {
  if (!selectedEmpresa && currentUser.isEmpresa()) {
    selectedEmpresa = currentUser.getEmpresaId();
    window.apiClient.setSelectedEmpresa(selectedEmpresa);
  }
  
  if (!selectedEmpresa) {
    showNotification('No hay empresa seleccionada', 'warning');
    return;
  }

  const stats = await window.apiClient.getEmpresaStats(selectedEmpresa);
  
  // Actualizar cards de estadísticas
  updateElement('totalUsersCount', stats.total_usuarios);
  updateElement('activeUsersCount', stats.usuarios_activos);
  updateElement('activeUsersPercentage', stats.getActiveUsersPercentage());
  
  // Mostrar roles más comunes
  const topRoles = stats.getTopRoles(5);
  renderTopRoles(topRoles);
  
  // Crear gráficos de empresa
  if (typeof Chart !== 'undefined') {
    createEmpresaStatsCharts(stats);
  }
}

// ===== GRÁFICOS Y VISUALIZACIONES =====

/**
 * Crear gráficos del dashboard
 */
function createDashboardCharts(stats) {
  // Mini gráfico de actividad
  const ctx = document.getElementById('dashboardChart')?.getContext('2d');
  if (ctx) {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Actividad',
          data: [12, 19, 15, 25, 22, 30, 28],
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { display: false },
          x: { display: false }
        },
        elements: {
          point: { radius: 0 }
        }
      }
    });
  }
}

/**
 * Crear gráficos de estadísticas globales
 */
function createStatsCharts(stats) {
  // Gráfico de usuarios por empresa
  createUsersPerCompanyChart(stats.usuarios_por_empresa);
  
  // Gráfico de empresas por ubicación
  createLocationChart(stats.empresas_por_ubicacion);
  
  // Gráfico de crecimiento mensual
  if (stats.crecimiento_mensual.length > 0) {
    createGrowthChart(stats.crecimiento_mensual);
  }
}

/**
 * Crear gráficos de estadísticas de empresa
 */
function createEmpresaStatsCharts(stats) {
  // Gráfico de usuarios por rol
  createRolesChart(Object.entries(stats.usuarios_por_rol));
}

/**
 * Gráfico de usuarios por empresa
 */
function createUsersPerCompanyChart(data) {
  const ctx = document.getElementById('usersPerCompanyChart')?.getContext('2d');
  if (!ctx || !data.length) return;
  
  const labels = data.map(d => d.empresa_name);
  const values = data.map(d => d.users_count);
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Usuarios',
        data: values,
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: '#667eea',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
}

/**
 * Gráfico de empresas por ubicación
 */
function createLocationChart(data) {
  const ctx = document.getElementById('locationChart')?.getContext('2d');
  if (!ctx || !data.length) return;
  
  const labels = data.map(d => d.ubicacion);
  const values = data.map(d => d.count);
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#667eea', '#764ba2', '#f093fb', '#f5576c', 
          '#4facfe', '#00f2fe', '#667eea', '#764ba2'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 20 }
        }
      }
    }
  });
}

/**
 * Gráfico de usuarios por rol
 */
function createRolesChart(rolesData) {
  const ctx = document.getElementById('rolesChart')?.getContext('2d');
  if (!ctx || !rolesData.length) return;
  
  const labels = rolesData.map(([rol]) => rol);
  const values = rolesData.map(([, count]) => count);
  
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 20 }
        }
      }
    }
  });
}

/**
 * Gráfico de crecimiento mensual
 */
function createGrowthChart(data) {
  const ctx = document.getElementById('growthChart')?.getContext('2d');
  if (!ctx || !data.length) return;
  
  const labels = data.map(d => d.month);
  const users = data.map(d => d.new_users || 0);
  const empresas = data.map(d => d.new_empresas || 0);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Nuevos Usuarios',
        data: users,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
      }, {
        label: 'Nuevas Empresas',
        data: empresas,
        borderColor: '#764ba2',
        backgroundColor: 'rgba(118, 75, 162, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
}

// ===== FUNCIONES DE UI =====

/**
 * Renderizar empresas recientes
 */
function renderRecentEmpresas(empresas) {
  const container = document.getElementById('recentEmpresasContainer');
  if (!container) return;
  
  container.innerHTML = empresas.map(empresa => `
    <div class="d-flex align-items-center mb-3">
      <div class="avatar-sm me-3">
        <span class="avatar-title rounded-circle bg-primary">
          ${empresa.getInitials()}
        </span>
      </div>
      <div class="flex-grow-1">
        <h6 class="mb-0">${empresa.nombre}</h6>
        <small class="text-muted">${empresa.ubicacion}</small>
      </div>
      <span class="badge ${empresa.getStatusBadge().class}">
        ${empresa.getStatusBadge().text}
      </span>
    </div>
  `).join('');
}

/**
 * Renderizar usuarios recientes
 */
function renderRecentUsers(usuarios) {
  const container = document.getElementById('recentUsersContainer');
  if (!container) return;
  
  container.innerHTML = usuarios.map(usuario => `
    <div class="d-flex align-items-center mb-3">
      <div class="avatar-sm me-3">
        <span class="avatar-title rounded-circle bg-info">
          ${usuario.getInitials()}
        </span>
      </div>
      <div class="flex-grow-1">
        <h6 class="mb-0">${usuario.nombre}</h6>
        <small class="text-muted">${usuario.rol}</small>
      </div>
      <small class="text-muted">
        ${usuario.getFormattedCreationDate()}
      </small>
    </div>
  `).join('');
}

/**
 * Renderizar roles más comunes
 */
function renderTopRoles(roles) {
  const container = document.getElementById('topRolesContainer');
  if (!container) return;
  
  container.innerHTML = roles.map(({ rol, count }) => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span class="badge bg-primary">${rol}</span>
      <span class="fw-bold">${count} usuario${count !== 1 ? 's' : ''}</span>
    </div>
  `).join('');
}

// ===== FUNCIONES AUXILIARES =====

/**
 * Mostrar loading
 */
function showLoading(message = 'Cargando...') {
  if (window.Swal) {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }
}

/**
 * Ocultar loading
 */
function hideLoading() {
  if (window.Swal) {
    Swal.close();
  }
}

/**
 * Mostrar notificación
 */
function showNotification(message, type = 'info', duration = 3000) {
  if (window.Swal) {
    const Toast = window.Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: duration,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', window.Swal.stopTimer);
        toast.addEventListener('mouseleave', window.Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: type,
      title: message
    });
  } else {
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

/**
 * Confirmar acción
 */
async function confirmAction(title, text) {
  if (window.Swal) {
    const result = await Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    });
    return result.isConfirmed;
  }
  return confirm(`${title}\n${text}`);
}

/**
 * Actualizar elemento del DOM
 */
function updateElement(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

/**
 * Inicializar tooltips de Bootstrap
 */
function initializeTooltips() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// ===== FUNCIONES DE NAVEGACIÓN Y SESIÓN =====

/**
 * Cerrar sesión
 */
function logout() {
  if (window.authManager) {
    window.authManager.logout();
  } else {
    window.location.href = '/login';
  }
}

/**
 * Mostrar información del usuario actual
 */
function showUserInfo() {
  if (!currentUser) {
    showNotification('No hay información del usuario disponible', 'warning');
    return;
  }
  
  Swal.fire({
    title: 'Información del Usuario',
    html: `
      <div class="text-start">
        <div class="text-center mb-3">
          <div class="avatar-lg mx-auto mb-2">
            <span class="avatar-title rounded-circle bg-primary fs-4">
              ${currentUser.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <h5>${currentUser.nombre}</h5>
        </div>
        <p><strong>Usuario:</strong> ${currentUser.usuario}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Rol:</strong> 
          <span class="badge bg-primary">${currentUser.rol}</span>
        </p>
        <p><strong>Tipo:</strong> 
          <span class="badge bg-info">${currentUser.tipo}</span>
        </p>
        ${currentUser.isEmpresa() ? `
          <p><strong>Empresa ID:</strong> ${currentUser.getEmpresaId()}</p>
        ` : ''}
        <p><strong>Permisos:</strong></p>
        <ul class="list-unstyled">
          ${currentUser.permisos.map(permiso => `
            <li><i class="fas fa-check text-success me-2"></i>${permiso}</li>
          `).join('')}
        </ul>
        <hr>
        <p><strong>Token expira en:</strong> ${currentUser.getTokenTimeRemaining()} minutos</p>
      </div>
    `,
    icon: 'info',
    confirmButtonText: 'Cerrar',
    width: '500px'
  });
}

/**
 * Refrescar datos de la página actual
 */
async function refreshCurrentPage() {
  const currentPage = window.location.pathname;
  
  showLoading('Actualizando datos...');
  
  try {
    if (currentPage.includes('/admin/users')) {
      await loadUsers();
    } else if (currentPage.includes('/admin/empresas')) {
      await loadEmpresas();
    } else if (currentPage.includes('/admin/stats')) {
      await loadStats();
    } else if (currentPage.includes('/admin')) {
      await initializeDashboardPage();
    }
    
    hideLoading();
    showNotification('Datos actualizados correctamente', 'success');
  } catch (error) {
    hideLoading();
    console.error('Error refreshing page:', error);
    showNotification('Error al actualizar datos', 'error');
  }
}

// ===== EVENT LISTENERS GLOBALES =====

// Listener para el botón de logout
document.addEventListener('click', (e) => {
  if (e.target.matches('.logout-btn, .logout-btn *')) {
    e.preventDefault();
    logout();
  }
});

// Listener para el botón de información de usuario
document.addEventListener('click', (e) => {
  if (e.target.matches('.user-info-btn, .user-info-btn *')) {
    e.preventDefault();
    showUserInfo();
  }
});

// Listener para el botón de refrescar
document.addEventListener('click', (e) => {
  if (e.target.matches('.refresh-btn, .refresh-btn *')) {
    e.preventDefault();
    refreshCurrentPage();
  }
});

// Verificar periódicamente si el token está próximo a expirar
setInterval(() => {
  if (currentUser && currentUser.isTokenExpiringSoon()) {
    showNotification('Tu sesión expirará pronto. La página se actualizará automáticamente.', 'warning', 5000);
  }
}, 5 * 60 * 1000); // Verificar cada 5 minutos

// Manejar errores globales de JavaScript
window.addEventListener('error', (e) => {
  console.error('Error global:', e.error);
  showNotification('Ha ocurrido un error inesperado', 'error');
});

// Log para debugging
console.log('Admin.js cargado correctamente');