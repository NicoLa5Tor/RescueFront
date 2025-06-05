// static/js/admin.js

// ===== GESTIÓN DE USUARIOS =====

let usersTable = null;
let currentEditingUser = null;

// Cargar usuarios
async function loadUsers() {
    showLoading('Cargando usuarios...');
    try {
        const users = await apiClient.getUsers();
        renderUsersTable(users);
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Error loading users:', error);
    }
}

// Renderizar tabla de usuarios
function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-sm me-2">
                        <span class="avatar-title rounded-circle bg-primary">
                            ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                    </div>
                    <div>
                        <h6 class="mb-0">${user.name || 'Sin nombre'}</h6>
                        <small class="text-muted">${user.email}</small>
                    </div>
                </div>
            </td>
            <td>${user.age || 'N/A'}</td>
            <td>
                <span class="badge bg-${user.status === 'active' ? 'success' : 'secondary'}">
                    ${user.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>${formatDate(user.created_at || new Date())}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-info" onclick="viewUser(${user.id})" 
                            data-bs-toggle="tooltip" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editUser(${user.id})"
                            data-bs-toggle="tooltip" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})"
                            data-bs-toggle="tooltip" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Reinicializar tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Ver detalles de usuario
async function viewUser(userId) {
    try {
        const user = await apiClient.getUser(userId);
        
        Swal.fire({
            title: 'Detalles del Usuario',
            html: `
                <div class="text-start">
                    <p><strong>ID:</strong> ${user.id}</p>
                    <p><strong>Nombre:</strong> ${user.name || 'N/A'}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Edad:</strong> ${user.age || 'N/A'}</p>
                    <p><strong>Estado:</strong> ${user.status === 'active' ? 'Activo' : 'Inactivo'}</p>
                    <p><strong>Creado:</strong> ${formatDate(user.created_at || new Date())}</p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Cerrar'
        });
    } catch (error) {
        console.error('Error viewing user:', error);
    }
}

// Editar usuario
async function editUser(userId) {
    try {
        const user = await apiClient.getUser(userId);
        currentEditingUser = user;
        
        // Llenar el formulario
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserName').value = user.name || '';
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserAge').value = user.age || '';
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
    } catch (error) {
        console.error('Error editing user:', error);
    }
}

// Guardar cambios de usuario
async function saveUserChanges() {
    const userId = document.getElementById('editUserId').value;
    const userData = {
        name: document.getElementById('editUserName').value,
        email: document.getElementById('editUserEmail').value,
        age: parseInt(document.getElementById('editUserAge').value) || null
    };
    
    try {
        showLoading('Guardando cambios...');
        await apiClient.updateUser(userId, userData);
        hideLoading();
        showNotification('Usuario actualizado correctamente', 'success');
        
        // Cerrar modal y recargar tabla
        bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
        loadUsers();
    } catch (error) {
        hideLoading();
        console.error('Error saving user:', error);
    }
}

// Crear nuevo usuario
async function createUser() {
    const { value: formValues } = await Swal.fire({
        title: 'Crear Nuevo Usuario',
        html: `
            <input id="swal-name" class="swal2-input" placeholder="Nombre">
            <input id="swal-email" class="swal2-input" placeholder="Email" type="email">
            <input id="swal-age" class="swal2-input" placeholder="Edad" type="number" min="1" max="120">
            <input id="swal-password" class="swal2-input" placeholder="Contraseña" type="password">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Crear',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return {
                name: document.getElementById('swal-name').value,
                email: document.getElementById('swal-email').value,
                age: parseInt(document.getElementById('swal-age').value) || null,
                password: document.getElementById('swal-password').value
            }
        }
    });
    
    if (formValues) {
        try {
            showLoading('Creando usuario...');
            await apiClient.createUser(formValues);
            hideLoading();
            showNotification('Usuario creado correctamente', 'success');
            loadUsers();
        } catch (error) {
            hideLoading();
            console.error('Error creating user:', error);
        }
    }
}

// Eliminar usuario
async function deleteUser(userId) {
    const confirmed = await confirmAction(
        '¿Eliminar usuario?',
        'Esta acción no se puede deshacer'
    );
    
    if (confirmed) {
        try {
            showLoading('Eliminando usuario...');
            await apiClient.deleteUser(userId);
            hideLoading();
            showNotification('Usuario eliminado correctamente', 'success');
            loadUsers();
        } catch (error) {
            hideLoading();
            console.error('Error deleting user:', error);
        }
    }
}

// Filtrar usuarios por edad
async function filterUsersByAge() {
    const { value: formValues } = await Swal.fire({
        title: 'Filtrar por Edad',
        html: `
            <input id="swal-min-age" class="swal2-input" placeholder="Edad mínima" type="number" min="1">
            <input id="swal-max-age" class="swal2-input" placeholder="Edad máxima" type="number" min="1">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Filtrar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return {
                minAge: document.getElementById('swal-min-age').value,
                maxAge: document.getElementById('swal-max-age').value
            }
        }
    });
    
    if (formValues && formValues.minAge && formValues.maxAge) {
        try {
            showLoading('Filtrando usuarios...');
            const users = await apiClient.getUsersByAge(formValues.minAge, formValues.maxAge);
            renderUsersTable(users);
            hideLoading();
        } catch (error) {
            hideLoading();
            console.error('Error filtering users:', error);
        }
    }
}

// ===== GESTIÓN DE EMPRESAS =====

let empresasTable = null;
let currentEditingEmpresa = null;

// Cargar empresas
async function loadEmpresas() {
    showLoading('Cargando empresas...');
    try {
        const empresas = await apiClient.getEmpresas();
        renderEmpresasGrid(empresas);
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Error loading empresas:', error);
    }
}

// Renderizar grid de empresas
function renderEmpresasGrid(empresas) {
    const container = document.getElementById('empresasGrid');
    if (!container) return;
    
    container.innerHTML = empresas.map(empresa => `
        <div class="col-md-6 col-lg-4" data-aos="fade-up">
            <div class="card modern-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title mb-0">${empresa.nombre}</h5>
                        <span class="badge bg-${empresa.active ? 'success' : 'secondary'}">
                            ${empresa.active ? 'Activa' : 'Inactiva'}
                        </span>
                    </div>
                    <p class="card-text text-muted">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        ${empresa.ubicacion || 'Sin ubicación'}
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="fas fa-users me-1"></i>
                            ${empresa.usuarios_count || 0} usuarios
                        </small>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary" onclick="viewEmpresa(${empresa.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning" onclick="editEmpresa(${empresa.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteEmpresa(${empresa.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Reinicializar AOS
    AOS.refresh();
}

// Ver detalles de empresa
async function viewEmpresa(empresaId) {
    try {
        const empresa = await apiClient.getEmpresa(empresaId);
        const usuarios = await apiClient.getUsuariosByEmpresa(empresaId);
        
        Swal.fire({
            title: empresa.nombre,
            html: `
                <div class="text-start">
                    <p><strong>ID:</strong> ${empresa.id}</p>
                    <p><strong>Ubicación:</strong> ${empresa.ubicacion || 'N/A'}</p>
                    <p><strong>Estado:</strong> ${empresa.active ? 'Activa' : 'Inactiva'}</p>
                    <p><strong>Usuarios:</strong> ${usuarios.length}</p>
                    <p><strong>Creada:</strong> ${formatDate(empresa.created_at || new Date())}</p>
                    <hr>
                    <h6>Usuarios de la empresa:</h6>
                    <ul class="list-unstyled">
                        ${usuarios.slice(0, 5).map(u => `<li>• ${u.nombre || u.email}</li>`).join('')}
                        ${usuarios.length > 5 ? `<li><em>... y ${usuarios.length - 5} más</em></li>` : ''}
                    </ul>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Cerrar',
            width: '600px'
        });
    } catch (error) {
        console.error('Error viewing empresa:', error);
    }
}

// Crear nueva empresa
async function createEmpresa() {
    const { value: formValues } = await Swal.fire({
        title: 'Crear Nueva Empresa',
        html: `
            <input id="swal-nombre" class="swal2-input" placeholder="Nombre de la empresa">
            <input id="swal-ubicacion" class="swal2-input" placeholder="Ubicación">
            <select id="swal-active" class="swal2-select">
                <option value="true">Activa</option>
                <option value="false">Inactiva</option>
            </select>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Crear',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return {
                nombre: document.getElementById('swal-nombre').value,
                ubicacion: document.getElementById('swal-ubicacion').value,
                active: document.getElementById('swal-active').value === 'true'
            }
        }
    });
    
    if (formValues) {
        try {
            showLoading('Creando empresa...');
            await apiClient.createEmpresa(formValues);
            hideLoading();
            showNotification('Empresa creada correctamente', 'success');
            loadEmpresas();
        } catch (error) {
            hideLoading();
            console.error('Error creating empresa:', error);
        }
    }
}

// Editar empresa
async function editEmpresa(empresaId) {
    try {
        const empresa = await apiClient.getEmpresa(empresaId);
        
        const { value: formValues } = await Swal.fire({
            title: 'Editar Empresa',
            html: `
                <input id="swal-nombre" class="swal2-input" placeholder="Nombre" value="${empresa.nombre}">
                <input id="swal-ubicacion" class="swal2-input" placeholder="Ubicación" value="${empresa.ubicacion || ''}">
                <select id="swal-active" class="swal2-select">
                    <option value="true" ${empresa.active ? 'selected' : ''}>Activa</option>
                    <option value="false" ${!empresa.active ? 'selected' : ''}>Inactiva</option>
                </select>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                return {
                    nombre: document.getElementById('swal-nombre').value,
                    ubicacion: document.getElementById('swal-ubicacion').value,
                    active: document.getElementById('swal-active').value === 'true'
                }
            }
        });
        
        if (formValues) {
            showLoading('Actualizando empresa...');
            await apiClient.updateEmpresa(empresaId, formValues);
            hideLoading();
            showNotification('Empresa actualizada correctamente', 'success');
            loadEmpresas();
        }
    } catch (error) {
        console.error('Error editing empresa:', error);
    }
}

// Eliminar empresa
async function deleteEmpresa(empresaId) {
    const confirmed = await confirmAction(
        '¿Eliminar empresa?',
        'Se eliminarán todos los usuarios asociados. Esta acción no se puede deshacer.'
    );
    
    if (confirmed) {
        try {
            showLoading('Eliminando empresa...');
            await apiClient.deleteEmpresa(empresaId);
            hideLoading();
            showNotification('Empresa eliminada correctamente', 'success');
            loadEmpresas();
        } catch (error) {
            hideLoading();
            console.error('Error deleting empresa:', error);
        }
    }
}

// Buscar empresas por ubicación
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
            const empresas = await apiClient.searchEmpresasByUbicacion(ubicacion);
            renderEmpresasGrid(empresas);
            hideLoading();
            
            if (empresas.length === 0) {
                showNotification('No se encontraron empresas en esa ubicación', 'info');
            }
        } catch (error) {
            hideLoading();
            console.error('Error searching empresas:', error);
        }
    }
}

// ===== ESTADÍSTICAS =====

// Cargar estadísticas
async function loadStats() {
    showLoading('Cargando estadísticas...');
    try {
        const stats = await apiClient.getEmpresaStats();
        renderStats(stats);
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Error loading stats:', error);
    }
}

// Renderizar estadísticas
function renderStats(stats) {
    // Actualizar cards de estadísticas
    document.getElementById('totalUsersCount').textContent = stats.total_users || 0;
    document.getElementById('totalEmpresasCount').textContent = stats.total_empresas || 0;
    document.getElementById('activeEmpresasCount').textContent = stats.active_empresas || 0;
    document.getElementById('avgUsersPerEmpresa').textContent = 
        Math.round(stats.avg_users_per_empresa || 0);
    
    // Crear gráficos
    createUsersChart(stats.users_by_empresa || []);
    createGrowthChart(stats.monthly_growth || []);
    createLocationChart(stats.empresas_by_location || []);
}

// Gráfico de usuarios por empresa
function createUsersChart(data) {
    const labels = data.map(d => d.empresa_name);
    const values = data.map(d => d.users_count);
    
    createBarChart('usersChart', labels, values, 'Usuarios');
}

// Gráfico de crecimiento mensual
function createGrowthChart(data) {
    const labels = data.map(d => d.month);
    const users = data.map(d => d.new_users);
    const empresas = data.map(d => d.new_empresas);
    
    const ctx = document.getElementById('growthChart')?.getContext('2d');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nuevos Usuarios',
                data: users,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }, {
                label: 'Nuevas Empresas',
                data: empresas,
                borderColor: '#764ba2',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });
}

// Gráfico de empresas por ubicación
function createLocationChart(data) {
    const labels = data.map(d => d.ubicacion || 'Sin ubicación');
    const values = data.map(d => d.count);
    
    createDoughnutChart('locationChart', labels, values);
}

// ===== INICIALIZACIÓN =====

document.addEventListener('DOMContentLoaded', () => {
    // Detectar en qué página estamos
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('/admin/users')) {
        loadUsers();
    } else if (currentPage.includes('/admin/empresas')) {
        loadEmpresas();
    } else if (currentPage.includes('/admin/stats')) {
        loadStats();
    } else if (currentPage.includes('/admin')) {
        // Dashboard principal - cargar resumen
        loadDashboardSummary();
    }
});

// Cargar resumen del dashboard
async function loadDashboardSummary() {
    try {
        // Cargar datos en paralelo
        const [users, empresas, stats] = await Promise.all([
            apiClient.getUsers(),
            apiClient.getEmpresas(),
            apiClient.getEmpresaStats()
        ]);
        
        // Actualizar contadores
        document.getElementById('dashboardUsersCount').textContent = users.length;
        document.getElementById('dashboardEmpresasCount').textContent = empresas.length;
        document.getElementById('dashboardActiveCount').textContent = 
            empresas.filter(e => e.active).length;
        
        // Mini gráfico
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
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            display: false
                        },
                        x: {
                            display: false
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading dashboard summary:', error);
    }
}