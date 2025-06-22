// static/js/empresa.js

// ===== GESTIÓN DE EMPLEADOS =====

let empleadosTable = null;
let currentEmpresaId = window.CURRENT_USER?.empresa_id || 1;

// Cargar empleados de la empresa
async function loadEmpleados() {
    showLoading('Cargando empleados...');
    try {
        const empleados = await apiClient.getUsuariosByEmpresa(currentEmpresaId);
        renderEmpleadosTable(empleados);
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Error loading empleados:', error);
    }
}

// Renderizar tabla de empleados
function renderEmpleadosTable(empleados) {
    const tbody = document.getElementById('empleadosTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = empleados.map(empleado => `
        <tr>
            <td>${empleado.id}</td>
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-sm me-2">
                        <span class="avatar-title rounded-circle bg-info">
                            ${empleado.nombre ? empleado.nombre.charAt(0).toUpperCase() : 'E'}
                        </span>
                    </div>
                    <div>
                        <h6 class="mb-0">${empleado.nombre || 'Sin nombre'}</h6>
                        <small class="text-muted">${empleado.email}</small>
                    </div>
                </div>
            </td>
            <td>${empleado.departamento || 'Sin asignar'}</td>
            <td>${empleado.cargo || 'Sin cargo'}</td>
            <td>
                <span class="badge bg-${empleado.active ? 'success' : 'secondary'}">
                    ${empleado.active ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-info" onclick="viewEmpleado(${empleado.id})"
                            data-bs-toggle="tooltip" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editEmpleado(${empleado.id})"
                            data-bs-toggle="tooltip" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmpleado(${empleado.id})"
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

// Ver detalles de empleado
async function viewEmpleado(empleadoId) {
    try {
        const empleado = await apiClient.getUsuarioByEmpresa(currentEmpresaId, empleadoId);
        
        Swal.fire({
            title: 'Detalles del Empleado',
            html: `
                <div class="text-start">
                    <div class="row">
                        <div class="col-6">
                            <p><strong>ID:</strong> ${empleado.id}</p>
                            <p><strong>Nombre:</strong> ${empleado.nombre || 'N/A'}</p>
                            <p><strong>Email:</strong> ${empleado.email}</p>
                            <p><strong>Departamento:</strong> ${empleado.departamento || 'N/A'}</p>
                        </div>
                        <div class="col-6">
                            <p><strong>Cargo:</strong> ${empleado.cargo || 'N/A'}</p>
                            <p><strong>Teléfono:</strong> ${empleado.telefono || 'N/A'}</p>
                            <p><strong>Estado:</strong> ${empleado.active ? 'Activo' : 'Inactivo'}</p>
                            <p><strong>Ingreso:</strong> ${formatDate(empleado.fecha_ingreso || new Date())}</p>
                        </div>
                    </div>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Cerrar',
            width: '600px'
        });
    } catch (error) {
        console.error('Error viewing empleado:', error);
    }
}

// Crear nuevo empleado
async function createEmpleado() {
    const { value: formValues } = await Swal.fire({
        title: 'Crear Nuevo Empleado',
        html: `
            <div class="row">
                <div class="col-6">
                    <input id="swal-nombre" class="swal2-input" placeholder="Nombre completo">
                    <input id="swal-email" class="swal2-input" placeholder="Email" type="email">
                    <input id="swal-telefono" class="swal2-input" placeholder="Teléfono">
                </div>
                <div class="col-6">
                    <input id="swal-departamento" class="swal2-input" placeholder="Departamento">
                    <input id="swal-cargo" class="swal2-input" placeholder="Cargo">
                    <input id="swal-password" class="swal2-input" placeholder="Contraseña" type="password">
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Crear',
        cancelButtonText: 'Cancelar',
        width: '600px',
        preConfirm: () => {
            return {
                nombre: document.getElementById('swal-nombre').value,
                email: document.getElementById('swal-email').value,
                telefono: document.getElementById('swal-telefono').value,
                departamento: document.getElementById('swal-departamento').value,
                cargo: document.getElementById('swal-cargo').value,
                password: document.getElementById('swal-password').value,
                active: true
            }
        }
    });
    
    if (formValues) {
        try {
            showLoading('Creando empleado...');
            await apiClient.createUsuarioForEmpresa(currentEmpresaId, formValues);
            hideLoading();
            showNotification('Empleado creado correctamente', 'success');
            loadEmpleados();
        } catch (error) {
            hideLoading();
            console.error('Error creating empleado:', error);
        }
    }
}

// Editar empleado
async function editEmpleado(empleadoId) {
    try {
        const empleado = await apiClient.getUsuarioByEmpresa(currentEmpresaId, empleadoId);
        
        const { value: formValues } = await Swal.fire({
            title: 'Editar Empleado',
            html: `
                <div class="row">
                    <div class="col-6">
                        <input id="swal-nombre" class="swal2-input" placeholder="Nombre" value="${empleado.nombre || ''}">
                        <input id="swal-email" class="swal2-input" placeholder="Email" value="${empleado.email}" type="email">
                        <input id="swal-telefono" class="swal2-input" placeholder="Teléfono" value="${empleado.telefono || ''}">
                    </div>
                    <div class="col-6">
                        <input id="swal-departamento" class="swal2-input" placeholder="Departamento" value="${empleado.departamento || ''}">
                        <input id="swal-cargo" class="swal2-input" placeholder="Cargo" value="${empleado.cargo || ''}">
                        <select id="swal-active" class="swal2-select">
                            <option value="true" ${empleado.active ? 'selected' : ''}>Activo</option>
                            <option value="false" ${!empleado.active ? 'selected' : ''}>Inactivo</option>
                        </select>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            cancelButtonText: 'Cancelar',
            width: '600px',
            preConfirm: () => {
                return {
                    nombre: document.getElementById('swal-nombre').value,
                    email: document.getElementById('swal-email').value,
                    telefono: document.getElementById('swal-telefono').value,
                    departamento: document.getElementById('swal-departamento').value,
                    cargo: document.getElementById('swal-cargo').value,
                    active: document.getElementById('swal-active').value === 'true'
                }
            }
        });
        
        if (formValues) {
            showLoading('Actualizando empleado...');
            await apiClient.updateUsuarioByEmpresa(currentEmpresaId, empleadoId, formValues);
            hideLoading();
            showNotification('Empleado actualizado correctamente', 'success');
            loadEmpleados();
        }
    } catch (error) {
        console.error('Error editing empleado:', error);
    }
}

// Eliminar empleado
async function deleteEmpleado(empleadoId) {
    const confirmed = await confirmAction(
        '¿Eliminar empleado?',
        'Esta acción no se puede deshacer'
    );
    
    if (confirmed) {
        try {
            showLoading('Eliminando empleado...');
            await apiClient.deleteUsuarioByEmpresa(currentEmpresaId, empleadoId);
            hideLoading();
            showNotification('Empleado eliminado correctamente', 'success');
            loadEmpleados();
        } catch (error) {
            hideLoading();
            console.error('Error deleting empleado:', error);
        }
    }
}

// Buscar empleados
function searchEmpleados() {
    const searchTerm = document.getElementById('searchEmpleados').value.toLowerCase();
    const rows = document.querySelectorAll('#empleadosTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// ===== PERFIL DE EMPRESA =====

// Cargar perfil de empresa
async function loadEmpresaProfile() {
    showLoading('Cargando información...');
    try {
        const empresa = await apiClient.getEmpresa(currentEmpresaId);
        renderEmpresaProfile(empresa);
        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Error loading empresa profile:', error);
    }
}

// Renderizar perfil de empresa
function renderEmpresaProfile(empresa) {
    // Información básica
    document.getElementById('empresaNombre').textContent = empresa.nombre;
    document.getElementById('empresaUbicacion').textContent = empresa.ubicacion || 'Sin ubicación';
    document.getElementById('empresaStatus').innerHTML = empresa.active 
        ? '<span class="badge bg-success">Activa</span>' 
        : '<span class="badge bg-secondary">Inactiva</span>';
    document.getElementById('empresaCreated').textContent = formatDate(empresa.created_at || new Date());
    
    // Llenar formulario de edición
    document.getElementById('editEmpresaNombre').value = empresa.nombre;
    document.getElementById('editEmpresaUbicacion').value = empresa.ubicacion || '';
    document.getElementById('editEmpresaDescripcion').value = empresa.descripcion || '';
    document.getElementById('editEmpresaTelefono').value = empresa.telefono || '';
    document.getElementById('editEmpresaEmail').value = empresa.email || '';
}

// Actualizar perfil de empresa
async function updateEmpresaProfile() {
    const empresaData = {
        nombre: document.getElementById('editEmpresaNombre').value,
        ubicacion: document.getElementById('editEmpresaUbicacion').value,
        descripcion: document.getElementById('editEmpresaDescripcion').value,
        telefono: document.getElementById('editEmpresaTelefono').value,
        email: document.getElementById('editEmpresaEmail').value
    };
    
    try {
        showLoading('Actualizando información...');
        await apiClient.updateEmpresa(currentEmpresaId, empresaData);
        hideLoading();
        showNotification('Información actualizada correctamente', 'success');
        loadEmpresaProfile();
    } catch (error) {
        hideLoading();
        console.error('Error updating empresa:', error);
    }
}

// ===== DASHBOARD DE EMPRESA =====

// Cargar dashboard de empresa
async function loadEmpresaDashboard() {
    try {
        // Cargar datos en paralelo
        const [empresa, empleados] = await Promise.all([
            apiClient.getEmpresa(currentEmpresaId),
            apiClient.getUsuariosByEmpresa(currentEmpresaId)
        ]);
        
        // Actualizar métricas
        document.getElementById('totalEmpleados').textContent = empleados.length;
        document.getElementById('empleadosActivos').textContent = 
            empleados.filter(e => e.active).length;
        document.getElementById('departamentos').textContent = 
            new Set(empleados.map(e => e.departamento).filter(Boolean)).size;
        
        // Crear gráficos
        createDepartmentChart(empleados);
        createActivityChart();
        
        // Tabla de empleados recientes
        renderRecentEmpleados(empleados.slice(0, 5));
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Gráfico de empleados por departamento
function createDepartmentChart(empleados) {
    const departments = {};
    empleados.forEach(emp => {
        const dept = emp.departamento || 'Sin asignar';
        departments[dept] = (departments[dept] || 0) + 1;
    });
    
    const labels = Object.keys(departments);
    const data = Object.values(departments);
    
    createDoughnutChart('departmentChart', labels, data);
}

// Gráfico de actividad
function createActivityChart() {
    const ctx = document.getElementById('activityChart')?.getContext('2d');
    if (!ctx) return;

    let chartData = { labels: [], values: [], label: 'Actividad' };
    apiClient.getEmpresaActivity(currentEmpresaId)
        .then(data => {
            chartData = data;
        })
        .catch(err => {
            console.error('Error fetching activity:', err);
        })
        .finally(() => {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: chartData.label,
                        data: chartData.values,
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
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        });
}

// Renderizar empleados recientes
function renderRecentEmpleados(empleados) {
    const tbody = document.getElementById('recentEmpleadosTable');
    if (!tbody) return;
    
    tbody.innerHTML = empleados.map(emp => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <div class="avatar-sm me-2">
                        <span class="avatar-title rounded-circle bg-primary">
                            ${emp.nombre ? emp.nombre.charAt(0).toUpperCase() : 'E'}
                        </span>
                    </div>
                    <div>
                        <h6 class="mb-0">${emp.nombre || 'Sin nombre'}</h6>
                        <small class="text-muted">${emp.email}</small>
                    </div>
                </div>
            </td>
            <td>${emp.departamento || 'Sin asignar'}</td>
            <td>
                <span class="badge bg-${emp.active ? 'success' : 'secondary'}">
                    ${emp.active ? 'Activo' : 'Inactivo'}
                </span>
            </td>
        </tr>
    `).join('');
}

// ===== REPORTES =====

// Generar reporte de empleados
async function generateEmpleadosReport() {
    showLoading('Generando reporte...');
    try {
        const empleados = await apiClient.getUsuariosByEmpresa(currentEmpresaId);
        
        // Crear contenido del reporte
        let reportContent = `
            <h3>Reporte de Empleados</h3>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Total de empleados:</strong> ${empleados.length}</p>
            <p><strong>Empleados activos:</strong> ${empleados.filter(e => e.active).length}</p>
            <hr>
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Departamento</th>
                        <th>Cargo</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${empleados.map(emp => `
                        <tr>
                            <td>${emp.nombre || 'N/A'}</td>
                            <td>${emp.email}</td>
                            <td>${emp.departamento || 'N/A'}</td>
                            <td>${emp.cargo || 'N/A'}</td>
                            <td>${emp.active ? 'Activo' : 'Inactivo'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        hideLoading();
        
        // Mostrar reporte
        Swal.fire({
            title: 'Reporte Generado',
            html: reportContent,
            width: '800px',
            showCancelButton: true,
            confirmButtonText: 'Imprimir',
            cancelButtonText: 'Cerrar',
            preConfirm: () => {
                window.print();
            }
        });
        
    } catch (error) {
        hideLoading();
        console.error('Error generating report:', error);
    }
}

// ===== INICIALIZACIÓN =====

document.addEventListener('DOMContentLoaded', () => {
    // Obtener ID de empresa del usuario actual
    currentEmpresaId = window.CURRENT_USER?.empresa_id || 1;
    
    // Detectar en qué página estamos
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('/empresa/empleados')) {
        loadEmpleados();
        
        // Event listener para búsqueda
        const searchInput = document.getElementById('searchEmpleados');
        if (searchInput) {
            searchInput.addEventListener('input', searchEmpleados);
        }
    } else if (currentPage.includes('/empresa/perfil')) {
        loadEmpresaProfile();
    } else if (currentPage.includes('/empresa')) {
        // Dashboard principal
        loadEmpresaDashboard();
    }
});

// ===== FUNCIONES DE EXPORTACIÓN =====

// Exportar empleados a CSV
function exportEmpleadosToCSV() {
    const table = document.getElementById('empleadosTableBody');
    const rows = Array.from(table.querySelectorAll('tr'));
    
    let csv = 'ID,Nombre,Email,Departamento,Cargo,Estado\n';
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData = [
            cells[0].textContent,
            cells[1].querySelector('h6').textContent,
            cells[1].querySelector('small').textContent,
            cells[2].textContent,
            cells[3].textContent,
            cells[4].textContent.trim()
        ];
        csv += rowData.join(',') + '\n';
    });
    
    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `empleados_${currentEmpresaId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showNotification('Archivo CSV descargado', 'success');
}